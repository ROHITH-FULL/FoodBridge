
const jwt = require('jsonwebtoken');
const { get } = require('../database/db.postgres');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing from environment variables.');
}

const JWT_SECRET = process.env.JWT_SECRET;

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await get(
      'SELECT id, full_name, email, mobile, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    req.user = user;

    if (user.role === 'NGO') {
      const org = await get(
        'SELECT * FROM organizations WHERE user_id = $1',
        [user.id]
      );

      req.organization = org || null;
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await get(
      'SELECT id, full_name, email, mobile, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (user) {
      req.user = user;

      if (user.role === 'NGO') {
        const org = await get(
          'SELECT * FROM organizations WHERE user_id = $1',
          [user.id]
        );

        req.organization = org || null;
      }
    }
  } catch (err) {
    // Ignore invalid optional tokens.
  }

  next();
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in.'
      });
    }

    const roles = Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Action restricted to ${roles.join(', ')} role.`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  JWT_SECRET
};
