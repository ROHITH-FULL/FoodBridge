
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from environment variables.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function get(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await callback({
      query: async (sql, params = []) => {
        const response = await client.query(sql, params);
        return response.rows;
      },
      get: async (sql, params = []) => {
        const response = await client.query(sql, params);
        return response.rows[0] || null;
      },
      execute: async (sql, params = []) => {
        return client.query(sql, params);
      }
    });

    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  get,
  transaction,
  closePool
};
