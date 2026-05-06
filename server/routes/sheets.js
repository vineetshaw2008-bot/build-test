const express = require('express');
const { getDatabase } = require('../db/init');
const { verifyToken } = require('../middleware/auth');
const { upload, importExcelToSheet } = require('../services/excelParser');
const { exportSheetToExcel } = require('../services/excelExporter');

const router = express.Router();

// Apply auth middleware to all sheet routes
router.use(verifyToken);

/**
 * Helper: Check if user has access to team
 */
function hasTeamAccess(userId, teamId) {
  const db = getDatabase();
  const team = db.prepare('SELECT owner_id FROM teams WHERE id = ?').get(teamId);
  
  if (!team) return false;
  
  if (team.owner_id === userId) return true;
  
  const isMember = db.prepare(
    'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
  ).get(teamId, userId);
  
  return !!isMember;
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function getColumnsFromRows(rows) {
  const seen = new Set();
  const columns = [];

  for (const row of rows) {
    const data = parseJson(row.data, {});
    Object.keys(data).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push({
          key,
          label: key,
          type: typeof data[key] === 'number' ? 'number' : 'text',
          required: false
        });
      }
    });
  }

  return columns;
}

function normalizeSheet(sheet, rows = []) {
  const parsedRows = rows.map((row) => ({
    id: row.id,
    sheet_id: row.sheet_id,
    row_number: row.row_number,
    created_at: row.created_at,
    updated_at: row.updated_at,
    submitted_by: row.submitted_by,
    ...parseJson(row.data, {})
  }));
  const rawColumns = parseJson(sheet.columns_config, null);
  const columns = rawColumns && rawColumns.length ? rawColumns : getColumnsFromRows(rows);

  return {
    ...sheet,
    columns_config: columns,
    form_enabled: Boolean(sheet.form_enabled),
    form_fields: parseJson(sheet.form_fields, null),
    rows: parsedRows,
    row_count: parsedRows.length
  };
}

/**
 * GET /api/sheets
 * Get all sheets for a team
 * Query params: ?teamId=<id>
 */
router.get('/', (req, res) => {
  try {
    const { teamId } = req.query;
    const { userId } = req.user;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'teamId query parameter is required'
      });
    }

    // Check access
    if (!hasTeamAccess(userId, teamId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const db = getDatabase();

    const sheets = db.prepare(`
      SELECT s.*, COUNT(sr.id) AS row_count
      FROM sheets s
      LEFT JOIN sheet_rows sr ON sr.sheet_id = s.id
      WHERE s.team_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all(teamId).map((sheet) => ({
      ...sheet,
      columns_config: parseJson(sheet.columns_config, []),
      form_enabled: Boolean(sheet.form_enabled),
      form_fields: parseJson(sheet.form_fields, null)
    }));

    return res.status(200).json({
      success: true,
      data: sheets
    });
  } catch (error) {
    console.error('Get sheets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/sheets/:id
 * Get a specific sheet with all rows
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const db = getDatabase();

    // Get sheet
    const sheet = db.prepare('SELECT * FROM sheets WHERE id = ?').get(id);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    // Check access
    if (!hasTeamAccess(userId, sheet.team_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get rows
    const rows = db.prepare(
      'SELECT * FROM sheet_rows WHERE sheet_id = ? ORDER BY row_number ASC'
    ).all(id);

    return res.status(200).json({
      success: true,
      data: {
        ...normalizeSheet(sheet, rows)
      }
    });
  } catch (error) {
    console.error('Get sheet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/sheets
 * Create a new sheet
 * Body: { teamId, name, description }
 */
router.post('/', (req, res) => {
  try {
    const { teamId, name, description, columns = [] } = req.body;
    const { userId } = req.user;

    // Validation
    if (!teamId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Team ID and sheet name are required'
      });
    }

    // Check access
    if (!hasTeamAccess(userId, teamId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const db = getDatabase();

    // Insert sheet
    const insertStmt = db.prepare(
      'INSERT INTO sheets (team_id, name, description, columns_config) VALUES (?, ?, ?, ?)'
    );
    const result = insertStmt.run(teamId, name, description || null, JSON.stringify(columns));

    return res.status(201).json({
      success: true,
      message: 'Sheet created successfully',
      data: {
        id: result.lastInsertRowid,
        team_id: teamId,
        name,
        description,
        columns_config: columns,
        rows: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create sheet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/sheets/:id
 * Update a sheet
 * Body: { name, description }
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const { userId } = req.user;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Sheet name is required'
      });
    }

    const db = getDatabase();

    // Get sheet
    const sheet = db.prepare('SELECT team_id FROM sheets WHERE id = ?').get(id);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    // Check access
    if (!hasTeamAccess(userId, sheet.team_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update sheet
    const updateStmt = db.prepare(
      'UPDATE sheets SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    updateStmt.run(name, description || null, id);

    return res.status(200).json({
      success: true,
      message: 'Sheet updated successfully'
    });
  } catch (error) {
    console.error('Update sheet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /api/sheets/:id
 * Delete a sheet
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const db = getDatabase();

    // Get sheet
    const sheet = db.prepare('SELECT team_id FROM sheets WHERE id = ?').get(id);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    // Check access
    if (!hasTeamAccess(userId, sheet.team_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete sheet (cascade deletes rows)
    const deleteStmt = db.prepare('DELETE FROM sheets WHERE id = ?');
    deleteStmt.run(id);

    return res.status(200).json({
      success: true,
      message: 'Sheet deleted successfully'
    });
  } catch (error) {
    console.error('Delete sheet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/sheets/:id/rows
 * Add rows to a sheet
 * Body: { rows: [{ row_number, data }] }
 */
router.post('/:id/rows', (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = req.body;
    const { userId } = req.user;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rows array is required and must not be empty'
      });
    }

    const db = getDatabase();

    // Get sheet
    const sheet = db.prepare('SELECT team_id FROM sheets WHERE id = ?').get(id);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    // Check access
    if (!hasTeamAccess(userId, sheet.team_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Insert rows
    const insertStmt = db.prepare(
      'INSERT INTO sheet_rows (sheet_id, row_number, data) VALUES (?, ?, ?)'
    );

    const insertedRows = [];
    for (const row of rows) {
      const result = insertStmt.run(id, row.row_number, JSON.stringify(row.data));
      insertedRows.push({
        id: result.lastInsertRowid,
        sheet_id: id,
        row_number: row.row_number,
        data: row.data
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Rows added successfully',
      data: insertedRows
    });
  } catch (error) {
    console.error('Add rows error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/sheets/:id/rows/:rowId
 * Update a specific row.
 */
router.put('/:id/rows/:rowId', (req, res) => {
  try {
    const { id, rowId } = req.params;
    const { userId } = req.user;
    const rowData = req.body?.data || req.body;
    const db = getDatabase();

    const sheet = db.prepare('SELECT team_id FROM sheets WHERE id = ?').get(id);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    if (!hasTeamAccess(userId, sheet.team_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const current = db.prepare('SELECT data FROM sheet_rows WHERE id = ? AND sheet_id = ?').get(rowId, id);
    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Row not found'
      });
    }

    const merged = {
      ...parseJson(current.data, {}),
      ...rowData
    };
    delete merged.id;
    delete merged.sheet_id;
    delete merged.row_number;
    delete merged.created_at;
    delete merged.updated_at;
    delete merged.submitted_by;

    db.prepare(
      'UPDATE sheet_rows SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND sheet_id = ?'
    ).run(JSON.stringify(merged), rowId, id);

    return res.status(200).json({
      success: true,
      message: 'Row updated successfully',
      data: {
        id: Number(rowId),
        ...merged
      }
    });
  } catch (error) {
    console.error('Update row error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.put('/:id/form-config', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { form_fields, form_enabled = true } = req.body;
    const db = getDatabase();

    const sheet = db.prepare('SELECT * FROM sheets WHERE id = ?').get(id);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    const team = db.prepare('SELECT owner_id FROM teams WHERE id = ?').get(sheet.team_id);
    if (!team || team.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner can configure forms'
      });
    }

    db.prepare(`
      UPDATE sheets
      SET form_fields = ?, form_enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(form_fields || []), form_enabled ? 1 : 0, id);

    return res.status(200).json({
      success: true,
      message: 'Form configuration saved',
      data: {
        form_fields: form_fields || [],
        form_enabled: Boolean(form_enabled)
      }
    });
  } catch (error) {
    console.error('Form config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/import', upload.single('file'), (req, res) => {
  try {
    const { teamId, sheetId, name } = req.body;
    const { userId } = req.user;
    const db = getDatabase();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required'
      });
    }

    let targetSheetId = sheetId;
    if (targetSheetId) {
      const sheet = db.prepare('SELECT team_id FROM sheets WHERE id = ?').get(targetSheetId);
      if (!sheet) {
        return res.status(404).json({
          success: false,
          message: 'Sheet not found'
        });
      }
      if (!hasTeamAccess(userId, sheet.team_id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else {
      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'teamId is required'
        });
      }
      if (!hasTeamAccess(userId, teamId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      const sheetName = name || req.file.originalname.replace(/\.[^.]+$/, '');
      const result = db.prepare(
        'INSERT INTO sheets (team_id, name, description, columns_config) VALUES (?, ?, ?, ?)'
      ).run(teamId, sheetName, 'Imported from Excel', '[]');
      targetSheetId = result.lastInsertRowid;
    }

    const imported = importExcelToSheet(db, req.file.path, targetSheetId);
    const columns = imported.headers.map((header) => ({
      key: header,
      label: header,
      type: 'text',
      required: false
    }));

    db.prepare('UPDATE sheets SET columns_config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(columns), targetSheetId);

    return res.status(201).json({
      success: true,
      message: 'Excel file imported successfully',
      data: {
        ...imported,
        sheetId: targetSheetId,
        columns_config: columns
      }
    });
  } catch (error) {
    console.error('Sheet import error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Import failed'
    });
  }
});

router.get('/:id/export', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const db = getDatabase();

    const sheet = db.prepare('SELECT name, team_id FROM sheets WHERE id = ?').get(id);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    if (!hasTeamAccess(userId, sheet.team_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = exportSheetToExcel(db, id, sheet.name);
    return res.download(result.filePath, result.filename);
  } catch (error) {
    console.error('Sheet export error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Export failed'
    });
  }
});

/**
 * DELETE /api/sheets/:id/rows/:rowId
 * Delete a specific row
 */
router.delete('/:id/rows/:rowId', (req, res) => {
  try {
    const { id, rowId } = req.params;
    const { userId } = req.user;
    const db = getDatabase();

    // Get sheet
    const sheet = db.prepare('SELECT team_id FROM sheets WHERE id = ?').get(id);
    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    // Check access
    if (!hasTeamAccess(userId, sheet.team_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete row
    const deleteStmt = db.prepare('DELETE FROM sheet_rows WHERE id = ? AND sheet_id = ?');
    deleteStmt.run(rowId, id);

    return res.status(200).json({
      success: true,
      message: 'Row deleted successfully'
    });
  } catch (error) {
    console.error('Delete row error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
