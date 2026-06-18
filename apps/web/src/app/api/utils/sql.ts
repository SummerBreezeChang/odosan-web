import { Pool, type QueryResultRow } from 'pg';

/**
 * AWS Aurora PostgreSQL (Serverless v2) connection via node-postgres.
 *
 * Exports a tagged-template function with the SAME shape as the old Neon
 * driver so route handlers don't change:
 *
 *   const rows = await sql`SELECT * FROM providers WHERE id = ${id}`;
 *
 * Returns `rows` directly (not a `{ rows, rowCount }` result object), matching
 * @neondatabase/serverless behavior. Also exposes:
 *   - sql.query(text, values?)      — parameterized query, returns rows
 *   - sql.transaction([sql`...`])   — array-of-queries form Neon supports
 *
 * Pool is cached on globalThis so Fluid Compute warm instances reuse it. Point
 * DATABASE_URL at the RDS Proxy endpoint (NOT the cluster endpoint directly)
 * so serverless invocations don't hammer Aurora with new TCP/TLS handshakes.
 */

type SqlRow = QueryResultRow;
type SqlValues = readonly unknown[];

// A "lazy" tagged-template query we can either await directly or hand to
// sql.transaction([...]). Holds the raw text + values until it's executed.
type LazyQuery<T extends SqlRow = SqlRow> = Promise<T[]> & {
  __text: string;
  __values: unknown[];
};

interface SqlFunction {
  <T extends SqlRow = SqlRow>(
    strings: TemplateStringsArray,
    ...values: SqlValues
  ): LazyQuery<T>;
  query<T extends SqlRow = SqlRow>(text: string, values?: unknown[]): Promise<T[]>;
  transaction<T extends SqlRow = SqlRow>(
    queries: ReadonlyArray<LazyQuery<T>>
  ): Promise<T[][]>;
}

declare global {
  // eslint-disable-next-line no-var
  var __odosanPgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'No database connection string was provided. Set DATABASE_URL to the RDS Proxy endpoint URL.'
    );
  }
  if (!global.__odosanPgPool) {
    global.__odosanPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // RDS Proxy terminates TLS; require it but skip CA verification so we
      // don't have to bundle the RDS CA cert. If you want strict verification,
      // set PGSSLROOTCERT to the rds-ca-rsa2048-g1 PEM path.
      ssl: { rejectUnauthorized: false },
      // Keep individual function instances thin; let RDS Proxy do the pooling.
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return global.__odosanPgPool;
}

// Convert a tagged-template `sql\`SELECT ${a} FROM t WHERE x = ${b}\`` into
// `SELECT $1 FROM t WHERE x = $2` + [a, b].
function buildQuery(
  strings: TemplateStringsArray,
  values: SqlValues
): { text: string; values: unknown[] } {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}${strings[i + 1]}`;
  }
  return { text, values: values as unknown[] };
}

async function runQuery<T extends SqlRow>(text: string, values: unknown[]): Promise<T[]> {
  const pool = getPool();
  const res = await pool.query<T>({ text, values });
  return res.rows;
}

const sql = ((strings: TemplateStringsArray, ...values: SqlValues) => {
  const { text, values: vals } = buildQuery(strings, values);
  const promise = runQuery(text, vals) as LazyQuery;
  promise.__text = text;
  promise.__values = vals;
  return promise;
}) as SqlFunction;

sql.query = <T extends SqlRow = SqlRow>(text: string, values: unknown[] = []) =>
  runQuery<T>(text, values);

sql.transaction = async <T extends SqlRow = SqlRow>(
  queries: ReadonlyArray<LazyQuery<T>>
): Promise<T[][]> => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results: T[][] = [];
    for (const q of queries) {
      const res = await client.query<T>({ text: q.__text, values: q.__values });
      results.push(res.rows);
    }
    await client.query('COMMIT');
    return results;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback failure
    }
    throw err;
  } finally {
    client.release();
  }
};

export default sql;
