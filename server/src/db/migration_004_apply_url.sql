-- Migration 004 : URL de candidature (où postuler)

ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS apply_url TEXT;
