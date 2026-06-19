-- Odosan application schema for AWS Aurora PostgreSQL (Serverless v2).
-- Run this once against the cluster, before hitting POST /api/seed-providers.
--
--   psql "$DATABASE_URL" -f apps/web/db/schema.sql
--
-- DATABASE_URL should point at the RDS Proxy endpoint, e.g.
--   postgres://app:<password>@odosan-proxy.proxy-XXXX.us-west-1.rds.amazonaws.com:5432/odosan?sslmode=require

-- ----------------------------------------------------------------------------
-- Application tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS providers (
  provider_id          uuid PRIMARY KEY,
  name                 text NOT NULL,
  category             text NOT NULL,
  areas_served         text[] NOT NULL DEFAULT '{}',
  phone                text,
  website              text,
  google_maps_url      text,
  rating               numeric(3, 2),
  verification_status  text NOT NULL DEFAULT 'unverified',
  source_platform      text NOT NULL DEFAULT 'manual',
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS providers_category_idx ON providers (category);
CREATE INDEX IF NOT EXISTS providers_areas_served_gin ON providers USING GIN (areas_served);

CREATE TABLE IF NOT EXISTS leads (
  lead_id              uuid PRIMARY KEY,
  category             text NOT NULL,
  problem              text NOT NULL,
  scope                text NOT NULL,
  fair_price_range     text NOT NULL,
  severity             text NOT NULL,
  neighborhood         text NOT NULL,
  photo_keys           text[] NOT NULL DEFAULT '{}',
  status               text NOT NULL DEFAULT 'open',
  chosen_provider_id   uuid REFERENCES providers (provider_id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_chosen_provider_idx ON leads (chosen_provider_id);

-- ----------------------------------------------------------------------------
-- Data pipeline tables — populated from odosan-data-pipeline output
-- ----------------------------------------------------------------------------

-- One row per home from output/home_profiles.json. Per-home data — the
-- HOMEOWNER side of the privacy line. Never exposed to providers in raw form.
CREATE TABLE IF NOT EXISTS home_profiles (
  parcel_id      text PRIMARY KEY,
  address        text NOT NULL,
  zip            text NOT NULL,
  year_built     integer,
  owner_type     text,
  systems        jsonb NOT NULL,
  solar          jsonb NOT NULL,
  need_scores    jsonb NOT NULL,
  top_needs      jsonb NOT NULL,
  imported_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_profiles_zip_idx ON home_profiles (zip);
CREATE INDEX IF NOT EXISTS home_profiles_address_lower_idx ON home_profiles (lower(address));

-- One row per ZIP from output/territory_summary.json. PROVIDER side of the
-- privacy line — aggregate demand counts only, NEVER per-home.
CREATE TABLE IF NOT EXISTS territory_summaries (
  zip            text PRIMARY KEY,
  homes_count    integer NOT NULL,
  demand         jsonb NOT NULL,
  imported_at    timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- better-auth tables (default v1.x schema — kysely expects these exact names)
-- Docs: https://www.better-auth.com/docs/concepts/database
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "user" (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  email           text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image           text,
  "createdAt"     timestamptz NOT NULL DEFAULT now(),
  "updatedAt"     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  id           text PRIMARY KEY,
  "userId"     text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  token        text NOT NULL UNIQUE,
  "expiresAt"  timestamptz NOT NULL,
  "ipAddress"  text,
  "userAgent"  text,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_user_id_idx ON "session" ("userId");

CREATE TABLE IF NOT EXISTS "account" (
  id                      text PRIMARY KEY,
  "userId"                text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  "accountId"             text NOT NULL,
  "providerId"            text NOT NULL,
  "accessToken"           text,
  "refreshToken"          text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope                   text,
  "idToken"               text,
  password                text,
  "createdAt"             timestamptz NOT NULL DEFAULT now(),
  "updatedAt"             timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("providerId", "accountId")
);

CREATE INDEX IF NOT EXISTS account_user_id_idx ON "account" ("userId");

CREATE TABLE IF NOT EXISTS "verification" (
  id          text PRIMARY KEY,
  identifier  text NOT NULL,
  value       text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification" (identifier);
