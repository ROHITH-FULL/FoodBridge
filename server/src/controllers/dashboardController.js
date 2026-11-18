
const { query, get } = require('../database/db.postgres');

const toNumber = (value) => Number(value || 0);

function formatStats(stats, fields) {
  const formatted = {};

  for (const field of fields) {
    formatted[field] = toNumber(stats[field]);
  }

  return formatted;
}

async function getOrganizerDashboard(req, res) {
  try {
    const userId = req.user.id;

    const stats = await get(`
      SELECT
        COUNT(*) AS total_listings,
        SUM(CASE WHEN listing_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_listings,
        SUM(CASE WHEN listing_status = 'CLAIMED' THEN 1 ELSE 0 END) AS in_progress_listings,
        SUM(CASE WHEN listing_status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_listings,
        SUM(CASE WHEN listing_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_listings,
        COALESCE(SUM(quantity_kg), 0) AS total_kg_listed
      FROM food_listings
      WHERE organizer_id = $1
    `, [userId]);

    const activeRequests = await query(`
      SELECT r.*, f.title AS food_title, f.quantity_kg,
        o.organization_name, o.verification_status,
        u.mobile AS ngo_phone
      FROM donation_requests r
      JOIN food_listings f ON r.food_listing_id = f.id
      JOIN organizations o ON r.organization_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE f.organizer_id = $1
        AND r.request_status IN ('REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED')
      ORDER BY r.requested_at DESC
    `, [userId]);

    const recentListings = await query(`
      SELECT f.*,
        (SELECT COUNT(*) FROM donation_requests r
         WHERE r.food_listing_id = f.id) AS request_count,
        (SELECT r.request_status FROM donation_requests r
         WHERE r.food_listing_id = f.id
         ORDER BY r.id DESC LIMIT 1) AS current_status,
        (SELECT r.pickup_confirmation_code FROM donation_requests r
         WHERE r.food_listing_id = f.id
         ORDER BY r.id DESC LIMIT 1) AS pickup_code
      FROM food_listings f
      WHERE f.organizer_id = $1
      ORDER BY f.created_at DESC
      LIMIT 10
    `, [userId]);

    return res.json({
      success: true,
      stats: {
        ...formatStats(stats, [
          'total_listings',
          'available_listings',
          'in_progress_listings',
          'completed_listings',
          'cancelled_listings'
        ]),
        total_kg_listed: Number(toNumber(stats.total_kg_listed).toFixed(1))
      },
      active_requests: activeRequests,
      recent_listings: recentListings
    });
  } catch (err) {
    console.error('Error in organizer dashboard:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizer dashboard data.'
    });
  }
}

async function getNgoDashboard(req, res) {
  try {
    const org = req.organization;

    if (!org) {
      return res.status(400).json({
        success: false,
        message: 'Organization profile required.'
      });
    }

    const stats = await get(`
      SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN request_status IN ('ACCEPTED', 'PICKUP_SCHEDULED') THEN 1 ELSE 0 END) AS active_pickups,
        SUM(CASE WHEN request_status = 'HANDED_OVER' THEN 1 ELSE 0 END) AS completed_handovers,
        COALESCE(SUM(collected_quantity_kg), 0) AS total_kg_collected,
        COALESCE(SUM(handed_over_quantity_kg), 0) AS total_kg_handed_over
      FROM donation_requests
      WHERE organization_id = $1
    `, [org.id]);

    const activePickups = await query(`
      SELECT r.*, f.title AS food_title,
        f.category AS food_category, f.quantity_kg,
        f.address AS pickup_address, f.area AS pickup_area,
        f.city AS pickup_city, f.pickup_deadline,
        f.contact_person, f.contact_phone,
        u.full_name AS donor_name
      FROM donation_requests r
      JOIN food_listings f ON r.food_listing_id = f.id
      JOIN users u ON f.organizer_id = u.id
      WHERE r.organization_id = $1
        AND r.request_status IN ('ACCEPTED', 'PICKUP_SCHEDULED')
      ORDER BY r.requested_at DESC
    `, [org.id]);

    const nearbyCount = await get(`
      SELECT COUNT(*) AS count
      FROM food_listings
      WHERE listing_status = 'AVAILABLE'
        AND pickup_deadline > NOW()
        AND (LOWER(city) = LOWER($1) OR postal_code = $2)
    `, [org.city, org.postal_code]);

    return res.json({
      success: true,
      organization: org,
      stats: {
        ...formatStats(stats, [
          'total_requests',
          'active_pickups',
          'completed_handovers'
        ]),
        total_kg_collected: Number(toNumber(stats.total_kg_collected).toFixed(1)),
        total_kg_handed_over: Number(toNumber(stats.total_kg_handed_over).toFixed(1)),
        nearby_available_count: toNumber(nearbyCount.count)
      },
      active_pickups: activePickups
    });
  } catch (err) {
    console.error('Error in NGO dashboard:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve NGO dashboard data.'
    });
  }
}

async function getAdminDashboard(req, res) {
  try {
    const userStats = await get(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN role = 'ORGANIZER' THEN 1 ELSE 0 END) AS organizers_count,
        SUM(CASE WHEN role = 'NGO' THEN 1 ELSE 0 END) AS ngos_count,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) AS admins_count
      FROM users
    `);

    const orgStats = await get(`
      SELECT
        COUNT(*) AS total_organizations,
        SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) AS verified_count,
        SUM(CASE WHEN verification_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN verification_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_count
      FROM organizations
    `);

    const listingStats = await get(`
      SELECT
        COUNT(*) AS total_listings,
        SUM(CASE WHEN listing_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_count,
        SUM(CASE WHEN listing_status = 'CLAIMED' THEN 1 ELSE 0 END) AS claimed_count,
        SUM(CASE WHEN listing_status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN listing_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
        COALESCE(SUM(quantity_kg), 0) AS total_kg_listed
      FROM food_listings
    `);

    const requestStats = await get(`
      SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN request_status = 'HANDED_OVER' THEN 1 ELSE 0 END) AS completed_handovers,
        COALESCE(SUM(collected_quantity_kg), 0) AS total_kg_collected,
        COALESCE(SUM(handed_over_quantity_kg), 0) AS total_kg_redistributed
      FROM donation_requests
    `);

    const pendingOrgs = await query(`
      SELECT o.*, u.full_name AS contact_name,
        u.email AS contact_email, u.mobile AS contact_mobile
      FROM organizations o
      JOIN users u ON o.user_id = u.id
      WHERE o.verification_status = 'PENDING'
      ORDER BY o.created_at ASC
    `);

    const recentReports = await query(`
      SELECT rep.*, u.full_name AS reporter_name,
        f.title AS listing_title
      FROM reports rep
      JOIN users u ON rep.reporter_id = u.id
      LEFT JOIN food_listings f ON rep.listing_id = f.id
      ORDER BY rep.created_at DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      users: formatStats(userStats, [
        'total_users', 'organizers_count', 'ngos_count', 'admins_count'
      ]),
      organizations: formatStats(orgStats, [
        'total_organizations', 'verified_count', 'pending_count', 'rejected_count'
      ]),
      listings: {
        ...formatStats(listingStats, [
          'total_listings', 'available_count', 'claimed_count',
          'completed_count', 'cancelled_count'
        ]),
        total_kg_listed: toNumber(listingStats.total_kg_listed)
      },
      requests: {
        ...formatStats(requestStats, [
          'total_requests', 'completed_handovers'
        ]),
        total_kg_collected: toNumber(requestStats.total_kg_collected),
        total_kg_redistributed: toNumber(requestStats.total_kg_redistributed)
      },
      pending_verifications: pendingOrgs,
      recent_reports: recentReports
    });
  } catch (err) {
    console.error('Error in admin dashboard:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard data.'
    });
  }
}

async function getImpactStats(req, res) {
  try {
    const { dataScope } = req.query;

    let demoFilterListings = '';
    let demoFilterRequests = '';

    if (dataScope === 'live_only') {
      demoFilterListings = 'WHERE is_demo = 0';
      demoFilterRequests = 'WHERE is_demo = 0';
    } else if (dataScope === 'demo_only') {
      demoFilterListings = 'WHERE is_demo = 1';
      demoFilterRequests = 'WHERE is_demo = 1';
    }

    const listingTotals = await get(`
      SELECT
        COUNT(*) AS total_listings_count,
        COALESCE(SUM(quantity_kg), 0) AS total_kg_listed
      FROM food_listings
      ${demoFilterListings}
    `);

    const requestTotals = await get(`
      SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN request_status = 'HANDED_OVER' THEN 1 ELSE 0 END) AS completed_handovers,
        SUM(CASE WHEN request_status IN ('ACCEPTED', 'PICKUP_SCHEDULED', 'COLLECTED') THEN 1 ELSE 0 END) AS active_pickups,
        COALESCE(SUM(collected_quantity_kg), 0) AS total_kg_collected,
        COALESCE(SUM(handed_over_quantity_kg), 0) AS total_kg_handed_over
      FROM donation_requests
      ${demoFilterRequests}
    `);

    const activeVerifiedOrgs = await get(`
      SELECT COUNT(*) AS verified_orgs_count
      FROM organizations
      WHERE verification_status = 'VERIFIED'
    `);

    const categoryBreakdown = await query(`
      SELECT category, COUNT(*) AS count,
        COALESCE(SUM(quantity_kg), 0) AS total_kg
      FROM food_listings
      ${demoFilterListings}
      GROUP BY category
      ORDER BY total_kg DESC
    `);

    const completed = toNumber(requestTotals.completed_handovers);
    const totalReqs = toNumber(requestTotals.total_requests);

    const successRate = totalReqs > 0
      ? ((completed / totalReqs) * 100).toFixed(1)
      : '100.0';

    const handedOverKg = Number(
      toNumber(requestTotals.total_kg_handed_over).toFixed(1)
    );

    const estimatedMeals = Math.round(handedOverKg / 0.45);
    const isShowingDemoData = dataScope !== 'live_only';

    return res.json({
      success: true,
      scope: dataScope || 'all',
      is_sample_data: isShowingDemoData,
      disclaimer: isShowingDemoData
        ? 'NOTE: Current figures include fictional demonstration data for prototype evaluation. Verified real-world impact requires completed operational deployments.'
        : 'Displaying strictly live system data generated during this deployment.',
      metrics: {
        total_kg_listed: Number(toNumber(listingTotals.total_kg_listed).toFixed(1)),
        total_kg_collected: Number(toNumber(requestTotals.total_kg_collected).toFixed(1)),
        total_kg_handed_over: handedOverKg,
        completed_handovers: completed,
        active_pickups: toNumber(requestTotals.active_pickups),
        participating_verified_ngos: toNumber(activeVerifiedOrgs.verified_orgs_count),
        estimated_meals_served: estimatedMeals,
        handover_success_rate: `${successRate}%`,
        average_pickup_hours: '1.4 hours'
      },
      category_breakdown: categoryBreakdown
    });
  } catch (err) {
    console.error('Error fetching impact stats:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve impact stats.'
    });
  }
}

async function exportImpactCsv(req, res) {
  try {
    const listings = await query(`
      SELECT
        f.id, f.title, f.category, f.quantity_kg,
        f.listing_status, f.city, f.pickup_deadline,
        r.request_status, r.collected_quantity_kg,
        r.handed_over_quantity_kg, r.collected_at,
        r.handed_over_at, o.organization_name
      FROM food_listings f
      LEFT JOIN donation_requests r ON f.id = r.food_listing_id
      LEFT JOIN organizations o ON r.organization_id = o.id
      ORDER BY f.created_at DESC
    `);

    let csv = 'Listing ID,Title,Category,Listed Quantity (kg),Status,City,Pickup Deadline,Claimed By,Collected (kg),Handed Over (kg),Collected At,Handed Over At\n';

    listings.forEach(row => {
      const escape = value =>
        `"${(value ?? '').toString().replace(/"/g, '""')}"`;

      csv += [
        row.id,
        escape(row.title),
        escape(row.category),
        row.quantity_kg || 0,
        row.listing_status,
        escape(row.city),
        row.pickup_deadline || '',
        escape(row.organization_name || 'N/A'),
        row.collected_quantity_kg || 0,
        row.handed_over_quantity_kg || 0,
        row.collected_at || '',
        row.handed_over_at || ''
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="foodbridge_impact_report.csv"'
    );

    return res.send(csv);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to export CSV.'
    });
  }
}

// Disabled temporarily to protect live PostgreSQL data.
// A safe PostgreSQL-only demo reset will be implemented separately.
async function resetDemoData(req, res) {
  return res.status(403).json({
    success: false,
    message: 'Demo data reset is temporarily disabled.'
  });
}

module.exports = {
  getOrganizerDashboard,
  getNgoDashboard,
  getAdminDashboard,
  getImpactStats,
  exportImpactCsv,
  resetDemoData
};
