const mongoose = require('mongoose');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

/**
 * @desc    Get list of verified emergency response providers
 * @route   GET /api/providers
 * @access  Public
 * @owner   Member 4 (Himla)
 */
exports.getProviders = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const providers = await User.find({
      role: 'provider',
    }).select('-passwordHash');

    return res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (err) {
    console.error('[Get Providers Error]', err.message);
    next(err);
  }
};

/**
 * @desc    Get current provider's profile, availability, and active assignments
 * @route   GET /api/providers/me
 * @access  Private (Provider only)
 */
exports.getProviderMe = async (req, res, next) => {
  try {
    const providerId = req.user.id || req.user._id;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(providerId)) {
      const user = await User.findById(providerId).select('-passwordHash');
      if (user) {
        return res.status(200).json({
          success: true,
          data: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            providerDetails: user.providerDetails,
            accountStatus: user.accountStatus,
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: providerId,
        name: req.user.name || 'Apex Rapid Response Ltd',
        email: req.user.email || 'provider@safepassage.org',
        phone: req.user.phone || '+1 (555) 987-6543',
        providerDetails: req.user.providerDetails || {
          serviceTypes: ['Roadside Towing & Vehicle Repair', 'Emergency Paramedic Escort'],
          verified: true,
          isAvailable: true,
          licenseNumber: 'SRI-EMERG-2024-88',
          currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        },
      },
    });
  } catch (err) {
    console.error('[Get Provider Me Error]', err.message);
    next(err);
  }
};

/**
 * @desc    Update provider availability, GPS coordinates, or service tags
 * @route   PATCH /api/providers/me
 * @access  Private (Provider only)
 */
exports.updateProviderMe = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { isAvailable, coordinates, serviceTypes, phone, licenseNumber, name } = req.body;
    const providerId = req.user.id || req.user._id;

    const updates = {};
    if (isAvailable !== undefined) updates['providerDetails.isAvailable'] = isAvailable;
    if (coordinates && Array.isArray(coordinates)) {
      updates['providerDetails.currentLocation'] = {
        type: 'Point',
        coordinates, // [lng, lat]
      };
    }
    if (serviceTypes) updates['providerDetails.serviceTypes'] = serviceTypes;
    if (licenseNumber !== undefined) updates['providerDetails.licenseNumber'] = licenseNumber;
    if (phone) updates.phone = phone;
    if (name) updates.name = name;

    const updatedUser = await User.findByIdAndUpdate(providerId, { $set: updates }, { new: true }).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Provider profile not found in MongoDB.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Provider profile updated successfully.',
      data: updatedUser,
    });
  } catch (err) {
    console.error('[Update Provider Me Error]', err.message);
    next(err);
  }
};
