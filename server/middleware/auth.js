const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_USERS = {
  'demo-jwt-token-traveler-2026': {
    _id: '65e000000000000000000001',
    id: '65e000000000000000000001',
    name: 'Sarah Jenkins',
    email: 'traveler@safepassage.org',
    role: 'traveler',
    accountStatus: 'active',
  },
  'demo-jwt-token-provider-2026': {
    _id: '65e000000000000000000002',
    id: '65e000000000000000000002',
    name: 'Apex Rapid Response Ltd',
    email: 'provider@safepassage.org',
    role: 'provider',
    accountStatus: 'active',
  },
  'demo-jwt-token-admin-2026': {
    _id: '65e000000000000000000003',
    id: '65e000000000000000000003',
    name: 'Himla (Admin Lead)',
    email: 'admin@safepassage.org',
    role: 'admin',
    accountStatus: 'active',
  },
};

/**
 * Protect middleware: Ensures the request carries a valid JWT Bearer token.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
      error: 'UNAUTHORIZED',
    });
  }

  // Check demo tokens for immediate testing convenience
  if (DEMO_USERS[token]) {
    const demo = DEMO_USERS[token];
    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findById(demo.id).select('-passwordHash');
        if (user) {
          req.user = user;
          return next();
        }
      } catch {
        // Fall back to demo user object
      }
    }
    req.user = demo;
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'safe_passage_dev_secret_university_project_2026'
    );

    // If database is connected, fetch fresh user record; otherwise use decoded token payload
    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findById(decoded.id).select('-passwordHash');
        if (user) {
          req.user = user;
          return next();
        }
      } catch {
        // Fallback to decoded payload in case DB is offline/in-memory
      }
    }

    req.user = {
      _id: decoded.id,
      id: decoded.id,
      name: decoded.name || 'User',
      email: decoded.email || 'user@safepassage.org',
      role: decoded.role || 'traveler',
      accountStatus: decoded.accountStatus || 'active',
      providerDetails: decoded.providerDetails || null,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: error.message,
    });
  }
};

/**
 * Authorize middleware: Restricts access to specified roles.
 * @param  {...string} roles Allowed roles ('traveler', 'provider', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user?.role || 'Guest'}' is not authorized to access this resource.`,
        error: 'FORBIDDEN_ROLE',
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
