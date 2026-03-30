const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('./pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Migration réussie — 7 tables créées.');
  } catch (err) {
    console.error('Erreur migration :', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
