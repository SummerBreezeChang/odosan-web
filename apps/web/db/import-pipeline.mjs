#!/usr/bin/env node
/**
 * Load odosan-data-pipeline output into Lightsail Postgres.
 *
 * Usage:
 *   node apps/web/db/import-pipeline.mjs <pipeline-output-dir>
 *
 * Reads:
 *   <pipeline-output-dir>/home_profiles.json
 *   <pipeline-output-dir>/territory_summary.json
 *
 * Upserts into home_profiles and territory_summaries tables.
 * Requires DATABASE_URL in env (or .env.local on the web workspace).
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const envLocal = resolve(here, '..', '.env.local');
if (existsSync(envLocal)) loadEnv({ path: envLocal });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to apps/web/.env.local or export it.');
  process.exit(1);
}

const outputDir = process.argv[2];
if (!outputDir) {
  console.error('Usage: node import-pipeline.mjs <pipeline-output-dir>');
  console.error('Example: node apps/web/db/import-pipeline.mjs "/path/to/odosan-data-pipeline/output"');
  process.exit(1);
}

const profilesPath = resolve(outputDir, 'home_profiles.json');
const territoryPath = resolve(outputDir, 'territory_summary.json');

if (!existsSync(profilesPath) || !existsSync(territoryPath)) {
  console.error('Missing output files. Expected:');
  console.error('  ', profilesPath);
  console.error('  ', territoryPath);
  console.error('Run `python run_pipeline.py` in the pipeline folder first.');
  process.exit(1);
}

const profiles = JSON.parse(readFileSync(profilesPath, 'utf8'));
const territory = JSON.parse(readFileSync(territoryPath, 'utf8'));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log(`→ Upserting ${profiles.length} home profiles...`);
    for (const p of profiles) {
      await client.query(
        `INSERT INTO home_profiles
           (parcel_id, address, zip, year_built, owner_type, systems, solar, need_scores, top_needs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (parcel_id) DO UPDATE SET
           address      = EXCLUDED.address,
           zip          = EXCLUDED.zip,
           year_built   = EXCLUDED.year_built,
           owner_type   = EXCLUDED.owner_type,
           systems      = EXCLUDED.systems,
           solar        = EXCLUDED.solar,
           need_scores  = EXCLUDED.need_scores,
           top_needs    = EXCLUDED.top_needs,
           imported_at  = now()`,
        [
          p.parcel_id,
          p.address,
          p.zip,
          p.year_built ?? null,
          p.owner_type ?? null,
          JSON.stringify(p.systems ?? {}),
          JSON.stringify(p.solar ?? {}),
          JSON.stringify(p.need_scores ?? {}),
          JSON.stringify(p.top_needs ?? []),
        ]
      );
    }

    const zipEntries = Object.entries(territory.by_zip ?? {});
    console.log(`→ Upserting ${zipEntries.length} territory summaries...`);
    for (const [zip, info] of zipEntries) {
      await client.query(
        `INSERT INTO territory_summaries (zip, homes_count, demand)
         VALUES ($1, $2, $3)
         ON CONFLICT (zip) DO UPDATE SET
           homes_count = EXCLUDED.homes_count,
           demand      = EXCLUDED.demand,
           imported_at = now()`,
        [zip, info.homes ?? 0, JSON.stringify(info.demand ?? {})]
      );
    }

    await client.query('COMMIT');

    const profileCount = await client.query('SELECT COUNT(*)::int AS n FROM home_profiles');
    const territoryCount = await client.query('SELECT COUNT(*)::int AS n FROM territory_summaries');
    console.log(`✓ Done. home_profiles=${profileCount.rows[0].n}  territory_summaries=${territoryCount.rows[0].n}`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
