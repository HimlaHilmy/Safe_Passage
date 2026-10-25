const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// Seed/Demo accounts for immediate login during development/presentation
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
      serviceTypes: ['Roadside & Towing', 'Medical First Response'],
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

    // Check if user exists in MongoDB
    try {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash: password, // will be hashed by pre-save hook
        role: role || 'traveler',
        phone: phone || '',
      });

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
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
    } catch {
      // In-memory mock response if DB offline
      const mockUser = {
        _id: '65e' + Math.random().toString(16).substring(2, 23),
        name,
        email: email.toLowerCase(),
        role: role || 'traveler',
        phone: phone || '',
      };
      const token = generateToken(mockUser);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully (Development Fallback Mode).',
        data: { user: mockUser, token },
      });
    }
  } catch (err) {
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

    // 1. Check DB first
    try {
      const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');
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
    } catch {
      // Continue to demo users check if DB offline
    }

    // 2. Demo User Fallback (For instant testing without prior manual registration)
    if (DEMO_USERS[cleanEmail]) {
      const demoUser = DEMO_USERS[cleanEmail];
      const token = generateToken(demoUser);
      return res.status(200).json({
        success: true,
        message: 'Authenticated successfully with demo credentials.',
        data: {
          user: {
            id: demoUser._id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            phone: demoUser.phone,
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
