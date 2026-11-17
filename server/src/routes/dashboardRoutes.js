const express = require('express');
const router = express.Router();
const {
  getOrganizerDashboard,
  getNgoDashboard,
  getAdminDashboard,
  getImpactStats,
  exportImpactCsv,
  resetDemoData,
} = require('../controllers/dashboardController');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

// Public impact stats (with honest demo toggle)
router.get('/impact', optionalAuth, getImpactStats);

// Impact data CSV export
router.get('/impact/export-csv', optionalAuth, exportImpactCsv);

// Organizer personal dashboard
router.get('/organizer', authenticate, requireRole(['ORGANIZER', 'ADMIN']), getOrganizerDashboard);

// NGO personal dashboard
router.get('/ngo', authenticate, requireRole(['NGO', 'ADMIN']), getNgoDashboard);

// Admin platform dashboard
router.get('/admin', authenticate, requireRole(['ADMIN']), getAdminDashboard);

// Reset demo data endpoint (Admin or presentation demo)
router.post('/admin/reset-demo', authenticate, requireRole(['ADMIN']), resetDemoData);

module.exports = router;
