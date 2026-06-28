CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS api_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  allowed_origins text[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute integer NOT NULL DEFAULT 120,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gis_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'active', 'archived')),
  feature_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz
);

CREATE TABLE IF NOT EXISTS protected_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES gis_datasets(id) ON DELETE CASCADE,
  external_id text,
  name text NOT NULL,
  category text NOT NULL,
  province text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  geom geometry(MultiPolygon, 4326) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS protected_areas_dataset_idx ON protected_areas(dataset_id);
CREATE INDEX IF NOT EXISTS protected_areas_geom_idx ON protected_areas USING gist (geom);

CREATE TABLE IF NOT EXISTS risk_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES api_clients(id),
  dataset_id uuid REFERENCES gis_datasets(id),
  input jsonb NOT NULL,
  resolved_location jsonb,
  status text NOT NULL CHECK (status IN ('restricted', 'near', 'watch', 'clear', 'out_of_scope', 'error')),
  decision text NOT NULL,
  nearest_area jsonb,
  distance_km numeric,
  thresholds jsonb NOT NULL,
  warnings text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS risk_checks_client_created_idx ON risk_checks(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS risk_checks_dataset_idx ON risk_checks(dataset_id);
