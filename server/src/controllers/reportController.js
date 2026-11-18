
const { query, get } = require('../database/db.postgres');

async function createReport(req, res) {
  const { listing_id, request_id, reason, details } = req.body;

  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Reason for report is required.'
    });
  }

  try {
    const created = await get(`
      INSERT INTO reports
        (reporter_id, listing_id, request_id, reason, details, report_status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING *
    `, [
      req.user.id,
      listing_id || null,
      request_id || null,
      reason.trim(),
      details ? details.trim() : null
    ]);

    return res.status(201).json({
      success: true,
      message: 'Report submitted. Our administrative safety team will review it.',
      report: created
    });
  } catch (err) {
    console.error('Error creating report:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report.'
    });
  }
}

async function getReports(req, res) {
  try {
    const reports = await query(`
      SELECT
        r.*,
        u.full_name AS reporter_name,
        u.email AS reporter_email,
        u.role AS reporter_role,
        f.title AS listing_title
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN food_listings f ON r.listing_id = f.id
      ORDER BY r.created_at DESC
    `);

    return res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports.'
    });
  }
}

async function resolveReport(req, res) {
  const { id } = req.params;
  const { status, resolution_notes } = req.body;

  if (!['INVESTIGATING', 'RESOLVED', 'DISMISSED'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be INVESTIGATING, RESOLVED, or DISMISSED.'
    });
  }

  try {
    const updated = await get(`
      UPDATE reports
      SET report_status = $1
      WHERE id = $2
      RETURNING id
    `, [status, id]);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }

    return res.json({
      success: true,
      message: `Report marked as ${status}.`
    });
  } catch (err) {
    console.error('Error updating report:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update report.'
    });
  }
}

module.exports = {
  createReport,
  getReports,
  resolveReport
};
