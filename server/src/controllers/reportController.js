const { query, get, run } = require('../database/db');

function createReport(req, res) {
  const { listing_id, request_id, reason, details } = req.body;

  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Reason for report is required.' });
  }

  try {
    const result = run(`
      INSERT INTO reports (reporter_id, listing_id, request_id, reason, details, report_status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `, [
      req.user.id,
      listing_id || null,
      request_id || null,
      reason.trim(),
      details ? details.trim() : null
    ]);

    const created = get('SELECT * FROM reports WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({
      success: true,
      message: 'Report submitted. Our administrative safety team will review it.',
      report: created
    });
  } catch (err) {
    console.error('Error creating report:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
}

function getReports(req, res) {
  try {
    const reports = query(`
      SELECT r.*, u.full_name as reporter_name, u.email as reporter_email, u.role as reporter_role,
        f.title as listing_title
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN food_listings f ON r.listing_id = f.id
      ORDER BY r.created_at DESC
    `);

    return res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
  }
}

function resolveReport(req, res) {
  const { id } = req.params;
  const { status, resolution_notes } = req.body;

  if (!['INVESTIGATING', 'RESOLVED', 'DISMISSED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be INVESTIGATING, RESOLVED, or DISMISSED.' });
  }

  try {
    run(`
      UPDATE reports
      SET report_status = ?
      WHERE id = ?
    `, [status, id]);

    return res.json({ success: true, message: `Report marked as ${status}.` });
  } catch (err) {
    console.error('Error updating report:', err);
    return res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
}

module.exports = {
  createReport,
  getReports,
  resolveReport,
};
