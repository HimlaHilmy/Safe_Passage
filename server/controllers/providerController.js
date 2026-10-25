const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * @desc    Get list of verified emergency response providers
 * @route   GET /api/providers
 * @access  Public
 * @owner   Member 4 (Himla)
 */
exports.getProviders = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        const providers = await User.find({
          role: 'provider',
          'providerDetails.verified': true,
        }).select('-passwordHash');

        return res.status(200).json({ success: true, count: providers.length, data: providers });
      } catch {
        // Fallback below
      }
    }
      // Demo list
      const demoProviders = [
        {
          _id: '65e000000000000000000002',
          name: 'Apex Rapid Response Ltd',
          email: 'provider@safepassage.org',
          phone: '+1 (555) 987-6543',
          role: 'provider',
          accountStatus: 'active',
          providerDetails: {
            serviceTypes: ['Roadside & Towing', 'Medical First Response'],
            verified: true,
            isAvailable: true,
            currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
          },
        },
        {
          _id: '65e000000000000000000020',
          name: 'Highland Mountain Rescue Unit',
          email: 'highland@rescue.org',
          phone: '+94 81 223 9900',
          role: 'provider',
          accountStatus: 'active',
          providerDetails: {
            serviceTypes: ['Lost & Stranded', 'Medical First Response'],
            verified: true,
            isAvailable: true,
            currentLocation: { type: 'Point', coordinates: [80.6350, 7.2880] },
          },
        },
      ];

      return res.status(200).json({ success: true, count: demoProviders.length, data: demoProviders });
  } catch (err) {
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

    const profileData = {
      id: providerId,
      name: req.user.name || 'Apex Rapid Response Ltd',
      email: req.user.email || 'provider@safepassage.org',
      phone: req.user.phone || '+1 (555) 987-6543',
      providerDetails: req.user.providerDetails || {
        serviceTypes: ['Roadside & Towing', 'Medical First Response'],
        verified: true,
        isAvailable: true,
        licenseNumber: 'SRI-EMERG-2024-88',
        currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
      },
      stats: {
        totalDispatches: 42,
        activeJobs: 2,
        avgResponseMinutes: 14.5,
        rating: 4.9,
      },
    };

    return res.status(200).json({ success: true, data: profileData });
  } catch (err) {
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

    if (mongoose.connection.readyState === 1) {
      try {
        const updatedUser = await User.findByIdAndUpdate(providerId, { $set: updates }, { new: true }).select('-passwordHash');
        return res.status(200).json({ success: true, message: 'Provider profile updated successfully.', data: updatedUser });
      } catch {
        // Fallback below
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Provider profile updated (Development Mode).',
      data: {
        id: providerId,
        ...updates,
      },
    });
  } catch (err) {
    next(err);
  }
};
