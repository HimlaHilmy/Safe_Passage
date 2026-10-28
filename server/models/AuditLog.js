const mongoose = require('mongoose');

/**
 * System Audit Log Model
 * Primary Owner: Member 5 (R.P.J.H. Hirunika)
 * Captures chronological records of all administrative operations,
 * user status alterations, provider approvals, and data exports.
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action identifier is required'],
      enum: [
        'INCIDENT_STATUS_UPDATE',
        'INCIDENT_ASSIGNMENT',
        'USER_STATUS_CHANGE',
        'USER_ROLE_CHANGE',
        'PROVIDER_VERIFIED',
        'PROVIDER_REJECTED',
        'PROVIDER_STATUS_CHANGE',
        'SERVICE_CREATED',
        'SERVICE_UPDATED',
        'SERVICE_DELETED',
        'SERVICE_VERIFIED',
        'REPORT_EXPORTED',
        'ADMIN_LOGIN',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    performedByName: {
      type: String,
      default: 'Authorized Administrator',
    },
    performedByRole: {
      type: String,
      default: 'admin',
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Incident', 'User', 'Provider', 'EmergencyService', 'Report', 'System'],
    },
    targetId: {
      type: String,
      default: null,
    },
    targetTitle: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetType: 1 });
auditLogSchema.index({ performedBy: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

