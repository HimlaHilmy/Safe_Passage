const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

// Helper to generate signed JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'safe_passage_dev_secret_university_project_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// Demo accounts for rapid evaluation and testing
const DEMO_USERS = {
  'traveler@safepassage.org': {
    _id: '65e000000000000000000001',
    name: 'Sarah Jenkins',
    email: 'traveler@safepassage.org',
    role: 'traveler',
    phone: '+1 (555) 234-5678',
    accountStatus: 'active',
  },
  'provider@safepassage.org': {
    _id: '65e000000000000000000002',
    name: 'Apex Rapid Response Ltd',
    email: 'provider@safepassage.org',
    role: 'provider',
    phone: '+1 (555) 987-6543',
    accountStatus: 'active',
    providerDetails: {
      serviceTypes: ['Roadside Towing & Vehicle Repair', 'Emergency Paramedic Escort'],
      licenseNumber: 'SRI-EMERG-2024-88',
      verified: true,
      currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
      isAvailable: true,
    },
  },
  'admin@safepassage.org': {
    _id: '65e000000000000000000003',
    name: 'Himla (Admin Lead)',
    email: 'admin@safepassage.org',
    role: 'admin',
    phone: '+1 (555) 000-1122',
    accountStatus: 'active',
  },
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email address, and password.',
      });
    }

    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Please verify MongoDB connection.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists in MongoDB.',
      });
    }

    console.log(`[Auth] Creating new user ${cleanEmail} in MongoDB...`);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password, // will be hashed by User pre-save hook
      role: role || 'traveler',
      phone: phone ? phone.trim() : '',
    });

    const token = generateToken(user);
    console.log(`[Auth] User registered successfully with ID: ${user._id}`);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully in MongoDB.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        token,
      },
    });
  } catch (err) {
    console.error('[Auth Register Error]', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + err.message,
      });
    }
    next(err);
  }
};

/**
 * @desc    Login user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently offline. Cannot authenticate.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    // 1. Check MongoDB for existing account
    let user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    if (user) {
      const isMatch = await user.matchPassword(password);
      if (isMatch) {
        const token = generateToken(user);
        return res.status(200).json({
          success: true,
          message: 'Logged in successfully.',
          data: {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone,
            },
            token,
          },
        });
      }
    }

    // 2. Demo User Fallback: If user is one of the standard demo accounts, ensure seeded in MongoDB
    if (DEMO_USERS[cleanEmail]) {
      const demoData = DEMO_USERS[cleanEmail];
      if (!user) {
        console.log(`[Auth] Auto-provisioning demo account ${cleanEmail} into MongoDB...`);
        user = await User.create({
          _id: new mongoose.Types.ObjectId(demoData._id),
          name: demoData.name,
          email: demoData.email,
          passwordHash: password, // Seed with entered password
          role: demoData.role,
          phone: demoData.phone,
          accountStatus: demoData.accountStatus,
          providerDetails: demoData.providerDetails || undefined,
        });
      }

      const token = generateToken(user || demoData);
      return res.status(200).json({
        success: true,
        message: 'Authenticated successfully with demo credentials.',
        data: {
          user: {
            id: user ? user._id : demoData._id,
            name: user ? user.name : demoData.name,
            email: user ? user.email : demoData.email,
            role: user ? user.role : demoData.role,
            phone: user ? user.phone : demoData.phone,
          },
          token,
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please verify your email and password.',
    });
  } catch (err) {
    console.error('[Auth Login Error]', err.message);
    next(err);
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Logout user / invalidate session
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully.',
  });
};
