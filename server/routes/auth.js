const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../db/init');
const { generateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, password, name }
 */
router.post('/register', (req, res) => {
  try {
    const { email, password, name, role = 'member' } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const db = getDatabase();

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user
    const safeRole = role === 'head' ? 'head' : 'member';
    const insertStmt = db.prepare(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
    );
    const result = insertStmt.run(email, hashedPassword, name, safeRole);

    // Generate token
    const token = generateToken(result.lastInsertRowid, email);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.lastInsertRowid,
          userId: result.lastInsertRowid,
          email,
          name,
          role: safeRole,
          team_id: null
        },
        userId: result.lastInsertRowid,
        email,
        name,
        role: safeRole,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 * Body: { email, password }
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const db = getDatabase();

    // Find user by email
    const user = db.prepare('SELECT id, email, password, name, role FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email);
    const team = db.prepare(`
      SELECT id FROM teams WHERE owner_id = ?
      UNION
      SELECT team_id AS id FROM team_members WHERE user_id = ?
      ORDER BY id
      LIMIT 1
    `).get(user.id, user.id);
    const ownsTeam = db.prepare('SELECT id FROM teams WHERE owner_id = ? LIMIT 1').get(user.id);
    const role = ownsTeam ? 'head' : (user.role || 'member');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          userId: user.id,
          email: user.email,
          name: user.name,
          role,
          team_id: team?.id || null
        },
        userId: user.id,
        email: user.email,
        name: user.name,
        role,
        team_id: team?.id || null,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.get('/me', verifyToken, (req, res) => {
  try {
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const team = db.prepare(`
      SELECT id FROM teams WHERE owner_id = ?
      UNION
      SELECT team_id AS id FROM team_members WHERE user_id = ?
      ORDER BY id
      LIMIT 1
    `).get(user.id, user.id);
    const ownsTeam = db.prepare('SELECT id FROM teams WHERE owner_id = ? LIMIT 1').get(user.id);
    const role = ownsTeam ? 'head' : (user.role || 'member');

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        role,
        team_id: team?.id || null
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
