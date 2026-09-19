const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let sql;
const isWindowsAuth = (process.env.DB_AUTH_TYPE || 'windows').toLowerCase() === 'windows';

if (isWindowsAuth) {
  try {
    sql = require('mssql/msnodesqlv8');
  } catch (err) {
    sql = require('mssql');
  }
} else {
  sql = require('mssql');
}

let pool = null;
let poolPromise = null;

function getConfig() {
  const server = process.env.DB_SERVER || 'localhost';
  const database = process.env.DB_NAME || 'FreelanceMarketplaceDB';

  if (isWindowsAuth) {
    return {
      connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`,
      driver: 'msnodesqlv8',
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
  }

  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: server,
    database: database,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

async function getPool() {
  if (!poolPromise) {
    const config = getConfig();
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(p => {
        pool = p;
        console.log(`[DB] Connected successfully to Microsoft SQL Server [${process.env.DB_NAME || 'FreelanceMarketplaceDB'}]`);
        return pool;
      })
      .catch(err => {
        console.error('[DB] Connection Error:', err.message);
        poolPromise = null; // allow retry
        throw err;
      });
  }
  return poolPromise;
}

/**
 * Execute a parameterized query
 * @param {string} queryText 
 * @param {Object} params - key-value pairs where key is parameter name without @
 */
async function query(queryText, params = {}) {
  const p = await getPool();
  const request = p.request();

  for (const [key, val] of Object.entries(params)) {
    if (val === undefined) {
      request.input(key, null);
    } else {
      request.input(key, val);
    }
  }

  return await request.query(queryText);
}

module.exports = {
  sql,
  getPool,
  query
};

