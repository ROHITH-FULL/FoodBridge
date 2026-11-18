
const { query, get, transaction } = require('../database/db.postgres');

async function getMyOrg(req, res) {
  try {
    if (!req.organization) {
      return res.status(404).json({
        success: false,
        message: 'No organization registered for this user.'
      });
    }

    const verifications = await query(`
      SELECT ov.*, u.full_name AS reviewer_name
      FROM organization_verifications ov
      JOIN users u ON ov.reviewer_id = u.id
      WHERE ov.organization_id = $1
      ORDER BY ov.reviewed_at DESC
    `, [req.organization.id]);

    return res.json({
      success: true,
      organization: req.organization,
      verification_history: verifications
    });
  } catch (err) {
    console.error('Error retrieving organization:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organization details.'
    });
  }
}

async function updateMyOrg(req, res) {
  if (!req.organization) {
    return res.status(404).json({
      success: false,
      message: 'Organization profile not found.'
    });
  }

  const {
    organization_name,
    registration_details,
    address,
    city,
    postal_code,
    collection_capacity_kg,
    availability_information
  } = req.body;

  try {
    await query(`
      UPDATE organizations
      SET organization_name = $1,
          registration_details = $2,
          address = $3,
          city = $4,
          postal_code = $5,
          collection_capacity_kg = $6,
          availability_information = $7
      WHERE id = $8
    `, [
      organization_name ? organization_name.trim() : req.organization.organization_name,
      registration_details !== undefined
        ? registration_details
        : req.organization.registration_details,
      address ? address.trim() : req.organization.address,
      city ? city.trim() : req.organization.city,
      postal_code ? postal_code.trim() : req.organization.postal_code,
      collection_capacity_kg !== undefined && collection_capacity_kg !== ''
        ? Number(collection_capacity_kg)
        : req.organization.collection_capacity_kg,
      availability_information || req.organization.availability_information,
      req.organization.id
    ]);

    const updated = await get(
      'SELECT * FROM organizations WHERE id = $1',
      [req.organization.id]
    );

    return res.json({
      success: true,
      message: 'Organization details updated.',
      organization: updated
    });
  } catch (err) {
    console.error('Error updating organization:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update organization details.'
    });
  }
}

async function listOrganizations(req, res) {
  const { status, city } = req.query;

  let sql = `
    SELECT o.*,
      u.full_name AS contact_name,
      u.email AS contact_email,
      u.mobile AS contact_mobile,
      (
        SELECT COUNT(*)
        FROM donation_requests r
        WHERE r.organization_id = o.id
          AND r.request_status = 'HANDED_OVER'
      ) AS completed_collections_count
    FROM organizations o
    JOIN users u ON o.user_id = u.id
    WHERE 1 = 1
  `;

  const params = [];

  if (status) {
    params.push(status);
    sql += ` AND o.verification_status = $${params.length}`;
  }

  if (city) {
    params.push(`%${city.trim()}%`);
    sql += ` AND LOWER(o.city) LIKE LOWER($${params.length})`;
  }

  sql += ' ORDER BY o.created_at DESC';

  try {
    const orgs = await query(sql, params);

    return res.json({
      success: true,
      count: orgs.length,
      organizations: orgs
    });
  } catch (err) {
    console.error('Error listing organizations:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizations.'
    });
  }
}

async function updateVerification(req, res) {
  const { id } = req.params;
  const { review_status, review_notes } = req.body;

  if (!['VERIFIED', 'REJECTED'].includes(review_status)) {
    return res.status(400).json({
      success: false,
      message: 'Review status must be either "VERIFIED" or "REJECTED".'
    });
  }

  try {
    const org = await get(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.'
      });
    }

    await transaction(async ({ execute }) => {
      await execute(`
        UPDATE organizations
        SET verification_status = $1
        WHERE id = $2
      `, [review_status, id]);

      await execute(`
        INSERT INTO organization_verifications
          (organization_id, review_status, reviewer_id, review_notes)
        VALUES ($1, $2, $3, $4)
      `, [
        id,
        review_status,
        req.user.id,
        review_notes || `Status updated to ${review_status}`
      ]);
    });

    return res.json({
      success: true,
      message: `Organization successfully marked as ${review_status}.`,
      organization_id: Number(id),
      verification_status: review_status
    });
  } catch (err) {
    console.error('Error updating verification:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update organization verification.'
    });
  }
}

module.exports = {
  getMyOrg,
  updateMyOrg,
  listOrganizations,
  updateVerification
};
