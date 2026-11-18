
const fs = require('fs');
const path = require('path');
const { pool } = require('./db.postgres');

async function initPostgresDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.postgres.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schemaSql);

    console.log('PostgreSQL database initialized successfully.');
  } catch (error) {
    console.error('PostgreSQL initialization failed:', error);
    throw error;
  }
}

if (require.main === module) {
  initPostgresDb()
    .then(() => pool.end())
    .catch(async () => {
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = { initPostgresDb };
