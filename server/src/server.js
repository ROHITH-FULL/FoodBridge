
require('dotenv').config();

const app = require('./app');
const { initPostgresDb } = require('./database/init.postgres');
const { closePool } = require('./database/db.postgres');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initPostgresDb();

    const server = app.listen(PORT, () => {
      console.log('===============================================');
      console.log(`  FoodBridge Server running on port ${PORT}`);
      console.log(`  API Base URL: http://localhost:${PORT}/api`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log('  Database: PostgreSQL');
      console.log('===============================================');
    });

    server.on('close', async () => {
      await closePool();
    });

    return server;
  } catch (error) {
    console.error('FoodBridge startup failed:', error);
    await closePool();
    process.exit(1);
  }
}

const serverPromise = startServer();

module.exports = serverPromise;
