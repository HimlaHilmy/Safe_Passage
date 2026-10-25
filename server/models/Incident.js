const mongoose = require('mongoose');

/**
 * Incident Status Machine Constants
 * Centralized status dictionary to ensure consistency across all 5 modules.
 */
const INCIDENT_STATUS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ASSIGNED: 'Assigned',
  ASSISTANCE_DISPATCHED: 'Assistance Dispatched',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
};

const VALID_STATUS_TRANSITIONS = {
  [INCIDENT_STATUS.SUBMITTED]: [INCIDENT_STATUS.UNDER_REVIEW, INCIDENT_STATUS.CANCELLED],
  [INCIDENT_STATUS.UNDER_REVIEW]: [INCIDENT_STATUS.ASSIGNED, INCIDENT_STATUS.CANCELLED],
  [INCIDENT_STATUS.ASSIGNED]: [INCIDENT_STATUS.ASSISTANCE_DISPATCHED, INCIDENT_STATUS.CANCELLED],
  [INCIDENT_STATUS.ASSISTANCE_DISPATCHED]: [INCIDENT_STATUS.IN_PROGRESS, INCIDENT_STATUS.CANCELLED],
  [INCIDENT_STATUS.IN_PROGRESS]: [INCIDENT_STATUS.RESOLVED, INCIDENT_STATUS.CANCELLED],
  [INCIDENT_STATUS.RESOLVED]: [], // Terminal state
  [INCIDENT_STATUS.CANCELLED]: [], // Terminal state
};

/**
 * Incident Model
 * Primary Owner: Member 1 (K.H.S. Dulanjani)
 * Co-owner for Status Transitions: Member 3 (J.K.S. Jayasundara)
 */
const incidentSchema = new mongoose.Schema(
  {
    travelerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Traveler ID is required'],
    },
    category: {
      type: String,
      required: [true, 'Emergency category is required'],
      enum: [
        'Medical Emergency',
        'Roadside & Vehicle Breakdown',
        'Crime & Theft',
        'Natural Hazard & Weather',
        'Fire Emergency',
        'Lost & Stranded',
        'Other Emergency',
      ],
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    severity: {
      type: String,
      required: [true, 'Severity level is required'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      // Note: GeoJSON order is [longitude, latitude]
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (val) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 &&
              val[1] >= -90 &&
              val[1] <= 90
            );
          },
          message: 'Invalid GeoJSON coordinates [longitude, latitude]',
        },
      },
      address: {
        type: String,
        default: '',
        trim: true,
      },
      landmark: {
        type: String,
        default: '',
        trim: true,
      },
    },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video', 'document'], default: 'image' },
        caption: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: Object.values(INCIDENT_STATUS),
      default: INCIDENT_STATUS.SUBMITTED,
      required: true,
    },
    assignedProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estimatedArrivalTimeMinutes: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
incidentSchema.index({ 'location': '2dsphere' });
incidentSchema.index({ travelerId: 1, createdAt: -1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ category: 1 });
incidentSchema.index({ severity: 1 });

module.exports = {
  Incident: mongoose.model('Incident', incidentSchema),
  INCIDENT_STATUS,
  VALID_STATUS_TRANSITIONS,
};
