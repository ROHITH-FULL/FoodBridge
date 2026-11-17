const express = require('express');
const router = express.Router();
const {
  createListing,
  getAvailableListings,
  getListingById,
  getMyListings,
  updateListing,
  cancelListing,
} = require('../controllers/foodController');
const { validateFoodListing } = require('../validators/foodValidator');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

// Public or optionally authenticated to browse available food
router.get('/', optionalAuth, getAvailableListings);

// Organizer specific endpoint to view their own listings
router.get('/my-listings', authenticate, requireRole(['ORGANIZER', 'ADMIN']), getMyListings);

// Individual listing details
router.get('/:id', optionalAuth, getListingById);

// Create food listing (Organizer or Admin)
router.post('/', authenticate, requireRole(['ORGANIZER', 'ADMIN']), validateFoodListing, createListing);

// Update listing (only if still AVAILABLE)
router.put('/:id', authenticate, requireRole(['ORGANIZER', 'ADMIN']), updateListing);

// Cancel listing
router.post('/:id/cancel', authenticate, requireRole(['ORGANIZER', 'ADMIN']), cancelListing);

module.exports = router;
