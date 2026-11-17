const app = require('./app');
const { initDb } = require('./database/initDb');
const fs = require('fs');
const { DB_PATH } = require('./database/db');

const PORT = process.env.PORT || 5000;

// Ensure database schema is initialized if brand new
if (!fs.existsSync(DB_PATH)) {
  console.log('Database not detected. Initializing schema...');
  initDb();
}

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  FoodBridge Server running on port ${PORT}`);
  console.log(`  API Base URL: http://localhost:${PORT}/api`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

module.exports = server;
