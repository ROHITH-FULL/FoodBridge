const express = require('express');
const router = express.Router();
const { createReport, getReports, resolveReport } = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/auth');

// Create report (any authenticated user)
router.post('/', authenticate, createReport);

// View reports (Admin only)
router.get('/', authenticate, requireRole(['ADMIN']), getReports);

// Resolve or investigate report (Admin only)
router.patch('/:id/status', authenticate, requireRole(['ADMIN']), resolveReport);

module.exports = router;
