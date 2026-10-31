const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ai-search-ads-secret-key-change-in-production';
const JWT_EXPIRES_IN = '30d';
const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password
 * @param {string} plain
 * @returns {Promise<string>} bcrypt hash
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Generate a JWT token for a user
 * @param {string} userId
 * @returns {string} JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {object|null} decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Authentication middleware — requires a valid token.
 * Reads token from cookie 'auth_token' or Authorization header (Bearer <token>).
 * Sets req.user = { userId } on success.
 */
function authMiddleware(req, res, next) {
  const token = _extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = { userId: decoded.userId };
  next();
}

/**
 * Optional authentication middleware — does not reject if no token present.
 * Sets req.user = { userId } if valid token found, otherwise req.user = null.
 */
function optionalAuth(req, res, next) {
  const token = _extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    req.user = null;
    return next();
  }

  req.user = { userId: decoded.userId };
  next();
}

/**
 * Extract token from cookie or Authorization header
 * @param {object} req
 * @returns {string|null}
 */
function _extractToken(req) {
  // Try cookie first
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  // Try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuth,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
