const mongoose = require('mongoose');

/**
 * Case Log / Audit History Model
 * Primary Owner: Member 3 (J.K.S. Jayasundara)
 * Captures chronological audit logs for every state transition and operator note.
 */
const caseLogSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: [true, 'Incident ID is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID making the update is required'],
    },
    updaterRole: {
      type: String,
      enum: ['traveler', 'provider', 'admin', 'system'],
      default: 'system',
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

caseLogSchema.index({ incidentId: 1, timestamp: -1 });

module.exports = mongoose.model('CaseLog', caseLogSchema);
