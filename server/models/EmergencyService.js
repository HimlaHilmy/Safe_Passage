const mongoose = require('mongoose');

/**
 * Emergency Service Directory Model
 * Primary Owner: Member 2 (J.D.R. Samindika)
 * Used for geospatial radius discovery and map display.
 */
const emergencyServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    type: {
      type: String,
      required: [true, 'Service type is required'],
      enum: [
        'Hospital & Medical',
        'Police Station',
        'Fire & Rescue',
        'Roadside & Towing',
        'Embassy & Consulate',
        'Coast Guard & Marine',
      ],
    },
    address: {
      type: String,
      required: [true, 'Physical address is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates [longitude, latitude] are required'],
      },
    },
    contactInfo: {
      phone: { type: String, required: true },
      emergencyHotline: { type: String, default: '' },
      email: { type: String, default: '' },
      website: { type: String, default: '' },
      operatingHours: { type: String, default: '24/7' },
    },
    servicesOffered: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'unverified'],
      default: 'verified',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.8,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for $nearSphere queries
emergencyServiceSchema.index({ location: '2dsphere' });
emergencyServiceSchema.index({ type: 1 });
emergencyServiceSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('EmergencyService', emergencyServiceSchema);
