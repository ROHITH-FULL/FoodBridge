const express = require('express');
const router = express.Router();
const {
  getMyOrg,
  updateMyOrg,
  listOrganizations,
  updateVerification,
} = require('../controllers/orgController');
const { authenticate, requireRole } = require('../middleware/auth');

// Get profile of current NGO
router.get('/me', authenticate, requireRole(['NGO', 'ADMIN']), getMyOrg);

// Update profile of current NGO
router.put('/me', authenticate, requireRole(['NGO', 'ADMIN']), updateMyOrg);

// List organizations (for Admin or discovery)
router.get('/', authenticate, listOrganizations);

// Admin updates verification status (Approve / Reject)
router.patch('/:id/verification', authenticate, requireRole(['ADMIN']), updateVerification);

module.exports = router;
