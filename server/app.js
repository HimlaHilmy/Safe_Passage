const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const { getDBStatus } = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const assistanceRoutes = require('./routes/assistanceRoutes');
const providerRoutes = require('./routes/providerRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health & Diagnostics endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Safe Passage API Server',
    version: '1.0.0',
    timestamp: new Date(),
    database: getDBStatus(),
    environment: process.env.NODE_ENV || 'development',
    modules: [
      { name: 'Emergency Reporting', owner: 'K.H.S. Dulanjani', prefix: '/api/incidents' },
      { name: 'Geolocation & Service Discovery', owner: 'J.D.R. Samindika', prefix: '/api/services' },
      { name: 'Case Lifecycle Manager', owner: 'J.K.S. Jayasundara', prefix: '/api/incidents/:id/status' },
      { name: 'Dispatch & Provider Portal', owner: 'M.H.F. Himla', prefix: '/api/assistance-requests' },
      { name: 'Admin Analytics', owner: 'R.P.J.H. Hirunika', prefix: '/api/admin' },
    ],
  });
});

// Mount modular API routers
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/assistance-requests', assistanceRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND',
  });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
