const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token from request headers
 * Expects token in Authorization header: "Bearer <token>"
 */
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format'
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
}

/**
 * Generate JWT token for a user
 */
function generateToken(userId, email) {
  const token = jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return token;
}

module.exports = {
  verifyToken,
  generateToken,
  JWT_SECRET
};
