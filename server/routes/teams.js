const express = require('express');
const { getDatabase } = require('../db/init');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all team routes
router.use(verifyToken);

/**
 * GET /api/teams
 * Get all teams for the authenticated user
 */
router.get('/', (req, res) => {
  try {
    const { userId } = req.user;
    const db = getDatabase();

    // Get teams owned by user or user is member of
    const teams = db.prepare(`
      SELECT DISTINCT t.* FROM teams t
      WHERE t.owner_id = ? 
      OR t.id IN (
        SELECT team_id FROM team_members WHERE user_id = ?
      )
      ORDER BY t.created_at DESC
    `).all(userId, userId);

    return res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/teams/:id
 * Get a specific team by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const db = getDatabase();

    // Get team
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user has access
    const isMember = db.prepare(`
      SELECT id FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(id, userId);

    if (team.owner_id !== userId && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get team members
    const members = db.prepare(`
      SELECT u.id, u.email, u.name, tm.role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
    `).all(id);

    return res.status(200).json({
      success: true,
      data: {
        ...team,
        members
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/teams
 * Create a new team
 * Body: { name, description }
 */
router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;
    const { userId } = req.user;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    const db = getDatabase();

    // Insert team
    const insertStmt = db.prepare(
      'INSERT INTO teams (name, description, owner_id) VALUES (?, ?, ?)'
    );
    const result = insertStmt.run(name, description || null, userId);

    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: {
        id: result.lastInsertRowid,
        name,
        description,
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/teams/:id
 * Update a team (owner only)
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
        message: 'Team name is required'
      });
    }

    const db = getDatabase();

    // Check if user is owner
    const team = db.prepare('SELECT owner_id FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (team.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team owner can update'
      });
    }

    // Update team
    const updateStmt = db.prepare(
      'UPDATE teams SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    updateStmt.run(name, description || null, id);

    return res.status(200).json({
      success: true,
      message: 'Team updated successfully'
    });
  } catch (error) {
    console.error('Update team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /api/teams/:id
 * Delete a team (owner only)
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const db = getDatabase();

    // Check if user is owner
    const team = db.prepare('SELECT owner_id FROM teams WHERE id = ?').get(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (team.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team owner can delete'
      });
    }

    // Delete team (cascade deletes members and sheets)
    const deleteStmt = db.prepare('DELETE FROM teams WHERE id = ?');
    deleteStmt.run(id);

    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
