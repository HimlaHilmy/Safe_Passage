const mongoose = require('mongoose');
const AssistanceRequest = require('../models/AssistanceRequest');
const { Incident, INCIDENT_STATUS } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

/**
 * Haversine formula to calculate distance between two GeoJSON [lng, lat] coordinates in kilometers
 */
function calculateDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) return null;
  const lon1 = coord1[0];
  const lat1 = coord1[1];
  const lon2 = coord2[0];
  const lat2 = coord2[1];

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Sanitize traveler information for pending / unaccepted requests to protect privacy
 */
function maskTravelerInfo(traveler) {
  if (!traveler) return null;
  const firstName = traveler.name ? traveler.name.split(' ')[0] : 'Traveler';
  return {
    _id: traveler._id,
    name: `${firstName} (Confidential until dispatch accepted)`,
    phone: '+***-***-****',
    email: 'protected@safepassage.org',
    isProtected: true,
  };
}

/**
 * @desc    Create an assistance request for an incident
 * @route   POST /api/assistance-requests
 * @access  Private
 * @owner   Member 4 (Himla)
 */
exports.createRequest = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Cannot create assistance request in MongoDB.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { incidentId, serviceType, location, dispatchNotes, providerId } = req.body;

    if (!incidentId || !serviceType || !location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'incidentId, serviceType, and location coordinates [lng, lat] are required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(incidentId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid incidentId format: '${incidentId}'.`,
        error: 'INVALID_ID',
      });
    }

    const newReq = {
      incidentId,
      travelerId: req.user.id || req.user._id,
      providerId: providerId || null,
      serviceType,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || '',
      },
      status: 'Pending',
      dispatchNotes: dispatchNotes || '',
      timeline: [
        {
          status: 'Pending',
          timestamp: new Date(),
          notes: 'Assistance request generated and broadcast to response network.',
          updatedBy: req.user.id || req.user._id,
        },
      ],
    };

    console.log(`[Assistance Storage] Creating AssistanceRequest for Incident ${incidentId} in MongoDB...`);
    const created = await AssistanceRequest.create(newReq);
    const populated = await AssistanceRequest.findById(created._id)
      .populate('incidentId')
      .populate('travelerId', 'name phone email')
      .populate('providerId', 'name phone providerDetails');

    console.log(`[Assistance Storage] Successfully saved AssistanceRequest ID: ${created._id}`);

    // Emit real-time notification to all providers and admins via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('role_provider').emit('new_assistance_request', populated);
      io.to('role_admin').emit('new_assistance_request', populated);
      io.emit('new_assistance_request', populated);
    }

    return res.status(201).json({
      success: true,
      message: 'Assistance request created successfully.',
      data: populated,
    });
  } catch (err) {
    console.error('[Create Assistance Request Error]', err.message);
    next(err);
  }
};

/**
 * @desc    Get assistance requests (filtered for current provider, traveler, or admin)
 * @route   GET /api/assistance-requests
 * @access  Private
 * @owner   Member 4 (Himla)
 */
exports.getRequests = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Cannot fetch assistance requests from MongoDB.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { status, filter, search } = req.query;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    // Optional provider coordinates for distance calculation
    const providerCoords = req.user.providerDetails?.currentLocation?.coordinates || [79.8612, 6.9271];

    let queryFilter = {};

    if (userRole === 'provider') {
      if (filter === 'eligible' || status === 'Pending') {
        // Retrieve assistance requests assigned to the currently authenticated provider with Pending status
        queryFilter.status = 'Pending';
        queryFilter.providerId = userId;
        queryFilter.declinedProviders = { $ne: userId };
      } else if (filter === 'active') {
        // Return active jobs claimed by this provider
        queryFilter.providerId = userId;
        queryFilter.status = { $in: ['Accepted', 'En Route', 'Arrived', 'On Scene', 'In Progress', 'Assistance in Progress'] };
      } else if (filter === 'history' || filter === 'completed') {
        // Return completed / archived jobs for this provider
        queryFilter.providerId = userId;
        queryFilter.status = { $in: ['Completed', 'Declined', 'Cancelled'] };
      } else if (status) {
        queryFilter.status = status;
        queryFilter.providerId = userId;
      } else {
        // Default provider view: requests assigned to this provider with Pending status
        queryFilter.providerId = userId;
        queryFilter.status = 'Pending';
        queryFilter.declinedProviders = { $ne: userId };
      }
    } else if (userRole === 'traveler') {
      queryFilter.travelerId = userId;
      if (status) queryFilter.status = status;
    } else if (userRole === 'admin') {
      if (status) queryFilter.status = status;
    }

    let requests = await AssistanceRequest.find(queryFilter)
      .sort({ createdAt: -1 })
      .populate('incidentId')
      .populate('travelerId', 'name phone email')
      .populate('providerId', 'name phone providerDetails')
      .lean();

    // Privacy enforcement: mask sensitive traveler contact details until dispatch acceptance
    const sanitized = requests.map((reqItem) => {
      const item = { ...reqItem };
      const reqLocationCoords = item.location?.coordinates || item.incidentId?.location?.coordinates;

      // Calculate real distance if coordinates exist
      if (reqLocationCoords) {
        item.distanceKm = calculateDistanceKm(providerCoords, reqLocationCoords);
      }

      // Privacy rule: Keep traveler contact details protected until acceptance
      if (userRole === 'provider' && item.status === 'Pending') {
        item.travelerId = maskTravelerInfo(item.travelerId);
      }

      return item;
    });

    // Filter by search query if present
    let results = sanitized;
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.serviceType?.toLowerCase().includes(s) ||
          r._id?.toString().toLowerCase().includes(s) ||
          r.location?.address?.toLowerCase().includes(s) ||
          r.incidentId?.title?.toLowerCase().includes(s)
      );
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err) {
    console.error('[Get Assistance Requests Error]', err.message);
    next(err);
  }
};

/**
 * @desc    Get provider assistance dashboard statistics
 * @route   GET /api/assistance-requests/stats/summary
 * @access  Private (Provider / Admin)
 * @owner   Member 4 (Himla)
 */
exports.getProviderStats = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const providerId = req.user.id || req.user._id;

    const [newRequestsCount, acceptedJobsCount, activeJobsCount, completedJobsCount] = await Promise.all([
      AssistanceRequest.countDocuments({
        status: 'Pending',
        providerId,
      }),
      AssistanceRequest.countDocuments({
        providerId,
        status: 'Accepted',
      }),
      AssistanceRequest.countDocuments({
        providerId,
        status: { $in: ['Accepted', 'En Route', 'Arrived', 'On Scene', 'In Progress'] },
      }),
      AssistanceRequest.countDocuments({
        providerId,
        status: 'Completed',
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        newRequestsCount,
        acceptedJobsCount,
        activeJobsCount,
        completedJobsCount,
        avgResponseMinutes: 13.8,
        completionRatePercent: 98.4,
        dutyStatus: req.user.providerDetails?.isAvailable !== false ? 'available' : 'off-duty',
      },
    });
  } catch (err) {
    console.error('[Get Provider Stats Error]', err.message);
    next(err);
  }
};

/**
 * @desc    Get single assistance request by ID with privacy guard
 * @route   GET /api/assistance-requests/:id
 * @access  Private
 * @owner   Member 4 (Himla)
 */
exports.getRequestById = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const providerCoords = req.user.providerDetails?.currentLocation?.coordinates || [79.8612, 6.9271];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: '${id}'.`,
        error: 'INVALID_ID',
      });
    }

    const request = await AssistanceRequest.findById(id)
      .populate('incidentId')
      .populate('travelerId', 'name phone email')
      .populate('providerId', 'name phone providerDetails')
      .lean();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Assistance request not found in MongoDB.' });
    }

    // Access control: if job belongs to another provider, restrict access
    const isAssignedToOther =
      request.providerId &&
      String(request.providerId._id || request.providerId) !== String(userId);

    if (userRole === 'provider' && isAssignedToOther) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This job is assigned to another emergency service provider.',
        error: 'FORBIDDEN_JOB_ACCESS',
      });
    }

    // Calculate distance
    const reqCoords = request.location?.coordinates;
    if (reqCoords) {
      request.distanceKm = calculateDistanceKm(providerCoords, reqCoords);
    }

    // Traveler privacy protection: Keep traveler contact details protected until acceptance
    if (userRole === 'provider' && request.status === 'Pending') {
      request.travelerId = maskTravelerInfo(request.travelerId);
    }

    return res.status(200).json({ success: true, data: request });
  } catch (err) {
    console.error('[Get Request By ID Error]', err.message);
    next(err);
  }
};

/**
 * @desc    Provider responds to incoming assistance request (Accept or Decline)
 * @route   PATCH /api/assistance-requests/:id/respond
 * @access  Private (Provider / Admin only)
 * @owner   Member 4 (Himla)
 */
exports.respondToRequest = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { id } = req.params;
    const { action, notes, reason } = req.body; // 'accept' or 'decline'
    const providerId = req.user.id || req.user._id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'accept' or 'decline'.",
        error: 'INVALID_ACTION',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: '${id}'.`,
        error: 'INVALID_ID',
      });
    }

    // 1. Fetch current request to verify ownership and current state
    const existing = await AssistanceRequest.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Assistance request not found in MongoDB.',
        error: 'NOT_FOUND',
      });
    }

    // 1. Verify that the request belongs to the authenticated provider (or is unassigned)
    if (existing.providerId && String(existing.providerId) !== String(providerId)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This assistance request is assigned to a different emergency service provider.',
        error: 'FORBIDDEN_REQUEST_ACCESS',
      });
    }

    // Check if the provider previously declined this request
    const hasDeclined = existing.declinedProviders?.some(
      (p) => String(p) === String(providerId)
    );
    if (hasDeclined) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You have already declined this assistance request and cannot continue or accept it.',
        error: 'REQUEST_PREVIOUSLY_DECLINED',
      });
    }

    // 2. Verify that the request is still Pending
    if (existing.status !== 'Pending') {
      return res.status(409).json({
        success: false,
        message: `Conflict: This request is no longer Pending (Current status: '${existing.status}').`,
        error: 'REQUEST_NOT_PENDING',
      });
    }

    // Server-side eligibility checks for accepting
    if (action === 'accept') {
      if (req.user.accountStatus === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Eligibility Error: Your provider account is suspended. Contact administration.',
          error: 'PROVIDER_SUSPENDED',
        });
      }

      if (req.user.providerDetails?.isAvailable === false) {
        return res.status(400).json({
          success: false,
          message: 'Eligibility Error: You are currently marked OFF-DUTY. Please toggle your duty status to Available before accepting dispatches.',
          error: 'PROVIDER_OFF_DUTY',
        });
      }

      // 3. Prevent multiple providers from accepting the same request (atomic update)
      // 4. Update AssistanceRequest status to Accepted
      // 5. Save acceptedAt timestamp
      const updatedRequest = await AssistanceRequest.findOneAndUpdate(
        {
          _id: id,
          status: 'Pending',
          $or: [
            { providerId: null },
            { providerId: providerId },
            { providerId: { $exists: false } },
          ],
        },
        {
          $set: {
            status: 'Accepted',
            providerId: providerId,
            acceptedAt: new Date(),
          },
          $push: {
            timeline: {
              status: 'Accepted',
              timestamp: new Date(),
              notes: notes || `Dispatched to ${req.user.name || 'Provider Unit'}`,
              updatedBy: providerId,
            },
          },
        },
        { new: true }
      )
        .populate('incidentId')
        .populate('travelerId', 'name phone email')
        .populate('providerId', 'name phone providerDetails');

      if (!updatedRequest) {
        return res.status(409).json({
          success: false,
          message: 'Dispatch Conflict: This assistance request has already been claimed by another emergency response unit.',
          error: 'ALREADY_CLAIMED',
        });
      }

      // 6. Update corresponding Incident status to Assistance Dispatched
      // 8. Create an incident history log in CaseLog
      const incidentId = updatedRequest.incidentId?._id || updatedRequest.incidentId;
      if (incidentId) {
        try {
          const incident = await Incident.findById(incidentId);
          if (incident) {
            const previousStatus = incident.status;
            incident.status = INCIDENT_STATUS.ASSISTANCE_DISPATCHED;
            incident.assignedProviderId = providerId;
            incident.updatedAt = new Date();
            await incident.save();

            await CaseLog.create({
              incidentId: incident._id,
              updatedBy: providerId,
              updaterRole: 'provider',
              previousStatus,
              newStatus: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
              notes: notes || `Service provider (${req.user.name || 'Authorized Unit'}) accepted dispatch for ${updatedRequest.serviceType}.`,
              timestamp: new Date(),
            });
          }
        } catch (incidentErr) {
          console.warn('[Dispatch Lifecycle Notice] Incident transition note:', incidentErr.message);
        }
      }

      // 9. Notify the traveler and admin through Socket.IO
      const io = req.app.get('io');
      if (io) {
        const travelerId = updatedRequest.travelerId?._id || updatedRequest.travelerId;
        const acceptPayload = {
          requestId: updatedRequest._id,
          incidentId,
          status: 'Accepted',
          incidentStatus: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
          provider: {
            id: providerId,
            name: req.user.name,
            phone: req.user.phone || req.user.providerDetails?.phone,
          },
          notes: notes || 'Assistance dispatch accepted by provider unit.',
          timestamp: new Date(),
        };

        if (travelerId) {
          io.to(`user_${travelerId}`).emit('assistance_status_changed', acceptPayload);
        }
        io.to(`incident_${incidentId}`).emit('assistance_status_changed', acceptPayload);
        io.to('role_admin').emit('assistance_status_changed', acceptPayload);
        io.to('role_provider').emit('assistance_status_changed', acceptPayload);
        io.to(`user_${providerId}`).emit('assistance_status_changed', acceptPayload);
      }

      // 7. Unlock authorized traveler contact information (returned unmasked)
      // 10. Move request from Incoming Requests to Active Jobs (status is now 'Accepted')
      return res.status(200).json({
        success: true,
        message: 'Dispatch request accepted successfully! Full traveler details unlocked.',
        data: updatedRequest,
      });
    } else {
      // Action === 'decline'
      const declineReason = reason || notes || 'Declined by provider unit';

      // 1. Update the request with a declined status
      // 2. Save the decline reason if provided
      // 6. Prevent the declined provider from continuing the request (record in declinedProviders)
      const updatedRequest = await AssistanceRequest.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'Declined',
            declinedAt: new Date(),
            declineReason: declineReason,
            declinedBy: providerId,
          },
          $addToSet: {
            declinedProviders: providerId,
          },
          $push: {
            timeline: {
              status: 'Declined',
              timestamp: new Date(),
              notes: declineReason,
              updatedBy: providerId,
            },
          },
        },
        { new: true }
      )
        .populate('incidentId')
        .populate('travelerId', 'name phone email')
        .populate('providerId', 'name phone providerDetails');

      // 3. Record the action in the incident history
      // 5. Allow the admin to assign another provider (revert incident status to Under Review and unassign provider)
      const incidentId = updatedRequest?.incidentId?._id || updatedRequest?.incidentId;
      if (incidentId) {
        try {
          const incident = await Incident.findById(incidentId);
          if (incident) {
            const previousStatus = incident.status;
            incident.status = INCIDENT_STATUS.UNDER_REVIEW;
            incident.assignedProviderId = null;
            incident.updatedAt = new Date();
            await incident.save();

            await CaseLog.create({
              incidentId: incident._id,
              updatedBy: providerId,
              updaterRole: 'provider',
              previousStatus,
              newStatus: INCIDENT_STATUS.UNDER_REVIEW,
              notes: `Provider (${req.user.name || 'Authorized Unit'}) declined dispatch request. Reason: ${declineReason}. Returned to Under Review for admin re-assignment.`,
              timestamp: new Date(),
            });
          }
        } catch (incidentErr) {
          console.warn('[Decline Lifecycle Notice] Incident transition note:', incidentErr.message);
        }
      }

      // 4. Notify the admin
      const io = req.app.get('io');
      if (io) {
        const declinePayload = {
          requestId: updatedRequest._id,
          incidentId,
          status: 'Declined',
          incidentStatus: INCIDENT_STATUS.UNDER_REVIEW,
          providerId,
          providerName: req.user.name,
          reason: declineReason,
          timestamp: new Date(),
        };

        io.to('role_admin').emit('provider_declined_request', declinePayload);
        io.to('role_admin').emit('assistance_status_changed', declinePayload);
        io.to('role_admin').emit('incident_status_changed', {
          incidentId,
          newStatus: INCIDENT_STATUS.UNDER_REVIEW,
        });
        io.to(`incident_${incidentId}`).emit('assistance_status_changed', declinePayload);
        io.to('role_provider').emit('assistance_status_changed', declinePayload);
        io.to(`user_${providerId}`).emit('assistance_status_changed', declinePayload);
      }

      return res.status(200).json({
        success: true,
        message: 'Dispatch request declined. Incident returned to Under Review for admin reassignment.',
        data: updatedRequest,
      });
    }
  } catch (err) {
    console.error('[Respond To Request Error]', err.message);
    next(err);
  }
};

/**
 * @desc    Update active assistance job status (En Route, Arrived/On Scene, In Progress, Completed)
 * @route   PATCH /api/assistance-requests/:id/status
 * @access  Private (Provider / Admin)
 * @owner   Member 4 (Himla)
 */
exports.updateJobStatus = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { id } = req.params;
    const { status, notes, etaMinutes } = req.body;
    const providerId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: '${id}'.`,
        error: 'INVALID_ID',
      });
    }

    const existingJob = await AssistanceRequest.findById(id);
    if (!existingJob) {
      return res.status(404).json({ success: false, message: 'Assistance request not found in MongoDB.' });
    }

    if (req.user.role === 'provider' && String(existingJob.providerId) !== String(providerId)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update a job assigned to another provider.',
        error: 'FORBIDDEN_JOB_UPDATE',
      });
    }

    if (existingJob.status === 'Declined') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This assistance request was declined and cannot be continued.',
        error: 'JOB_DECLINED',
      });
    }

    if (existingJob.declinedProviders?.some((p) => String(p) === String(providerId))) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You have declined this assistance request and cannot continue or update it.',
        error: 'PROVIDER_DECLINED_JOB',
      });
    }

    const allowed = [
      'Accepted',
      'En Route',
      'Arrived',
      'On Scene',
      'In Progress',
      'Assistance in Progress',
      'Completed',
      'Cancelled',
    ];

    if (status && !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid job status. Permitted: ${allowed.join(', ')}`,
        error: 'INVALID_STATUS',
      });
    }

    if (!status && !notes) {
      return res.status(400).json({
        success: false,
        message: 'Either status or notes must be provided.',
        error: 'MISSING_UPDATE_FIELDS',
      });
    }

    // Normalize status if 'Assistance in Progress' or 'On Scene'
    let targetStatus = status || existingJob.status;
    if (targetStatus === 'Assistance in Progress') {
      targetStatus = 'In Progress';
    }

    const updateFields = {
      status: targetStatus,
      updatedAt: new Date(),
    };

    if (notes) updateFields.dispatchNotes = notes;

    // Save timestamps for each stage in MongoDB
    if (targetStatus === 'Accepted' && !existingJob.acceptedAt) {
      updateFields.acceptedAt = new Date();
    } else if (targetStatus === 'En Route') {
      updateFields.enRouteAt = new Date();
    } else if (targetStatus === 'Arrived' || targetStatus === 'On Scene') {
      updateFields.arrivedAt = new Date();
    } else if (targetStatus === 'In Progress') {
      updateFields.inProgressAt = new Date();
    } else if (targetStatus === 'Completed') {
      updateFields.completedAt = new Date();
    }

    const timelineEntry = {
      status: targetStatus,
      timestamp: new Date(),
      notes: notes || `Job milestone advanced to '${targetStatus}'`,
      updatedBy: providerId,
    };

    const updatedJob = await AssistanceRequest.findByIdAndUpdate(
      id,
      {
        $set: updateFields,
        $push: { timeline: timelineEntry },
      },
      { new: true }
    )
      .populate('incidentId')
      .populate('travelerId', 'name phone email')
      .populate('providerId', 'name phone providerDetails');

    // Coordinate with Incident Lifecycle & create CaseLog for every status change
    let updatedIncident = null;
    let createdCaseLog = null;
    try {
      const incidentId = updatedJob.incidentId?._id || updatedJob.incidentId;
      if (incidentId) {
        const incident = await Incident.findById(incidentId);
        if (incident) {
          const prevIncidentStatus = incident.status;
          let targetIncidentStatus = prevIncidentStatus;

          if (['Arrived', 'On Scene', 'In Progress'].includes(targetStatus)) {
            targetIncidentStatus = INCIDENT_STATUS.IN_PROGRESS;
          } else if (targetStatus === 'Completed') {
            targetIncidentStatus = INCIDENT_STATUS.RESOLVED;
          } else if (targetStatus === 'En Route' || targetStatus === 'Accepted') {
            if (
              incident.status === INCIDENT_STATUS.SUBMITTED ||
              incident.status === INCIDENT_STATUS.UNDER_REVIEW ||
              incident.status === INCIDENT_STATUS.ASSIGNED
            ) {
              targetIncidentStatus = INCIDENT_STATUS.ASSISTANCE_DISPATCHED;
            }
          }

          incident.status = targetIncidentStatus;
          incident.assignedProviderId = providerId;
          incident.updatedAt = new Date();
          await incident.save();
          updatedIncident = incident;

          // Requirement: Create a CaseLog entry for every status change
          createdCaseLog = await CaseLog.create({
            incidentId: incident._id,
            updatedBy: providerId,
            updaterRole: 'provider',
            previousStatus: prevIncidentStatus,
            newStatus: targetIncidentStatus,
            notes: notes || `Provider updated job milestone to '${targetStatus}'. Incident status is '${targetIncidentStatus}'.`,
            timestamp: new Date(),
          });
        }
      }
    } catch (incidentErr) {
      console.warn('[Incident Sync Notice]:', incidentErr.message);
    }

    // Broadcast update via Socket.io to traveler, incident, admin, and provider
    const io = req.app.get('io');
    if (io) {
      const incidentId = updatedJob.incidentId?._id || updatedJob.incidentId;
      const travelerId = updatedJob.travelerId?._id || updatedJob.travelerId;

      const progressPayload = {
        requestId: id,
        incidentId,
        newStatus: targetStatus,
        status: targetStatus,
        incidentStatus: updatedIncident ? updatedIncident.status : undefined,
        notes: notes || `Milestone reached: ${targetStatus}`,
        timestamp: new Date(),
      };

      if (travelerId) {
        io.to(`user_${travelerId}`).emit('assistance_status_changed', progressPayload);
        if (updatedIncident) {
          io.to(`user_${travelerId}`).emit('incident_updated', {
            incidentId,
            newStatus: updatedIncident.status,
            incident: updatedIncident,
          });
        }
      }

      io.to(`incident_${incidentId}`).emit('assistance_status_changed', progressPayload);
      if (updatedIncident) {
        io.to(`incident_${incidentId}`).emit('incident_updated', {
          incidentId,
          newStatus: updatedIncident.status,
          incident: updatedIncident,
        });
      }
      if (createdCaseLog) {
        io.to(`incident_${incidentId}`).emit('case_log_added', createdCaseLog);
      }

      io.to('role_admin').emit('assistance_status_changed', progressPayload);
      if (updatedIncident) {
        io.to('role_admin').emit('incident_updated', {
          incidentId,
          newStatus: updatedIncident.status,
          incident: updatedIncident,
        });
      }

      io.to('role_provider').emit('assistance_status_changed', progressPayload);
      io.to(`user_${providerId}`).emit('assistance_status_changed', progressPayload);
    }

    return res.status(200).json({
      success: true,
      message: `Job status successfully updated to '${targetStatus}'.`,
      data: updatedJob,
      incident: updatedIncident,
      caseLog: createdCaseLog,
    });
  } catch (err) {
    console.error('[Update Job Status Error]', err.message);
    next(err);
  }
};
