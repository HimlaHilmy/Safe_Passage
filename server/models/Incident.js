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
 * Helper: Generate unique server incident reference
 * Format: INC-YYYYMMDD-XXXX (e.g. INC-20261028-4821)
 */
function generateIncidentReference() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INC-${dateStr}-${randomSuffix}`;
}

/**
 * Incident Model
 * Primary Owner: Member 1 (K.H.S. Dulanjani)
 * Co-owner for Status Transitions: Member 3 (J.K.S. Jayasundara)
 */
const incidentSchema = new mongoose.Schema(
  {
    incidentReference: {
      type: String,
      trim: true,
      index: true,
    },
    travelerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Traveler ID is required'],
    },
    incidentReference: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Emergency category is required'],
      enum: [
        'Medical Emergency',
        'Lost Passport or Documents',
        'Theft or Security Incident',
        'Vehicle Breakdown',
        'Other Emergency',
        'Roadside & Vehicle Breakdown',
        'Crime & Theft',
        'Natural Hazard & Weather',
        'Fire Emergency',
        'Lost & Stranded',
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
    incidentDate: {
      type: Date,
      default: Date.now,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual reference identifier
incidentSchema.virtual('reference').get(function () {
  if (this.incidentReference) return this.incidentReference;
  const idStr = this._id ? this._id.toString() : '';
  const suffix = idStr.length >= 6 ? idStr.slice(-6).toUpperCase() : 'NEW';
  return `SP-REF-${suffix}`;
});

// Auto-generate reference code before saving if not present
incidentSchema.pre('save', function (next) {
  if (!this.incidentReference) {
    const idStr = this._id ? this._id.toString() : '';
    const suffix = idStr.length >= 6 ? idStr.slice(-6).toUpperCase() : Math.floor(1000 + Math.random() * 9000);
    this.incidentReference = `SP-REF-${suffix}`;
  }
  next();
});

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
  generateIncidentReference,
};
