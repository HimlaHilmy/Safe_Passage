const mongoose = require('mongoose');

/**
 * Assistance Request Model
 * Primary Owner: Member 4 & Group Leader (M.H.F. Himla)
 * Handles provider dispatch, job lifecycle, and active assignments.
 */
const assistanceRequestSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: [true, 'Incident reference is required'],
    },
    travelerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Traveler ID is required'],
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'En Route', 'On Scene', 'Completed', 'Declined', 'Cancelled'],
      default: 'Pending',
    },
    dispatchNotes: {
      type: String,
      default: '',
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

assistanceRequestSchema.index({ incidentId: 1 });
assistanceRequestSchema.index({ providerId: 1, status: 1 });
assistanceRequestSchema.index({ travelerId: 1 });
assistanceRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('AssistanceRequest', assistanceRequestSchema);
