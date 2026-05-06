const express = require('express');
const { getDatabase } = require('../db/init');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function hasTeamAccess(db, userId, teamId) {
  const team = db.prepare('SELECT owner_id FROM teams WHERE id = ?').get(teamId);
  if (!team) return false;
  if (team.owner_id === userId) return true;
  return Boolean(db.prepare(
    'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
  ).get(teamId, userId));
}

function countBy(rows, key) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = row[key] === undefined || row[key] === '' ? 'Unspecified' : String(row[key]);
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}

function findLikelyColumn(rows, names) {
  const keys = Object.keys(rows[0] || {});
  return keys.find((key) => names.some((name) => key.toLowerCase().includes(name)));
}

router.get('/insights/:sheetId', (req, res) => {
  try {
    const { sheetId } = req.params;
    const { userId } = req.user;
    const db = getDatabase();
    const sheet = db.prepare('SELECT * FROM sheets WHERE id = ?').get(sheetId);

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: 'Sheet not found'
      });
    }

    if (!hasTeamAccess(db, userId, sheet.team_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const dbRows = db.prepare(
      'SELECT data, created_at FROM sheet_rows WHERE sheet_id = ? ORDER BY row_number ASC'
    ).all(sheetId);
    const rows = dbRows.map((row) => parseJson(row.data, {}));
    const statusKey = findLikelyColumn(rows, ['status', 'stage']);
    const memberKey = findLikelyColumn(rows, ['owner', 'member', 'name', 'assignee']);
    const numericKey = Object.keys(rows[0] || {}).find((key) => rows.some((row) => Number.isFinite(Number(row[key]))));

    const charts = [];
    if (statusKey) {
      charts.push({
        type: 'pie',
        title: `${statusKey} Distribution`,
        data: countBy(rows, statusKey)
      });
    }
    if (memberKey) {
      charts.push({
        type: 'bar',
        title: `Rows by ${memberKey}`,
        data: countBy(rows, memberKey)
      });
    }
    if (numericKey) {
      charts.push({
        type: 'line',
        title: `${numericKey} Trend`,
        data: rows.map((row, index) => ({
          name: `Row ${index + 1}`,
          value: Number(row[numericKey]) || 0
        }))
      });
    }

    const completed = statusKey
      ? rows.filter((row) => String(row[statusKey]).toLowerCase().includes('complete')).length
      : 0;
    const summary = rows.length
      ? `${sheet.name} has ${rows.length} rows. ${statusKey ? `${completed} entries are marked complete. ` : ''}${memberKey ? `The busiest ${memberKey} group is visible in the member chart.` : 'Upload richer data to unlock member-level insights.'}`
      : `${sheet.name} has no rows yet.`;
    const alerts = [];
    if (!rows.length) alerts.push('No data has been submitted for this sheet.');
    if (statusKey && completed === 0) alerts.push(`No ${statusKey} values are marked complete.`);
    if (!numericKey) alerts.push('No numeric column was found for trend analysis.');

    return res.status(200).json({
      success: true,
      data: {
        summary,
        charts,
        alerts
      }
    });
  } catch (error) {
    console.error('Dashboard insights error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const { userId } = req.user;
    const db = getDatabase();
    const teams = db.prepare(`
      SELECT DISTINCT t.id
      FROM teams t
      WHERE t.owner_id = ?
      OR t.id IN (SELECT team_id FROM team_members WHERE user_id = ?)
    `).all(userId, userId);
    const teamIds = teams.map((team) => team.id);

    if (!teamIds.length) {
      return res.status(200).json({
        success: true,
        data: {
          total_rows: 0,
          active_members: 0,
          completion_rate: 0,
          avg_response_time: 0
        }
      });
    }

    const placeholders = teamIds.map(() => '?').join(',');
    const totalRows = db.prepare(`
      SELECT COUNT(sr.id) AS count
      FROM sheet_rows sr
      JOIN sheets s ON s.id = sr.sheet_id
      WHERE s.team_id IN (${placeholders})
    `).get(...teamIds).count;
    const activeMembers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) AS count
      FROM team_members
      WHERE team_id IN (${placeholders})
    `).get(...teamIds).count + teamIds.length;
    const allRows = db.prepare(`
      SELECT sr.data
      FROM sheet_rows sr
      JOIN sheets s ON s.id = sr.sheet_id
      WHERE s.team_id IN (${placeholders})
    `).all(...teamIds).map((row) => parseJson(row.data, {}));
    const statusKey = findLikelyColumn(allRows, ['status', 'stage']);
    const completionRate = statusKey && allRows.length
      ? Math.round((allRows.filter((row) => String(row[statusKey]).toLowerCase().includes('complete')).length / allRows.length) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        total_rows: totalRows,
        active_members: activeMembers,
        completion_rate: completionRate,
        avg_response_time: 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
