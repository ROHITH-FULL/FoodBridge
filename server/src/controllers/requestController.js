
const { query, get, transaction } = require('../database/db.postgres');

// Valid status transitions map
const VALID_TRANSITIONS = {
  REQUESTED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PICKUP_SCHEDULED', 'CANCELLED'],
  PICKUP_SCHEDULED: ['COLLECTED', 'CANCELLED'],
  COLLECTED: ['HANDED_OVER'],
  HANDED_OVER: [],
  CANCELLED: [],
  REJECTED: []
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

function createStatusError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

/**
 * Verified NGO accepts / claims a food listing.
 * Row locking prevents concurrent claims.
 */
async function acceptListing(req, res) {
  const { listing_id } = req.body;
  const org = req.organization;

  if (!org) {
    return res.status(403).json({
      success: false,
      message: 'You must be registered as an NGO organization.'
    });
  }

  if (org.verification_status !== 'VERIFIED') {
    return res.status(403).json({
      success: false,
      message: 'Only verified organizations can accept food donations. Your account verification is currently pending review.'
    });
  }

  try {
    const result = await transaction(async ({ get, execute }) => {
      // Lock the listing so only one NGO can claim it
      const listing = await get(
        'SELECT * FROM food_listings WHERE id = $1 FOR UPDATE',
        [listing_id]
      );

      if (!listing) {
        throw createStatusError('Food listing not found.');
      }

      if (listing.listing_status !== 'AVAILABLE') {
        throw createStatusError(
          `This listing is no longer available. Status: ${listing.listing_status}`
        );
      }

      if (new Date(listing.pickup_deadline).getTime() <= Date.now()) {
        throw createStatusError(
          'This listing has expired and cannot be accepted.'
        );
      }

      // Mark listing as claimed
      const updatedListing = await execute(`
        UPDATE food_listings
        SET listing_status = 'CLAIMED', updated_at = NOW()
        WHERE id = $1 AND listing_status = 'AVAILABLE'
        RETURNING id
      `, [listing_id]);

      if (updatedListing.rowCount !== 1) {
        throw createStatusError('This listing is no longer available.');
      }

      const pickupCode = generatePickupCode();

      // Create donation request
      const requestResult = await execute(`
        INSERT INTO donation_requests (
          food_listing_id,
          organization_id,
          request_status,
          requested_at,
          accepted_at,
          pickup_confirmation_code,
          is_demo
        )
        VALUES ($1, $2, 'ACCEPTED', NOW(), NOW(), $3, $4)
        RETURNING id
      `, [
        listing_id,
        org.id,
        pickupCode,
        process.env.DEMO_MODE === 'true' ? 1 : 0
      ]);

      const requestId = requestResult.rows[0].id;

      // Record status history
      await execute(`
        INSERT INTO status_history
          (request_id, previous_status, new_status, changed_by, notes)
        VALUES ($1, 'AVAILABLE', 'ACCEPTED', $2, $3)
      `, [
        requestId,
        req.user.id,
        'Listing claimed directly by verified NGO.'
      ]);

      return {
        requestId,
        pickupCode,
        listingTitle: listing.title
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Food listing successfully claimed!',
      request_id: result.requestId,
      pickup_code: result.pickupCode
    });
  } catch (err) {
    console.error('Race condition or claim error:', err.message);

    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || 'Failed to claim listing.'
    });
  }
}

/**
 * Schedule pickup with specific arrival time.
 */
async function schedulePickup(req, res) {
  const { id } = req.params;
  const { scheduled_pickup_time, notes } = req.body;

  if (!scheduled_pickup_time) {
    return res.status(400).json({
      success: false,
      message: 'Scheduled pickup date/time is required.'
    });
  }

  try {
    await transaction(async ({ get, execute }) => {
      const request = await get(
        'SELECT * FROM donation_requests WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (!request) {
        throw createStatusError('Request not found.');
      }

      if (request.request_status !== 'ACCEPTED') {
        throw createStatusError(
          `Cannot schedule pickup for request in '${request.request_status}' status. Must be 'ACCEPTED'.`
        );
      }

      await execute(`
        UPDATE donation_requests
        SET request_status = 'PICKUP_SCHEDULED',
            pickup_scheduled_at = NOW(),
            scheduled_pickup_time = $1
        WHERE id = $2
      `, [scheduled_pickup_time, id]);

      await execute(`
        INSERT INTO status_history
          (request_id, previous_status, new_status, changed_by, notes)
        VALUES ($1, 'ACCEPTED', 'PICKUP_SCHEDULED', $2, $3)
      `, [
        id,
        req.user.id,
        notes || `Pickup scheduled for ${new Date(scheduled_pickup_time).toLocaleString()}`
      ]);
    });

    return res.json({
      success: true,
      message: 'Pickup scheduled successfully.'
    });
  } catch (err) {
    console.error('Error scheduling pickup:', err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to schedule pickup.'
    });
  }
}

/**
 * Confirm pickup / collection using Pickup Confirmation Code.
 */
async function confirmPickup(req, res) {
  const { id } = req.params;
  const { pickup_code, collected_quantity_kg, notes } = req.body;

  const collectedKg = Number(collected_quantity_kg);

  if (isNaN(collectedKg) || collectedKg <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid actual collected quantity in kg.'
    });
  }

  try {
    await transaction(async ({ get, execute }) => {
      const request = await get(
        'SELECT * FROM donation_requests WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (!request) {
        throw createStatusError('Request not found.');
      }

      if (request.request_status !== 'PICKUP_SCHEDULED') {
        throw createStatusError(
          `Invalid state: Request is in '${request.request_status}'. Pickup must be scheduled before confirming collection.`
        );
      }

      if (
        !pickup_code ||
        pickup_code.trim().toUpperCase() !==
          request.pickup_confirmation_code.toUpperCase()
      ) {
        throw createStatusError(
          'Invalid pickup confirmation code. Please check the code provided by the organizer.'
        );
      }

      await execute(`
        UPDATE donation_requests
        SET request_status = 'COLLECTED',
            collected_at = NOW(),
            collected_quantity_kg = $1
        WHERE id = $2
      `, [collectedKg, id]);

      await execute(`
        INSERT INTO status_history
          (request_id, previous_status, new_status, changed_by, notes)
        VALUES ($1, 'PICKUP_SCHEDULED', 'COLLECTED', $2, $3)
      `, [
        id,
        req.user.id,
        notes || `Collection confirmed with code. Actual weight: ${collectedKg} kg.`
      ]);
    });

    return res.json({
      success: true,
      message: `Pickup confirmed! ${collectedKg} kg recorded as collected.`,
      collected_quantity_kg: collectedKg
    });
  } catch (err) {
    console.error('Error confirming pickup:', err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to confirm pickup.'
    });
  }
}

/**
 * Confirm final handover / redistribution.
 */
async function completeHandover(req, res) {
  const { id } = req.params;
  const { handed_over_quantity_kg, notes } = req.body;

  try {
    await transaction(async ({ get, execute }) => {
      const request = await get(
        'SELECT * FROM donation_requests WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (!request) {
        throw createStatusError('Request not found.');
      }

      if (request.request_status !== 'COLLECTED') {
        throw createStatusError(
          `Invalid state: Request is in '${request.request_status}'. Food must be collected before handover can be completed.`
        );
      }

      const handedOverKg = Number(
        handed_over_quantity_kg || request.collected_quantity_kg
      );

      if (isNaN(handedOverKg) || handedOverKg <= 0) {
        throw createStatusError(
          'Valid handed-over quantity in kg is required.'
        );
      }

      await execute(`
        UPDATE donation_requests
        SET request_status = 'HANDED_OVER',
            handed_over_at = NOW(),
            handed_over_quantity_kg = $1
        WHERE id = $2
      `, [handedOverKg, id]);

      await execute(`
        UPDATE food_listings
        SET listing_status = 'COMPLETED', updated_at = NOW()
        WHERE id = $1
      `, [request.food_listing_id]);

      await execute(`
        INSERT INTO status_history
          (request_id, previous_status, new_status, changed_by, notes)
        VALUES ($1, 'COLLECTED', 'HANDED_OVER', $2, $3)
      `, [
        id,
        req.user.id,
        notes || `Food successfully distributed to beneficiaries. Final weight: ${handedOverKg} kg.`
      ]);
    });

    const request = await get(
      'SELECT handed_over_quantity_kg FROM donation_requests WHERE id = $1',
      [id]
    );

    const handedOverKg = Number(request.handed_over_quantity_kg);

    return res.json({
      success: true,
      message: `Handover complete! ${handedOverKg} kg successfully redistributed.`,
      handed_over_quantity_kg: handedOverKg
    });
  } catch (err) {
    console.error('Error completing handover:', err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to complete handover.'
    });
  }
}

/**
 * Cancel request.
 */
async function cancelRequest(req, res) {
  const { id } = req.params;
  const { cancellation_reason } = req.body;

  try {
    await transaction(async ({ get, execute }) => {
      const request = await get(
        'SELECT * FROM donation_requests WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (!request) {
        throw createStatusError('Request not found.');
      }

      if (
        ['COLLECTED', 'HANDED_OVER', 'CANCELLED', 'REJECTED']
          .includes(request.request_status)
      ) {
        throw createStatusError(
          `Cannot cancel request in '${request.request_status}' status.`
        );
      }

      await execute(`
        UPDATE donation_requests
        SET request_status = 'CANCELLED', cancellation_reason = $1
        WHERE id = $2
      `, [cancellation_reason || 'Cancelled by user', id]);

      // Release listing only if it is still claimed
      await execute(`
        UPDATE food_listings
        SET listing_status = 'AVAILABLE', updated_at = NOW()
        WHERE id = $1 AND listing_status = 'CLAIMED'
      `, [request.food_listing_id]);

      await execute(`
        INSERT INTO status_history
          (request_id, previous_status, new_status, changed_by, notes)
        VALUES ($1, $2, 'CANCELLED', $3, $4)
      `, [
        id,
        request.request_status,
        req.user.id,
        cancellation_reason || 'Cancelled'
      ]);
    });

    return res.json({
      success: true,
      message: 'Request cancelled and listing released back to available.'
    });
  } catch (err) {
    console.error('Error cancelling request:', err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to cancel request.'
    });
  }
}

/**
 * Get request details with timeline history.
 */
async function getRequestById(req, res) {
  const { id } = req.params;

  try {
    const request = await get(`
      SELECT r.*,
        f.title AS food_title,
        f.category AS food_category,
        f.quantity_kg AS listed_quantity_kg,
        f.storage_information,
        f.address AS pickup_address,
        f.area AS pickup_area,
        f.city AS pickup_city,
        f.postal_code AS pickup_postal_code,
        f.pickup_deadline,
        f.contact_person AS donor_contact_name,
        f.contact_phone AS donor_contact_phone,
        f.dietary_type,
        f.organizer_id,
        o.organization_name,
        o.city AS org_city,
        o.verification_status,
        o.collection_capacity_kg,
        u_donor.full_name AS donor_name,
        u_donor.email AS donor_email,
        u_ngo.full_name AS receiver_user_name,
        u_ngo.mobile AS receiver_mobile,
        u_ngo.email AS receiver_email
      FROM donation_requests r
      JOIN food_listings f ON r.food_listing_id = f.id
      JOIN organizations o ON r.organization_id = o.id
      JOIN users u_donor ON f.organizer_id = u_donor.id
      JOIN users u_ngo ON o.user_id = u_ngo.id
      WHERE r.id = $1
    `, [id]);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    // Only donor, receiver NGO, or admin can view
    const isDonor = String(request.organizer_id) === String(req.user.id);
    const isReceiver = req.organization &&
      String(req.organization.id) === String(request.organization_id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isDonor && !isReceiver && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this request.'
      });
    }

    const timeline = await query(`
      SELECT sh.*,
        u.full_name AS changed_by_name,
        u.role AS changed_by_role
      FROM status_history sh
      LEFT JOIN users u ON sh.changed_by = u.id
      WHERE sh.request_id = $1
      ORDER BY sh.timestamp ASC
    `, [id]);

    return res.json({
      success: true,
      request,
      timeline
    });
  } catch (err) {
    console.error('Error retrieving request:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve request details.'
    });
  }
}

/**
 * Get all requests for currently authenticated NGO.
 */
async function getMyNgoRequests(req, res) {
  if (!req.organization) {
    return res.status(400).json({
      success: false,
      message: 'No organization profile found.'
    });
  }

  try {
    const requests = await query(`
      SELECT r.*,
        f.title AS food_title,
        f.category AS food_category,
        f.quantity_kg AS listed_quantity_kg,
        f.pickup_deadline,
        f.address AS pickup_address,
        f.city AS pickup_city,
        f.area AS pickup_area,
        f.contact_person,
        f.contact_phone,
        f.storage_information,
        u.full_name AS organizer_name
      FROM donation_requests r
      JOIN food_listings f ON r.food_listing_id = f.id
      JOIN users u ON f.organizer_id = u.id
      WHERE r.organization_id = $1
      ORDER BY r.requested_at DESC
    `, [req.organization.id]);

    return res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    console.error('Error fetching NGO requests:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve requests.'
    });
  }
}

module.exports = {
  acceptListing,
  schedulePickup,
  confirmPickup,
  completeHandover,
  cancelRequest,
  getRequestById,
  getMyNgoRequests
};
