require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, getDatabase, closeDatabase } = require('./db/init');
const { verifyToken } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const sheetRoutes = require('./routes/sheets');
const formRoutes = require('./routes/forms');
const dashboardRoutes = require('./routes/dashboard');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = process.env.CORS_ORIGIN
  ? { origin: process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) }
  : {};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database on startup
try {
  initializeDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/dashboard', dashboardRoutes);

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds maximum limit (10MB)'
    });
  }

  if (err.message === 'Only Excel or CSV files (.xlsx, .xls, .csv) are allowed') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

let server;

if (require.main === module) {
  // Start server for local development and non-serverless hosts.
  server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   TeamSheet Backend Server Started     ║
╠════════════════════════════════════════╣
║ Port: ${PORT}                           ║
║ URL: http://localhost:${PORT}            ║
║ Health: http://localhost:${PORT}/api/health ║
╚════════════════════════════════════════╝
  `);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (!server) {
    closeDatabase();
    process.exit(0);
  }
  server.close(() => {
    closeDatabase();
    console.log('Server shut down');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (!server) {
    closeDatabase();
    process.exit(0);
  }
  server.close(() => {
    closeDatabase();
    console.log('Server shut down');
    process.exit(0);
  });
});

module.exports = app;
