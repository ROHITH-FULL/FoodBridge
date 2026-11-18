
const { query, get, transaction } = require('../database/db.postgres');

async function createListing(req, res) {
  try {
    const {
      title, category, description, quantity_kg, estimated_servings,
      preparation_time, dietary_type, storage_information, address,
      area, city, postal_code, pickup_deadline, contact_person,
      contact_phone, image_url, safety_declaration
    } = req.body;

    const eligibilityStatus = req.calculatedEligibility || 'ELIGIBLE';

    const result = await query(`
      INSERT INTO food_listings (
        organizer_id, title, category, description, quantity_kg,
        estimated_servings, preparation_time, dietary_type,
        storage_information, address, area, city, postal_code,
        pickup_deadline, contact_person, contact_phone, image_url,
        safety_declaration, eligibility_status, listing_status, is_demo
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, 'AVAILABLE', $20
      )
      RETURNING *
    `, [
      req.user.id, title.trim(), category,
      description ? description.trim() : '',
      Number(quantity_kg),
      estimated_servings ? Number(estimated_servings) : null,
      preparation_time, dietary_type || 'VEGETARIAN',
      storage_information.trim(), address.trim(),
      area ? area.trim() : null, city.trim(), postal_code.trim(),
      pickup_deadline, contact_person.trim(), contact_phone.trim(),
      image_url || null, safety_declaration ? 1 : 0,
      eligibilityStatus,
      process.env.DEMO_MODE === 'true' ? 1 : 0
    ]);

    return res.status(201).json({
      success: true,
      message: 'Surplus food listing created successfully!',
      listing: result[0]
    });
  } catch (err) {
    console.error('Error creating food listing:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create food listing.'
    });
  }
}

async function getAvailableListings(req, res) {
  try {
    const { category, city, min_quantity, search, dietary_type } = req.query;

    let sql = `
      SELECT f.*, u.full_name AS organizer_name,
        (
          SELECT COUNT(*) FROM donation_requests r
          WHERE r.food_listing_id = f.id
            AND r.request_status IN ('REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED')
        ) AS active_requests_count
      FROM food_listings f
      JOIN users u ON f.organizer_id = u.id
      WHERE f.listing_status = 'AVAILABLE'
        AND f.pickup_deadline > NOW()
    `;

    const params = [];

    if (category) {
      params.push(category);
      sql += ` AND f.category = $${params.length}`;
    }

    if (city) {
      params.push(`%${city.trim()}%`);
      sql += ` AND LOWER(f.city) LIKE LOWER($${params.length})`;
    }

    if (dietary_type) {
      params.push(dietary_type);
      sql += ` AND f.dietary_type = $${params.length}`;
    }

    if (min_quantity && !isNaN(Number(min_quantity))) {
      params.push(Number(min_quantity));
      sql += ` AND f.quantity_kg >= $${params.length}`;
    }

    if (search) {
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm);
      const index = params.length;

      sql += `
        AND (
          LOWER(f.title) LIKE LOWER($${index})
          OR LOWER(f.description) LIKE LOWER($${index})
          OR LOWER(f.area) LIKE LOWER($${index})
        )
      `;
    }

    sql += ' ORDER BY f.pickup_deadline ASC';

    const listings = await query(sql, params);

    return res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (err) {
    console.error('Error fetching available listings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve food listings.'
    });
  }
}

async function getListingById(req, res) {
  try {
    const { id } = req.params;

    const listing = await get(`
      SELECT f.*, u.full_name AS organizer_name,
        u.email AS organizer_email, u.mobile AS organizer_mobile
      FROM food_listings f
      JOIN users u ON f.organizer_id = u.id
      WHERE f.id = $1
    `, [id]);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found.'
      });
    }

    const requests = await query(`
      SELECT r.*, o.organization_name,
        o.city AS org_city, o.verification_status,
        o.collection_capacity_kg,
        u.full_name AS contact_user_name,
        u.mobile AS contact_user_mobile
      FROM donation_requests r
      JOIN organizations o ON r.organization_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE r.food_listing_id = $1
      ORDER BY r.requested_at DESC
    `, [id]);

    return res.json({ success: true, listing, requests });
  } catch (err) {
    console.error('Error fetching food listing:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve food listing.'
    });
  }
}

async function getMyListings(req, res) {
  try {
    const listings = await query(`
      SELECT f.*,
        (SELECT COUNT(*) FROM donation_requests r
         WHERE r.food_listing_id = f.id) AS total_requests,
        (SELECT r.request_status FROM donation_requests r
         WHERE r.food_listing_id = f.id
         ORDER BY r.id DESC LIMIT 1) AS current_request_status,
        (SELECT r.id FROM donation_requests r
         WHERE r.food_listing_id = f.id
         ORDER BY r.id DESC LIMIT 1) AS current_request_id,
        (SELECT r.pickup_confirmation_code FROM donation_requests r
         WHERE r.food_listing_id = f.id
         ORDER BY r.id DESC LIMIT 1) AS pickup_code,
        (SELECT o.organization_name FROM donation_requests r
         JOIN organizations o ON r.organization_id = o.id
         WHERE r.food_listing_id = f.id
         ORDER BY r.id DESC LIMIT 1) AS claimed_by_org
      FROM food_listings f
      WHERE f.organizer_id = $1
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    return res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (err) {
    console.error('Error fetching organizer listings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your listings.'
    });
  }
}

async function updateListing(req, res) {
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

    if (
      String(listing.organizer_id) !== String(req.user.id) &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this listing.'
      });
    }

    if (listing.listing_status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit listing with status '${listing.listing_status}'. Only AVAILABLE listings can be modified.`
      });
    }

    const {
      title, category, description, quantity_kg, estimated_servings,
      preparation_time, dietary_type, storage_information, address,
      area, city, postal_code, pickup_deadline, contact_person,
      contact_phone
    } = req.body;

    const updated = await query(`
      UPDATE food_listings
      SET title = $1, category = $2, description = $3,
          quantity_kg = $4, estimated_servings = $5,
          preparation_time = $6, dietary_type = $7,
          storage_information = $8, address = $9, area = $10,
          city = $11, postal_code = $12, pickup_deadline = $13,
          contact_person = $14, contact_phone = $15,
          updated_at = NOW()
      WHERE id = $16
      RETURNING *
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
      area !== undefined ? (area ? area.trim() : null) : listing.area,
      city ? city.trim() : listing.city,
      postal_code ? postal_code.trim() : listing.postal_code,
      pickup_deadline || listing.pickup_deadline,
      contact_person ? contact_person.trim() : listing.contact_person,
      contact_phone ? contact_phone.trim() : listing.contact_phone,
      id
    ]);

    return res.json({
      success: true,
      message: 'Listing updated successfully.',
      listing: updated[0]
    });
  } catch (err) {
    console.error('Error updating listing:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update listing.'
    });
  }
}

async function cancelListing(req, res) {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

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

    if (
      String(listing.organizer_id) !== String(req.user.id) &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this listing.'
      });
    }

    if (['COMPLETED', 'CANCELLED'].includes(listing.listing_status)) {
      return res.status(400).json({
        success: false,
        message: `Listing is already ${listing.listing_status}.`
      });
    }

    await transaction(async ({ execute }) => {
      await execute(`
        UPDATE food_listings
        SET listing_status = 'CANCELLED', updated_at = NOW()
        WHERE id = $1
      `, [id]);

      await execute(`
        UPDATE donation_requests
        SET request_status = 'CANCELLED',
            cancellation_reason = $1
        WHERE food_listing_id = $2
          AND request_status IN ('REQUESTED', 'ACCEPTED', 'PICKUP_SCHEDULED')
      `, [cancellation_reason || 'Cancelled by food donor', id]);
    });

    return res.json({
      success: true,
      message: 'Listing cancelled successfully.'
    });
  } catch (err) {
    console.error('Error cancelling listing:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel listing.'
    });
  }
}

module.exports = {
  createListing,
  getAvailableListings,
  getListingById,
  getMyListings,
  updateListing,
  cancelListing
};
