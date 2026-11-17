const { query, get, run, transaction } = require('../database/db');

function getMyOrg(req, res) {
  if (!req.organization) {
    return res.status(404).json({ success: false, message: 'No organization registered for this user.' });
  }

  const verifications = query(`
    SELECT ov.*, u.full_name as reviewer_name
    FROM organization_verifications ov
    JOIN users u ON ov.reviewer_id = u.id
    WHERE ov.organization_id = ?
    ORDER BY ov.reviewed_at DESC
  `, [req.organization.id]);

  return res.json({
    success: true,
    organization: req.organization,
    verification_history: verifications
  });
}

function updateMyOrg(req, res) {
  if (!req.organization) {
    return res.status(404).json({ success: false, message: 'Organization profile not found.' });
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
    run(`
      UPDATE organizations
      SET organization_name = ?, registration_details = ?, address = ?, city = ?,
          postal_code = ?, collection_capacity_kg = ?, availability_information = ?
      WHERE id = ?
    `, [
      organization_name ? organization_name.trim() : req.organization.organization_name,
      registration_details !== undefined ? registration_details : req.organization.registration_details,
      address ? address.trim() : req.organization.address,
      city ? city.trim() : req.organization.city,
      postal_code ? postal_code.trim() : req.organization.postal_code,
      collection_capacity_kg ? Number(collection_capacity_kg) : req.organization.collection_capacity_kg,
      availability_information || req.organization.availability_information,
      req.organization.id
    ]);

    const updated = get('SELECT * FROM organizations WHERE id = ?', [req.organization.id]);
    return res.json({ success: true, message: 'Organization details updated.', organization: updated });
  } catch (err) {
    console.error('Error updating organization:', err);
    return res.status(500).json({ success: false, message: 'Failed to update organization details.' });
  }
}

function listOrganizations(req, res) {
  const { status, city } = req.query;

  let sql = `
    SELECT o.*, u.full_name as contact_name, u.email as contact_email, u.mobile as contact_mobile,
      (SELECT COUNT(*) FROM donation_requests r WHERE r.organization_id = o.id AND r.request_status = 'HANDED_OVER') as completed_collections_count
    FROM organizations o
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND o.verification_status = ?';
    params.push(status);
  }

  if (city) {
    sql += ' AND LOWER(o.city) LIKE LOWER(?)';
    params.push(`%${city.trim()}%`);
  }

  sql += ' ORDER BY o.created_at DESC';

  try {
    const orgs = query(sql, params);
    return res.json({ success: true, count: orgs.length, organizations: orgs });
  } catch (err) {
    console.error('Error listing organizations:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve organizations.' });
  }
}

function updateVerification(req, res) {
  const { id } = req.params;
  const { review_status, review_notes } = req.body;

  if (!['VERIFIED', 'REJECTED'].includes(review_status)) {
    return res.status(400).json({
      success: false,
      message: 'Review status must be either "VERIFIED" or "REJECTED".'
    });
  }

  const org = get('SELECT * FROM organizations WHERE id = ?', [id]);
  if (!org) {
    return res.status(404).json({ success: false, message: 'Organization not found.' });
  }

  try {
    transaction(({ run }) => {
      run(`
        UPDATE organizations
        SET verification_status = ?
        WHERE id = ?
      `, [review_status, id]);

      run(`
        INSERT INTO organization_verifications (organization_id, review_status, reviewer_id, review_notes)
        VALUES (?, ?, ?, ?)
      `, [id, review_status, req.user.id, review_notes || `Status updated to ${review_status}`]);
    });

    return res.json({
      success: true,
      message: `Organization successfully marked as ${review_status}.`,
      organization_id: Number(id),
      verification_status: review_status
    });
  } catch (err) {
    console.error('Error updating verification:', err);
    return res.status(500).json({ success: false, message: 'Failed to update organization verification.' });
  }
}

module.exports = {
  getMyOrg,
  updateMyOrg,
  listOrganizations,
  updateVerification,
};
