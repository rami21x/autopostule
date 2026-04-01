-- Migration 002 : Support OAuth (Google Login)
-- Rendre password_hash nullable pour les utilisateurs Google
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Ajouter les colonnes OAuth
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local';
