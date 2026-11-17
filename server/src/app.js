const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const requestRoutes = require('./routes/requestRoutes');
const orgRoutes = require('./routes/orgRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FoodBridge REST API',
    timestamp: new Date().toISOString(),
    node_version: process.version,
  });
});

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/matches', matchingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
