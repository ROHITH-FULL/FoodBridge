const { query, get, run, transaction } = require('../database/db');

function createListing(req, res) {
  const {
    title,
    category,
    description,
    quantity_kg,
    estimated_servings,
    preparation_time,
    dietary_type,
    storage_information,
    address,
    area,
    city,
    postal_code,
    pickup_deadline,
    contact_person,
    contact_phone,
    image_url,
    safety_declaration
  } = req.body;

  const eligibilityStatus = req.calculatedEligibility || 'ELIGIBLE';

  try {
    const result = run(`
      INSERT INTO food_listings (
        organizer_id, title, category, description, quantity_kg, estimated_servings,
        preparation_time, dietary_type, storage_information, address, area, city, postal_code,
        pickup_deadline, contact_person, contact_phone, image_url, safety_declaration,
        eligibility_status, listing_status, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)
    `, [
      req.user.id,
      title.trim(),
      category,
      description ? description.trim() : '',
      Number(quantity_kg),
      estimated_servings ? Number(estimated_servings) : null,
      preparation_time,
      dietary_type || 'VEGETARIAN',
      storage_information.trim(),
      address.trim(),
      area ? area.trim() : null,
      city.trim(),
      postal_code.trim(),
      pickup_deadline,
      contact_person.trim(),
      contact_phone.trim(),
      image_url || null,
      safety_declaration ? 1 : 0,
      eligibilityStatus,
      process.env.DEMO_MODE === 'true' ? 1 : 0
    ]);

    const created = get('SELECT * FROM food_listings WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: 'Surplus food listing created successfully!',
      listing: created
    });
  } catch (err) {
    console.error('Error creating food listing:', err);
    return res.status(500).json({ success: false, message: 'Failed to create food listing.' });
  }
}

function getAvailableListings(req, res) {
  const { category, city, min_quantity, search, dietary_type } = req.query;

  let sql = `
    SELECT f.*, u.full_name as organizer_name,
      (SELECT COUNT(*) FROM donation_requests r WHERE r.food_listing_id = f.id AND r.request_status IN ('REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED')) as active_requests_count
    FROM food_listings f
    JOIN users u ON f.organizer_id = u.id
    WHERE f.listing_status = 'AVAILABLE'
      AND datetime(f.pickup_deadline) > datetime('now')
  `;
  const params = [];

  if (category) {
    sql += ' AND f.category = ?';
    params.push(category);
  }

  if (city) {
    sql += ' AND LOWER(f.city) LIKE LOWER(?)';
    params.push(`%${city.trim()}%`);
  }

  if (dietary_type) {
    sql += ' AND f.dietary_type = ?';
    params.push(dietary_type);
  }

  if (min_quantity && !isNaN(Number(min_quantity))) {
    sql += ' AND f.quantity_kg >= ?';
    params.push(Number(min_quantity));
  }

  if (search) {
    sql += ' AND (LOWER(f.title) LIKE LOWER(?) OR LOWER(f.description) LIKE LOWER(?) OR LOWER(f.area) LIKE LOWER(?))';
    const s = `%${search.trim()}%`;
    params.push(s, s, s);
  }

  sql += ' ORDER BY f.pickup_deadline ASC';

  try {
    const listings = query(sql, params);
    return res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    console.error('Error fetching available listings:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve food listings.' });
  }
}

function getListingById(req, res) {
  const { id } = req.params;
  const listing = get(`
    SELECT f.*, u.full_name as organizer_name, u.email as organizer_email, u.mobile as organizer_mobile
    FROM food_listings f
    JOIN users u ON f.organizer_id = u.id
    WHERE f.id = ?
  `, [id]);

  if (!listing) {
    return res.status(404).json({ success: false, message: 'Food listing not found.' });
  }

  // Fetch active requests associated with this listing
  const requests = query(`
    SELECT r.*, o.organization_name, o.city as org_city, o.verification_status, o.collection_capacity_kg,
      u.full_name as contact_user_name, u.mobile as contact_user_mobile
    FROM donation_requests r
    JOIN organizations o ON r.organization_id = o.id
    JOIN users u ON o.user_id = u.id
    WHERE r.food_listing_id = ?
    ORDER BY r.requested_at DESC
  `, [id]);

  return res.json({
    success: true,
    listing,
    requests
  });
}

function getMyListings(req, res) {
  try {
    const listings = query(`
      SELECT f.*,
        (SELECT COUNT(*) FROM donation_requests r WHERE r.food_listing_id = f.id) as total_requests,
        (SELECT r.request_status FROM donation_requests r WHERE r.food_listing_id = f.id ORDER BY r.id DESC LIMIT 1) as current_request_status,
        (SELECT r.id FROM donation_requests r WHERE r.food_listing_id = f.id ORDER BY r.id DESC LIMIT 1) as current_request_id,
        (SELECT r.pickup_confirmation_code FROM donation_requests r WHERE r.food_listing_id = f.id ORDER BY r.id DESC LIMIT 1) as pickup_code,
        (SELECT o.organization_name FROM donation_requests r JOIN organizations o ON r.organization_id = o.id WHERE r.food_listing_id = f.id ORDER BY r.id DESC LIMIT 1) as claimed_by_org
      FROM food_listings f
      WHERE f.organizer_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    return res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    console.error('Error fetching organizer listings:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your listings.' });
  }
}

function updateListing(req, res) {
  const { id } = req.params;
  const listing = get('SELECT * FROM food_listings WHERE id = ?', [id]);

  if (!listing) {
    return res.status(404).json({ success: false, message: 'Food listing not found.' });
  }

  if (listing.organizer_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You are not authorized to edit this listing.' });
  }

  if (listing.listing_status !== 'AVAILABLE') {
    return res.status(400).json({ success: false, message: `Cannot edit listing with status '${listing.listing_status}'. Only AVAILABLE listings can be modified.` });
  }

  const {
    title,
    category,
    description,
    quantity_kg,
    estimated_servings,
    preparation_time,
    dietary_type,
    storage_information,
    address,
    area,
    city,
    postal_code,
    pickup_deadline,
    contact_person,
    contact_phone
  } = req.body;

  try {
    run(`
      UPDATE food_listings
      SET title = ?, category = ?, description = ?, quantity_kg = ?, estimated_servings = ?,
          preparation_time = ?, dietary_type = ?, storage_information = ?, address = ?, area = ?,
          city = ?, postal_code = ?, pickup_deadline = ?, contact_person = ?, contact_phone = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [
      title ? title.trim() : listing.title,
      category || listing.category,
      description !== undefined ? description.trim() : listing.description,
      quantity_kg ? Number(quantity_kg) : listing.quantity_kg,
      estimated_servings ? Number(estimated_servings) : listing.estimated_servings,
      preparation_time || listing.preparation_time,
      dietary_type || listing.dietary_type,
      storage_information ? storage_information.trim() : listing.storage_information,
      address ? address.trim() : listing.address,
      area !== undefined ? area.trim() : listing.area,
      city ? city.trim() : listing.city,
      postal_code ? postal_code.trim() : listing.postal_code,
      pickup_deadline || listing.pickup_deadline,
      contact_person ? contact_person.trim() : listing.contact_person,
      contact_phone ? contact_phone.trim() : listing.contact_phone,
      id
    ]);

    const updated = get('SELECT * FROM food_listings WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Listing updated successfully.', listing: updated });
  } catch (err) {
    console.error('Error updating listing:', err);
    return res.status(500).json({ success: false, message: 'Failed to update listing.' });
  }
}

function cancelListing(req, res) {
  const { id } = req.params;
  const { cancellation_reason } = req.body;
  const listing = get('SELECT * FROM food_listings WHERE id = ?', [id]);

  if (!listing) {
    return res.status(404).json({ success: false, message: 'Food listing not found.' });
  }

  if (listing.organizer_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Not authorized to cancel this listing.' });
  }

  if (['COMPLETED', 'CANCELLED'].includes(listing.listing_status)) {
    return res.status(400).json({ success: false, message: `Listing is already ${listing.listing_status}.` });
  }

  try {
    transaction(({ run }) => {
      run(`
        UPDATE food_listings
        SET listing_status = 'CANCELLED', updated_at = datetime('now')
        WHERE id = ?
      `, [id]);

      // Cancel any pending/active requests on this listing
      run(`
        UPDATE donation_requests
        SET request_status = 'CANCELLED', cancellation_reason = ?
        WHERE food_listing_id = ? AND request_status IN ('REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED')
      `, [cancellation_reason || 'Cancelled by food donor', id]);
    });

    return res.json({ success: true, message: 'Listing cancelled successfully.' });
  } catch (err) {
    console.error('Error cancelling listing:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel listing.' });
  }
}

module.exports = {
  createListing,
  getAvailableListings,
  getListingById,
  getMyListings,
  updateListing,
  cancelListing,
};
