
const { query, get } = require('../database/db.postgres');

/**
 * Smart Rule-Based Matching Engine
 * Evaluates compatibility based on verified criteria without AI dependencies.
 */
function scoreMatch(listing, organization) {
  let score = 0;
  const factors = [];

  // 1. Verification Status (Max 35 pts)
  if (organization.verification_status === 'VERIFIED') {
    score += 35;
    factors.push({
      factor: 'Organization Verification',
      status: 'MATCH',
      points: 35,
      detail: 'Verified NGO credentialed for safe food redistribution.'
    });
  } else {
    factors.push({
      factor: 'Organization Verification',
      status: 'PENDING',
      points: 0,
      detail: 'Organization account is awaiting administrative verification.'
    });
  }

  // 2. Collection Capacity Match (Max 25 pts)
  const orgCapacity = Number(organization.collection_capacity_kg) || 0;
  const foodQty = Number(listing.quantity_kg) || 0;

  if (orgCapacity >= foodQty) {
    score += 25;
    factors.push({
      factor: 'Collection Capacity',
      status: 'MATCH',
      points: 25,
      detail: `Receiver capacity (${orgCapacity} kg) exceeds listing volume (${foodQty} kg).`
    });
  } else if (orgCapacity >= foodQty * 0.7) {
    score += 15;
    factors.push({
      factor: 'Collection Capacity',
      status: 'PARTIAL',
      points: 15,
      detail: `Receiver capacity (${orgCapacity} kg) covers ~70% of volume (${foodQty} kg).`
    });
  } else {
    factors.push({
      factor: 'Collection Capacity',
      status: 'INSUFFICIENT',
      points: 5,
      detail: `Capacity (${orgCapacity} kg) is smaller than listing volume (${foodQty} kg).`
    });
  }

  // 3. Location & Area Match (Max 25 pts)
  const samePostal = listing.postal_code && organization.postal_code &&
    listing.postal_code.trim().toLowerCase() === organization.postal_code.trim().toLowerCase();

  const sameCity = listing.city && organization.city &&
    listing.city.trim().toLowerCase() === organization.city.trim().toLowerCase();

  if (samePostal) {
    score += 25;
    factors.push({
      factor: 'Location Match',
      status: 'DIRECT',
      points: 25,
      detail: `Direct postal zone match (${organization.postal_code}) — short transit time.`
    });
  } else if (sameCity) {
    score += 15;
    factors.push({
      factor: 'Location Match',
      status: 'MUNICIPAL',
      points: 15,
      detail: `Same municipal city (${organization.city}) — regional coverage.`
    });
  } else {
    factors.push({
      factor: 'Location Match',
      status: 'OUT_OF_AREA',
      points: 0,
      detail: `Different city/area (${organization.city || 'N/A'}).`
    });
  }

  // 4. Pickup Deadline Feasibility (Max 10 pts)
  const deadlineMs = new Date(listing.pickup_deadline).getTime();
  const hoursRemaining = (deadlineMs - Date.now()) / (1000 * 60 * 60);

  if (hoursRemaining >= 3) {
    score += 10;
    factors.push({
      factor: 'Deadline Feasibility',
      status: 'FEASIBLE',
      points: 10,
      detail: `Comfortable timeline (${hoursRemaining.toFixed(1)}h remaining before deadline).`
    });
  } else if (hoursRemaining > 1) {
    score += 5;
    factors.push({
      factor: 'Deadline Feasibility',
      status: 'URGENT',
      points: 5,
      detail: `Urgent pickup window (${hoursRemaining.toFixed(1)}h remaining). Fast response needed.`
    });
  } else {
    factors.push({
      factor: 'Deadline Feasibility',
      status: 'CRITICAL',
      points: 0,
      detail: `Critical deadline window (${Math.max(0, hoursRemaining).toFixed(1)}h remaining).`
    });
  }

  // 5. Operating Availability (Max 5 pts)
  if (organization.availability_information) {
    score += 5;
    factors.push({
      factor: 'Operating Schedule',
      status: 'AVAILABLE',
      points: 5,
      detail: `Active operating hours reported: ${organization.availability_information}`
    });
  }

  let matchTier = 'Low Match';
  if (score >= 80) matchTier = 'High Match';
  else if (score >= 50) matchTier = 'Moderate Match';

  return {
    score: Math.min(100, score),
    matchTier,
    factors
  };
}

// Get matched organizations for a specific food listing
async function getMatchesForListing(req, res) {
  try {
    const { id } = req.params;

    const listing = await get(
      'SELECT * FROM food_listings WHERE id = $1',
      [id]
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found.'
      });
    }

    const organizations = await query(`
      SELECT o.*,
        u.full_name AS contact_name,
        u.email AS contact_email,
        u.mobile AS contact_mobile
      FROM organizations o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.verification_status DESC, o.collection_capacity_kg DESC
    `);

    const scoredOrgs = organizations.map(org => {
      const matchAnalysis = scoreMatch(listing, org);

      return {
        organization: {
          id: org.id,
          organization_name: org.organization_name,
          verification_status: org.verification_status,
          collection_capacity_kg: org.collection_capacity_kg,
          address: org.address,
          city: org.city,
          postal_code: org.postal_code,
          contact_name: org.contact_name,
          contact_mobile: org.contact_mobile,
          availability_information: org.availability_information
        },
        ...matchAnalysis
      };
    });

    scoredOrgs.sort((a, b) => b.score - a.score);

    return res.json({
      success: true,
      listing_id: Number(id),
      listing_title: listing.title,
      matches: scoredOrgs
    });
  } catch (err) {
    console.error('Error matching organizations:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve matching organizations.'
    });
  }
}

// Get matched food listings for a specific organization or logged-in NGO
async function getMatchesForNgo(req, res) {
  try {
    let org = req.organization;

    if (!org && req.params.orgId) {
      org = await get(
        'SELECT * FROM organizations WHERE id = $1',
        [req.params.orgId]
      );
    }

    if (!org) {
      return res.status(400).json({
        success: false,
        message: 'No organization profile found.'
      });
    }

    const listings = await query(`
      SELECT f.*, u.full_name AS organizer_name
      FROM food_listings f
      JOIN users u ON f.organizer_id = u.id
      WHERE f.listing_status = 'AVAILABLE'
        AND f.pickup_deadline > NOW()
      ORDER BY f.pickup_deadline ASC
    `);

    const scoredListings = listings.map(item => {
      const matchAnalysis = scoreMatch(item, org);

      return {
        listing: item,
        ...matchAnalysis
      };
    });

    scoredListings.sort((a, b) => b.score - a.score);

    return res.json({
      success: true,
      organization: {
        id: org.id,
        organization_name: org.organization_name,
        verification_status: org.verification_status,
        collection_capacity_kg: org.collection_capacity_kg
      },
      matches: scoredListings
    });
  } catch (err) {
    console.error('Error matching food listings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve matching food listings.'
    });
  }
}

module.exports = {
  scoreMatch,
  getMatchesForListing,
  getMatchesForNgo
};
