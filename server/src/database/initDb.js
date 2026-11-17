const fs = require('fs');
const path = require('path');
const { exec } = require('./db');

function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  exec(schemaSql);
  console.log('Database initialized successfully.');
}

if (require.main === module) {
  initDb();
}

module.exports = { initDb };
