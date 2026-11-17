const { query, get, run, transaction } = require('../database/db');

// Valid status transitions map
const VALID_TRANSITIONS = {
  REQUESTED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PICKUP_SCHEDULED', 'CANCELLED'],
  PICKUP_SCHEDULED: ['COLLECTED', 'CANCELLED'],
  COLLECTED: ['HANDED_OVER'],
  HANDED_OVER: [],
  CANCELLED: [],
  REJECTED: [],
};

// Generate 6-digit alphanumeric confirmation code
function generatePickupCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'FB-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Verified NGO accepts / claims a food listing
 * Uses atomic transaction to prevent concurrent race conditions!
 */
function acceptListing(req, res) {
  const { listing_id } = req.body;
  const org = req.organization;

  if (!org) {
    return res.status(403).json({ success: false, message: 'You must be registered as an NGO organization.' });
  }

  if (org.verification_status !== 'VERIFIED') {
    return res.status(403).json({
      success: false,
      message: 'Only verified organizations can accept food donations. Your account verification is currently pending review.'
    });
  }

  try {
    const result = transaction(({ run, get }) => {
      // 1. Lock / check listing status atomically
      const listing = get('SELECT * FROM food_listings WHERE id = ?', [listing_id]);
      if (!listing) {
        throw new Error('Food listing not found.');
      }

      if (listing.listing_status !== 'AVAILABLE') {
        throw new Error(`This listing is no longer available. Status: ${listing.listing_status}`);
      }

      // Check deadline
      if (new Date(listing.pickup_deadline).getTime() <= Date.now()) {
        throw new Error('This listing has expired and cannot be accepted.');
      }

      // 2. Mark listing as CLAIMED
      run(`
        UPDATE food_listings
        SET listing_status = 'CLAIMED', updated_at = datetime('now')
        WHERE id = ? AND listing_status = 'AVAILABLE'
      `, [listing_id]);

      // 3. Generate pickup confirmation code
      const pickupCode = generatePickupCode();
      const now = new Date().toISOString();

      // 4. Create donation request with ACCEPTED status
      const reqRes = run(`
        INSERT INTO donation_requests (
          food_listing_id, organization_id, request_status, requested_at, accepted_at,
          pickup_confirmation_code, is_demo
        ) VALUES (?, ?, 'ACCEPTED', ?, ?, ?, ?)
      `, [
        listing_id,
        org.id,
        now,
        now,
        pickupCode,
        process.env.DEMO_MODE === 'true' ? 1 : 0
      ]);

      const requestId = reqRes.lastInsertRowid;

      // 5. Record status history
      run(`
        INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
        VALUES (?, 'AVAILABLE', 'ACCEPTED', ?, 'Listing claimed directly by verified NGO.')
      `, [requestId, req.user.id]);

      return { requestId, pickupCode, listingTitle: listing.title };
    });

    return res.status(201).json({
      success: true,
      message: 'Food listing successfully claimed!',
      request_id: result.requestId,
      pickup_code: result.pickupCode,
    });
  } catch (err) {
    console.error('Race condition or claim error:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Failed to claim listing.' });
  }
}

/**
 * Schedule pickup with specific arrival time
 */
function schedulePickup(req, res) {
  const { id } = req.params;
  const { scheduled_pickup_time, notes } = req.body;

  if (!scheduled_pickup_time) {
    return res.status(400).json({ success: false, message: 'Scheduled pickup date/time is required.' });
  }

  const request = get('SELECT * FROM donation_requests WHERE id = ?', [id]);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  if (request.request_status !== 'ACCEPTED') {
    return res.status(400).json({
      success: false,
      message: `Cannot schedule pickup for request in '${request.request_status}' status. Must be 'ACCEPTED'.`
    });
  }

  try {
    transaction(({ run }) => {
      run(`
        UPDATE donation_requests
        SET request_status = 'PICKUP_SCHEDULED',
            pickup_scheduled_at = datetime('now'),
            scheduled_pickup_time = ?
        WHERE id = ?
      `, [scheduled_pickup_time, id]);

      run(`
        INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
        VALUES (?, 'ACCEPTED', 'PICKUP_SCHEDULED', ?, ?)
      `, [id, req.user.id, notes || `Pickup scheduled for ${new Date(scheduled_pickup_time).toLocaleString()}`]);
    });

    return res.json({ success: true, message: 'Pickup scheduled successfully.' });
  } catch (err) {
    console.error('Error scheduling pickup:', err);
    return res.status(500).json({ success: false, message: 'Failed to schedule pickup.' });
  }
}

/**
 * Confirm pickup / handover collection using Pickup Confirmation Code
 * Can be performed by Organizer or Verified NGO with the code!
 */
function confirmPickup(req, res) {
  const { id } = req.params;
  const { pickup_code, collected_quantity_kg, notes } = req.body;

  const request = get('SELECT * FROM donation_requests WHERE id = ?', [id]);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  if (request.request_status !== 'PICKUP_SCHEDULED') {
    return res.status(400).json({
      success: false,
      message: `Invalid state: Request is in '${request.request_status}'. Pickup must be scheduled before confirming collection.`
    });
  }

  // Verify confirmation code (case-insensitive)
  if (!pickup_code || pickup_code.trim().toUpperCase() !== request.pickup_confirmation_code.toUpperCase()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pickup confirmation code. Please check the code provided by the organizer.'
    });
  }

  const collectedKg = Number(collected_quantity_kg);
  if (isNaN(collectedKg) || collectedKg <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide valid actual collected quantity in kg.' });
  }

  try {
    transaction(({ run }) => {
      run(`
        UPDATE donation_requests
        SET request_status = 'COLLECTED',
            collected_at = datetime('now'),
            collected_quantity_kg = ?
        WHERE id = ?
      `, [collectedKg, id]);

      run(`
        INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
        VALUES (?, 'PICKUP_SCHEDULED', 'COLLECTED', ?, ?)
      `, [id, req.user.id, notes || `Collection confirmed with code. Actual weight: ${collectedKg} kg.`]);
    });

    return res.json({
      success: true,
      message: `Pickup confirmed! ${collectedKg} kg recorded as collected.`,
      collected_quantity_kg: collectedKg
    });
  } catch (err) {
    console.error('Error confirming pickup:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm pickup.' });
  }
}

/**
 * Confirm final handover / redistribution to beneficiaries
 * Moves request to 'HANDED_OVER' and listing to 'COMPLETED'
 */
function completeHandover(req, res) {
  const { id } = req.params;
  const { handed_over_quantity_kg, notes } = req.body;

  const request = get('SELECT * FROM donation_requests WHERE id = ?', [id]);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  if (request.request_status !== 'COLLECTED') {
    return res.status(400).json({
      success: false,
      message: `Invalid state: Request is in '${request.request_status}'. Food must be collected before handover can be completed.`
    });
  }

  const handedOverKg = Number(handed_over_quantity_kg || request.collected_quantity_kg);
  if (isNaN(handedOverKg) || handedOverKg <= 0) {
    return res.status(400).json({ success: false, message: 'Valid handed-over quantity in kg is required.' });
  }

  try {
    transaction(({ run }) => {
      run(`
        UPDATE donation_requests
        SET request_status = 'HANDED_OVER',
            handed_over_at = datetime('now'),
            handed_over_quantity_kg = ?
        WHERE id = ?
      `, [handedOverKg, id]);

      run(`
        UPDATE food_listings
        SET listing_status = 'COMPLETED', updated_at = datetime('now')
        WHERE id = ?
      `, [request.food_listing_id]);

      run(`
        INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
        VALUES (?, 'COLLECTED', 'HANDED_OVER', ?, ?)
      `, [id, req.user.id, notes || `Food successfully distributed to beneficiaries. Final weight: ${handedOverKg} kg.`]);
    });

    return res.json({
      success: true,
      message: `Handover complete! ${handedOverKg} kg successfully redistributed.`,
      handed_over_quantity_kg: handedOverKg
    });
  } catch (err) {
    console.error('Error completing handover:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete handover.' });
  }
}

/**
 * Cancel request
 */
function cancelRequest(req, res) {
  const { id } = req.params;
  const { cancellation_reason } = req.body;

  const request = get('SELECT * FROM donation_requests WHERE id = ?', [id]);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  if (['COLLECTED', 'HANDED_OVER', 'CANCELLED', 'REJECTED'].includes(request.request_status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel request in '${request.request_status}' status.`
    });
  }

  try {
    transaction(({ run }) => {
      run(`
        UPDATE donation_requests
        SET request_status = 'CANCELLED', cancellation_reason = ?
        WHERE id = ?
      `, [cancellation_reason || 'Cancelled by user', id]);

      // Release listing back to AVAILABLE if not already completed
      run(`
        UPDATE food_listings
        SET listing_status = 'AVAILABLE', updated_at = datetime('now')
        WHERE id = ?
      `, [request.food_listing_id]);

      run(`
        INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
        VALUES (?, ?, 'CANCELLED', ?, ?)
      `, [id, request.request_status, req.user.id, cancellation_reason || 'Cancelled']);
    });

    return res.json({ success: true, message: 'Request cancelled and listing released back to available.' });
  } catch (err) {
    console.error('Error cancelling request:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel request.' });
  }
}

/**
 * Get request details with timeline history
 */
function getRequestById(req, res) {
  const { id } = req.params;

  const request = get(`
    SELECT r.*,
      f.title as food_title, f.category as food_category, f.quantity_kg as listed_quantity_kg,
      f.storage_information, f.address as pickup_address, f.area as pickup_area, f.city as pickup_city,
      f.postal_code as pickup_postal_code, f.pickup_deadline, f.contact_person as donor_contact_name,
      f.contact_phone as donor_contact_phone, f.dietary_type, f.organizer_id,
      o.organization_name, o.city as org_city, o.verification_status, o.collection_capacity_kg,
      u_donor.full_name as donor_name, u_donor.email as donor_email,
      u_ngo.full_name as receiver_user_name, u_ngo.mobile as receiver_mobile, u_ngo.email as receiver_email
    FROM donation_requests r
    JOIN food_listings f ON r.food_listing_id = f.id
    JOIN organizations o ON r.organization_id = o.id
    JOIN users u_donor ON f.organizer_id = u_donor.id
    JOIN users u_ngo ON o.user_id = u_ngo.id
    WHERE r.id = ?
  `, [id]);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  // Security check: only donor, receiver NGO, or admin can view
  const isDonor = request.organizer_id === req.user.id;
  const isReceiver = req.organization && req.organization.id === request.organization_id;
  const isAdmin = req.user.role === 'ADMIN';

  if (!isDonor && !isReceiver && !isAdmin) {
    return res.status(403).json({ success: false, message: 'You are not authorized to view this request.' });
  }

  const timeline = query(`
    SELECT sh.*, u.full_name as changed_by_name, u.role as changed_by_role
    FROM status_history sh
    LEFT JOIN users u ON sh.changed_by = u.id
    WHERE sh.request_id = ?
    ORDER BY sh.timestamp ASC
  `, [id]);

  return res.json({
    success: true,
    request,
    timeline,
  });
}

/**
 * Get all requests for currently authenticated NGO
 */
function getMyNgoRequests(req, res) {
  if (!req.organization) {
    return res.status(400).json({ success: false, message: 'No organization profile found.' });
  }

  try {
    const requests = query(`
      SELECT r.*,
        f.title as food_title, f.category as food_category, f.quantity_kg as listed_quantity_kg,
        f.pickup_deadline, f.address as pickup_address, f.city as pickup_city, f.area as pickup_area,
        f.contact_person, f.contact_phone, f.storage_information,
        u.full_name as organizer_name
      FROM donation_requests r
      JOIN food_listings f ON r.food_listing_id = f.id
      JOIN users u ON f.organizer_id = u.id
      WHERE r.organization_id = ?
      ORDER BY r.requested_at DESC
    `, [req.organization.id]);

    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    console.error('Error fetching NGO requests:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve requests.' });
  }
}

module.exports = {
  acceptListing,
  schedulePickup,
  confirmPickup,
  completeHandover,
  cancelRequest,
  getRequestById,
  getMyNgoRequests,
};
