-- Migration 003 : Email tracking + notes + contact email

-- Ajouter email de contact sur les candidatures
ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- Ajouter notes sur les candidatures (si pas deja present)
-- notes existe deja dans migration.sql, on s'assure juste

-- Table historique des emails envoyés
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  candidature_id INTEGER NOT NULL REFERENCES candidatures(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'candidature' ou 'relance'
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  resend_id VARCHAR(255), -- ID retourné par Resend
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'bounced'
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Ajouter colonne relance_delay_days (delai avant relance) sur candidatures
ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS relance_delay_days INTEGER DEFAULT 15;
