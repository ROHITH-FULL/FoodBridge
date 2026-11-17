const express = require('express');
const router = express.Router();
const {
  acceptListing,
  schedulePickup,
  confirmPickup,
  completeHandover,
  cancelRequest,
  getRequestById,
  getMyNgoRequests,
} = require('../controllers/requestController');
const { authenticate, requireRole } = require('../middleware/auth');

// Verified NGO claims / accepts a listing
router.post('/accept', authenticate, requireRole(['NGO', 'ADMIN']), acceptListing);

// NGO views their own requests
router.get('/my-requests', authenticate, requireRole(['NGO', 'ADMIN']), getMyNgoRequests);

// Request details by ID (Donor, NGO, or Admin)
router.get('/:id', authenticate, getRequestById);

// Schedule pickup
router.post('/:id/schedule', authenticate, schedulePickup);

// Confirm pickup with verification code (Donor or NGO)
router.post('/:id/confirm-pickup', authenticate, confirmPickup);

// Complete handover to beneficiaries (NGO)
router.post('/:id/complete-handover', authenticate, completeHandover);

// Cancel request
router.post('/:id/cancel', authenticate, cancelRequest);

module.exports = router;
