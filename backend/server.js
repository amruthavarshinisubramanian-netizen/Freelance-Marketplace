const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { getPool } = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets directly from frontend directory
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Health Check
app.get('/api/health', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT @@VERSION AS Version, DB_NAME() AS CurrentDB');
    return res.status(200).json({
      status: 'healthy',
      database: 'connected',
      currentDB: result.recordset[0].CurrentDB,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Fallback for API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Frontend fallback for client-side routing / index
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize database and start listening
async function startServer() {
  try {
    console.log('[INIT] Connecting to Microsoft SQL Server...');
    await getPool();
    console.log('[INIT] Database connection established.');

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(` Freelance Marketplace Platform running on port ${PORT}`);
      console.log(` Web Frontend: http://localhost:${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api/health`);
      console.log('====================================================');
    });

    return server;
  } catch (error) {
    console.error('[INIT FATAL] Failed to connect to database or start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

