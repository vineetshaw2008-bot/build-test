const express = require('express');
const { getDatabase } = require('../db/init');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all forms routes
router.use(verifyToken);

/**
 * GET /api/forms/:sheetId
 * Get form definition for a sheet
 */
router.get('/:sheetId', (req, res) => {
  try {
    const { sheetId } = req.params;
    const { userId } = req.user;
    const db = getDatabase();

    // Get sheet and check access (any team member can view form)
    const sheet = db.prepare(`
      SELECT s.*, t.owner_id 
      FROM sheets s
      JOIN teams t ON s.team_id = t.id
      WHERE s.id = ?
    `).get(sheetId);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    // Check if user is member of the team or owner
    const isMember = db.prepare(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
    ).get(sheet.team_id, userId);
    if (sheet.owner_id !== userId && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let formFields = null;
    let formEnabled = sheet.form_enabled || 0;
    if (sheet.form_fields) {
      try {
        formFields = JSON.parse(sheet.form_fields);
      } catch (e) {
        formFields = null;
      }
    }
    if (!formFields && sheet.columns_config) {
      try {
        formFields = JSON.parse(sheet.columns_config);
      } catch (e) {
        formFields = [];
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        sheetId: sheet.id,
        form_enabled: formEnabled,
        form_fields: formFields || [],
        fields: formFields || []
      }
    });
  } catch (error) {
    console.error('Get form definition error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/forms/:sheetId/submit
 * Submit form -> create new row in sheet_rows
 * Body: row data matching the form fields
 */
router.post('/:sheetId/submit', (req, res) => {
  try {
    const { sheetId } = req.params;
    const { userId } = req.user;
    const rowData = req.body; // Expecting an object with column keys and values
    const db = getDatabase();

    // Get sheet and check access (any team member can submit if form enabled)
    const sheet = db.prepare(`
      SELECT s.*, t.owner_id 
      FROM sheets s
      JOIN teams t ON s.team_id = t.id
      WHERE s.id = ?
    `).get(sheetId);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    // Check if form is enabled
    if (!sheet.form_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Form is not enabled for this sheet'
      });
    }

    // Check if user is member of the team
    const isMember = db.prepare(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
    ).get(sheet.team_id, userId);
    if (sheet.owner_id !== userId && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only team members can submit forms'
      });
    }

    // Validate rowData against form_fields if needed (optional)
    // For now, we'll just store as JSON

    const lastRow = db.prepare(
      'SELECT COALESCE(MAX(row_number), 0) AS max_row FROM sheet_rows WHERE sheet_id = ?'
    ).get(sheetId);

    const insertStmt = db.prepare(`
      INSERT INTO sheet_rows (sheet_id, row_number, data, submitted_by)
      VALUES (?, ?, ?, ?)
    `);
    const result = insertStmt.run(
      sheetId,
      (lastRow?.max_row || 0) + 1,
      JSON.stringify(rowData),
      userId
    );

    return res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        rowId: result.lastInsertRowid,
        sheetId: sheet.id,
        submittedBy: userId,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
