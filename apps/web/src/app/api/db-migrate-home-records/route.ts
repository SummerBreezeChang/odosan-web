import sql from '@/app/api/utils/sql';

/**
 * One-shot idempotent migration. Curl after deploy to create the
 * user_home_briefs + user_home_systems tables on Aurora.
 *
 *   curl -X POST https://www.odosan.tech/api/db-migrate-home-records
 *
 * Safe to call repeatedly — every statement uses IF NOT EXISTS.
 */
export async function POST() {
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS user_home_briefs (
        id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
        category            text NOT NULL,
        neighborhood        text NOT NULL,
        issue               text NOT NULL,
        severity            text NOT NULL,
        scope_of_work       text NOT NULL,
        fair_price_range    text NOT NULL,
        diy_or_pro          text NOT NULL,
        explanation         text NOT NULL,
        confidence          integer NOT NULL DEFAULT 0,
        diy_shopping_query  text NOT NULL DEFAULT '',
        saved_at            timestamptz NOT NULL DEFAULT now()
      );
    `);

    await sql.query(`
      CREATE INDEX IF NOT EXISTS user_home_briefs_user_idx
        ON user_home_briefs (user_id, saved_at DESC);
    `);

    await sql.query(`
      CREATE TABLE IF NOT EXISTS user_home_systems (
        id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                  text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
        system_type              text NOT NULL,
        make                     text,
        model                    text,
        serial                   text,
        install_date             text,
        manufacture_date         text,
        capacity                 text,
        fuel_or_type             text,
        estimated_age_years      integer,
        expected_lifespan_years  integer,
        notes                    text,
        recall_or_safety_flag    text,
        confidence               integer NOT NULL DEFAULT 0,
        raw_text                 text NOT NULL DEFAULT '',
        photo_s3_bucket          text,
        photo_s3_key             text,
        photo_s3_region          text,
        documented_at            timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, system_type)
      );
    `);

    await sql.query(`
      CREATE INDEX IF NOT EXISTS user_home_systems_user_idx
        ON user_home_systems (user_id, documented_at DESC);
    `);

    return Response.json({ ok: true, tables: ['user_home_briefs', 'user_home_systems'] });
  } catch (error) {
    console.error('[/api/db-migrate-home-records error]', error);
    return Response.json(
      { error: 'Migration failed', detail: String(error) },
      { status: 500 }
    );
  }
}
