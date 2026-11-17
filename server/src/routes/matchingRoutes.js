const express = require('express');
const router = express.Router();
const { getMatchesForListing, getMatchesForNgo } = require('../controllers/matchingController');
const { authenticate } = require('../middleware/auth');

// Get matched NGOs for a listing
router.get('/listing/:id', authenticate, getMatchesForListing);

// Get matched listings for current logged-in NGO
router.get('/ngo', authenticate, getMatchesForNgo);

// Get matched listings for a specific NGO by id
router.get('/ngo/:orgId', authenticate, getMatchesForNgo);

module.exports = router;
