const { INCIDENT_STATUS, VALID_STATUS_TRANSITIONS } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');

/**
 * Emergency Case Lifecycle Service
 * Primary Owner: Member 3 (J.K.S. Jayasundara)
 * 
 * Central business logic governing:
 * 1. Finite State Machine enforcement
 * 2. Role-based transition authorization
 * 3. Immutable CaseLog audit creation
 * 4. Real-time Socket.io state broadcasts
 */

// Permitted transition triggers by role
const ROLE_TRANSITION_PERMISSIONS = {
  [INCIDENT_STATUS.SUBMITTED]: {
    [INCIDENT_STATUS.UNDER_REVIEW]: ['admin'],
    [INCIDENT_STATUS.CANCELLED]: ['traveler', 'admin', 'system'],
  },
  [INCIDENT_STATUS.UNDER_REVIEW]: {
    [INCIDENT_STATUS.ASSIGNED]: ['admin', 'system'],
    [INCIDENT_STATUS.CANCELLED]: ['traveler', 'admin', 'system'],
  },
  [INCIDENT_STATUS.ASSIGNED]: {
    [INCIDENT_STATUS.ASSISTANCE_DISPATCHED]: ['provider', 'admin', 'system'],
    [INCIDENT_STATUS.CANCELLED]: ['traveler', 'admin', 'system'],
  },
  [INCIDENT_STATUS.ASSISTANCE_DISPATCHED]: {
    [INCIDENT_STATUS.IN_PROGRESS]: ['provider', 'admin'],
    [INCIDENT_STATUS.CANCELLED]: ['traveler', 'admin'],
  },
  [INCIDENT_STATUS.IN_PROGRESS]: {
    [INCIDENT_STATUS.RESOLVED]: ['provider', 'admin'],
    [INCIDENT_STATUS.CANCELLED]: ['admin'],
  },
  [INCIDENT_STATUS.RESOLVED]: {},
  [INCIDENT_STATUS.CANCELLED]: {},
};

/**
 * Generate human-readable incident reference
 * Format: SP-26-XXXX (e.g., SP-26-4819)
 */
const formatIncidentReference = (idStr) => {
  if (!idStr) return `SP-REF-${Math.floor(1000 + Math.random() * 9000)}`;
  const clean = idStr.toString().replace(/[^a-fA-F0-9]/g, '');
  const suffix = clean.length >= 6 ? clean.slice(-6).toUpperCase() : clean.toUpperCase();
  return `SP-REF-${suffix}`;
};

/**
 * Validate whether a status transition is permitted
 * @param {string} currentStatus - Current incident status
 * @param {string} targetStatus - Desired new status
 * @param {string} userRole - 'traveler' | 'provider' | 'admin' | 'system'
 * @returns {{ valid: boolean, reason?: string, errorCode?: string }}
 */
const validateTransition = (currentStatus, targetStatus, userRole = 'system') => {
  if (!targetStatus || !Object.values(INCIDENT_STATUS).includes(targetStatus)) {
    return {
      valid: false,
      reason: `Target status '${targetStatus}' is invalid. Permitted statuses: ${Object.values(INCIDENT_STATUS).join(', ')}`,
      errorCode: 'INVALID_STATUS',
    };
  }

  // Same status check
  if (currentStatus === targetStatus) {
    return {
      valid: false,
      reason: `Incident is already in '${currentStatus}' status.`,
      errorCode: 'SAME_STATUS',
    };
  }

  // Terminal state checks
  if (currentStatus === INCIDENT_STATUS.RESOLVED) {
    return {
      valid: false,
      reason: 'Incident is in a terminal state (Resolved) and cannot be transitioned further.',
      errorCode: 'TERMINAL_STATE',
    };
  }

  if (currentStatus === INCIDENT_STATUS.CANCELLED) {
    return {
      valid: false,
      reason: 'Incident is in a terminal state (Cancelled) and cannot be reactivated.',
      errorCode: 'TERMINAL_STATE',
    };
  }

  // Allowed next states in the Finite State Machine
  const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      valid: false,
      reason: `Illegal transition: Cannot transition directly from '${currentStatus}' to '${targetStatus}'. Permitted next states: ${allowedNext.join(', ') || 'None (Terminal)'}`,
      errorCode: 'ILLEGAL_STATUS_TRANSITION',
    };
  }

  // Role authorization checks (Admins have full operational override authority)
  if (userRole !== 'admin') {
    const rolePermissions = ROLE_TRANSITION_PERMISSIONS[currentStatus]?.[targetStatus] || [];
    if (!rolePermissions.includes(userRole)) {
      return {
        valid: false,
        reason: `Role '${userRole}' is not authorized to transition incident from '${currentStatus}' to '${targetStatus}'. Required role: ${rolePermissions.join(' or ')}`,
        errorCode: 'UNAUTHORIZED_TRANSITION',
      };
    }
  }

  return { valid: true };
};

/**
 * Broadcast real-time Socket.io events
 */
const broadcastTransition = (io, incidentId, payload) => {
  if (!io) return;

  try {
    // Broadcast to room tracking this specific incident
    io.to(`incident_${incidentId}`).emit('incident_updated', payload);
    io.to(`incident_${incidentId}`).emit('case_log_added', payload);

    // Broadcast alerts to role channels
    io.to('role_admin').emit('incident_updated', payload);
    io.to('role_provider').emit('incident_updated', payload);
    io.to('role_traveler').emit('incident_updated', payload);

    console.log(`[Socket.io Broadcast] Incident ${incidentId} transitioned to '${payload.newStatus}'`);
  } catch (err) {
    console.warn(`[Socket.io Warning] Broadcast failed: ${err.message}`);
  }
};

module.exports = {
  INCIDENT_STATUS,
  VALID_STATUS_TRANSITIONS,
  ROLE_TRANSITION_PERMISSIONS,
  formatIncidentReference,
  validateTransition,
  broadcastTransition,
};
