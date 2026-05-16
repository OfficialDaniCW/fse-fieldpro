CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS parts (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  part_number           TEXT NOT NULL DEFAULT '',
  description           TEXT,
  manufacturer_part_ref TEXT,
  brand                 TEXT,
  pump_model            TEXT,
  system_area           TEXT,
  component_type        TEXT,
  image_url             TEXT,
  manual_ids            TEXT[] DEFAULT '{}',
  notes                 TEXT,
  is_verified           BOOLEAN DEFAULT false,
  created_date          TIMESTAMPTZ DEFAULT now(),
  updated_date          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manuals (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title             TEXT NOT NULL DEFAULT '',
  manufacturer      TEXT,
  model             TEXT,
  manual_type       TEXT,
  version           TEXT,
  component_type    TEXT,
  pdf_url           TEXT,
  pdf_file          TEXT,
  source_url        TEXT,
  image_urls        JSONB,
  processing_status TEXT,
  brand_category    TEXT,
  part_ids          TEXT[] DEFAULT '{}',
  wiki_content      TEXT,
  created_date      TIMESTAMPTZ DEFAULT now(),
  updated_date      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entity_type  TEXT,
  entity_id    TEXT,
  action       TEXT,
  details      JSONB,
  user_id      TEXT,
  created_date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_logs (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query        TEXT NOT NULL DEFAULT '',
  result_type  TEXT,
  result_count INTEGER,
  user_id      TEXT,
  created_date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging_uploads (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  manual_title   TEXT,
  manufacturer   TEXT,
  json_file_url  TEXT,
  image_urls     JSONB,
  md_file_url    TEXT,
  pdf_file_url   TEXT,
  status         TEXT DEFAULT 'pending',
  result         JSONB,
  created_date   TIMESTAMPTZ DEFAULT now(),
  updated_date   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS part_verifications (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  part_id      TEXT,
  status       TEXT,
  notes        TEXT,
  verified_by  TEXT,
  created_date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_name   TEXT,
  metadata     JSONB,
  messages     JSONB DEFAULT '[]',
  user_id      TEXT,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_date trigger
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parts_updated_date BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER manuals_updated_date BEFORE UPDATE ON manuals FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER staging_uploads_updated_date BEFORE UPDATE ON staging_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_date();
CREATE TRIGGER conversations_updated_date BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_date();
