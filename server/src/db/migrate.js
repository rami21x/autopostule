const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('./pool');

async function migrate() {
  try {
    // Migration 001 : tables de base
    const sql1 = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');
    await pool.query(sql1);
    console.log('Migration 001 réussie — 7 tables créées.');

    // Migration 002 : support OAuth
    const sql2 = fs.readFileSync(path.join(__dirname, 'migration_002_oauth.sql'), 'utf8');
    await pool.query(sql2);
    console.log('Migration 002 réussie — colonnes OAuth ajoutées.');

    // Migration 003 : email tracking
    const sql3 = fs.readFileSync(path.join(__dirname, 'migration_003_email_tracking.sql'), 'utf8');
    await pool.query(sql3);
    console.log('Migration 003 réussie — email tracking ajouté.');

    // Migration 004 : apply_url
    const sql4 = fs.readFileSync(path.join(__dirname, 'migration_004_apply_url.sql'), 'utf8');
    await pool.query(sql4);
    console.log('Migration 004 réussie — apply_url ajouté.');
  } catch (err) {
    console.error('Erreur migration :', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
