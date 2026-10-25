const mongoose = require('mongoose');
const AssistanceRequest = require('../models/AssistanceRequest');
const { Incident, INCIDENT_STATUS } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');
const User = require('../models/User');

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

// In-memory fallback data for testing/development when MongoDB daemon is not running
let memoryRequests = [
  {
    _id: '65r000000000000000000001',
    incidentId: {
      _id: '65f000000000000000000010',
      category: 'Roadside & Vehicle Breakdown',
      title: 'Engine overheating on Mountain Pass A4',
      severity: 'High',
      location: {
        address: 'Route A4, Mile Marker 42, Central Province',
        coordinates: [80.6337, 7.2906],
      },
    },
    travelerId: {
      _id: '65e000000000000000000001',
      name: 'Sarah Jenkins',
      phone: '+1 (555) 234-5678',
      email: 'traveler@safepassage.org',
    },
    providerId: '65e000000000000000000002',
    serviceType: 'Roadside Towing & Vehicle Repair',
    location: {
      type: 'Point',
      coordinates: [80.6337, 7.2906],
      address: 'Route A4, Mile Marker 42, Central Province',
    },
    status: 'En Route',
    dispatchNotes: 'Tow truck Unit 4 dispatched with cooling system emergency parts.',
    acceptedAt: new Date(Date.now() - 1800000),
    enRouteAt: new Date(Date.now() - 1500000),
    createdAt: new Date(Date.now() - 3600000),
    timeline: [
      {
        status: 'Accepted',
        timestamp: new Date(Date.now() - 1800000),
        notes: 'Dispatch unit accepted by Apex Rapid Response Ltd.',
      },
      {
        status: 'En Route',
        timestamp: new Date(Date.now() - 1500000),
        notes: 'Vehicle en route via Route A4. Estimated arrival: 14 minutes.',
      },
    ],
  },
  {
    _id: '65r000000000000000000002',
    incidentId: {
      _id: '65f000000000000000000011',
      category: 'Medical Emergency',
      title: 'Severe allergic reaction to food ingredient',
      severity: 'Critical',
      location: {
        address: 'Galle Face Terrace, Coastal Road',
        coordinates: [79.8612, 6.9271],
      },
    },
    travelerId: {
      _id: '65e000000000000000000001',
      name: 'Sarah Jenkins',
      phone: '+1 (555) 234-5678',
      email: 'traveler@safepassage.org',
    },
    providerId: '65e000000000000000000002',
    serviceType: 'Emergency Paramedic Escort',
    location: {
      type: 'Point',
      coordinates: [79.8612, 6.9271],
      address: 'Galle Face Terrace, Coastal Road',
    },
    status: 'On Scene',
    dispatchNotes: 'Ambulance team evaluating oxygen saturation on site.',
    acceptedAt: new Date(Date.now() - 3600000),
    enRouteAt: new Date(Date.now() - 3000000),
    arrivedAt: new Date(Date.now() - 1200000),
    createdAt: new Date(Date.now() - 5400000),
    timeline: [
      {
        status: 'Accepted',
        timestamp: new Date(Date.now() - 3600000),
        notes: 'Emergency paramedic dispatch accepted.',
      },
      {
        status: 'En Route',
        timestamp: new Date(Date.now() - 3000000),
        notes: 'Ambulance dispatched with siren.',
      },
      {
        status: 'On Scene',
        timestamp: new Date(Date.now() - 1200000),
        notes: 'Arrived at Galle Face Terrace. Paramedics assessing vitals.',
      },
    ],
  },
  {
    _id: '65r000000000000000000003',
    incidentId: {
      _id: '65f000000000000000000012',
      category: 'Lost & Stranded',
      title: 'Missed trail marker in dense fog',
      severity: 'Medium',
      location: {
        address: 'Horton Plains National Park trail 3',
        coordinates: [80.7891, 6.8096],
      },
    },
    travelerId: {
      _id: '65e000000000000000000001',
      name: 'David Chen',
      phone: '+61 400 123 456',
      email: 'david.chen@safepassage.org',
    },
    providerId: null,
    serviceType: 'Search & Mountain Extrication',
    location: {
      type: 'Point',
      coordinates: [80.7891, 6.8096],
      address: 'Horton Plains National Park trail 3, Nuwara Eliya',
    },
    status: 'Pending',
    dispatchNotes: 'Hiker safe on ridge, daylight fading. Requires escort beacon.',
    acceptedAt: null,
    createdAt: new Date(Date.now() - 900000), // 15 mins ago
    timeline: [],
  },
  {
    _id: '65r000000000000000000004',
    incidentId: {
      _id: '65f000000000000000000013',
      category: 'Roadside & Vehicle Breakdown',
      title: 'Flat tire and damaged rim on A1 Expressway',
      severity: 'Medium',
      location: {
        address: 'Colombo - Kandy Expressway KM 18',
        coordinates: [79.9200, 7.0500],
      },
    },
    travelerId: {
      _id: '65e000000000000000000005',
      name: 'Marcus Vance',
      phone: '+44 7700 900123',
      email: 'marcus.vance@safepassage.org',
    },
    providerId: null,
    serviceType: 'Roadside Towing & Vehicle Repair',
    location: {
      type: 'Point',
      coordinates: [79.9200, 7.0500],
      address: 'Colombo - Kandy Expressway KM 18, Kadawatha Interchange',
    },
    status: 'Pending',
    dispatchNotes: 'Dual blowout after debris impact. Vehicle positioned on hard shoulder.',
    acceptedAt: null,
    createdAt: new Date(Date.now() - 420000), // 7 mins ago
    timeline: [],
  },
  {
    _id: '65r000000000000000000005',
    incidentId: {
      _id: '65f000000000000000000014',
      category: 'Roadside & Vehicle Breakdown',
      title: 'Dead battery in airport long-stay lot',
      severity: 'Low',
      location: {
        address: 'Bandaranaike Intl Airport, Car Park C',
        coordinates: [79.8841, 7.1808],
      },
    },
    travelerId: {
      _id: '65e000000000000000000006',
      name: 'Elena Rostova',
      phone: '+33 612 345 678',
      email: 'elena@safepassage.org',
    },
    providerId: '65e000000000000000000002',
    serviceType: 'Battery Jumpstart & Mobile Charging',
    location: {
      type: 'Point',
      coordinates: [79.8841, 7.1808],
      address: 'Bandaranaike Intl Airport, Car Park C',
    },
    status: 'Completed',
    dispatchNotes: 'Battery jumpstarted successfully, alternator output verified normal.',
    acceptedAt: new Date(Date.now() - 86400000),
    enRouteAt: new Date(Date.now() - 84600000),
    arrivedAt: new Date(Date.now() - 82800000),
    inProgressAt: new Date(Date.now() - 82000000),
    completedAt: new Date(Date.now() - 81000000),
    createdAt: new Date(Date.now() - 88000000),
    timeline: [
      { status: 'Accepted', timestamp: new Date(Date.now() - 86400000), notes: 'Dispatch accepted.' },
      { status: 'En Route', timestamp: new Date(Date.now() - 84600000), notes: 'Mobile van en route.' },
      { status: 'Arrived', timestamp: new Date(Date.now() - 82800000), notes: 'Arrived at Lot C.' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 82000000), notes: 'Testing battery voltage.' },
      { status: 'Completed', timestamp: new Date(Date.now() - 81000000), notes: 'Resolved with booster.' },
    ],
  },
];

/**
 * @desc    Create an assistance request for an incident
 * @route   POST /api/assistance-requests
 * @access  Private
 * @owner   Member 4 (Himla)
 */
exports.createRequest = async (req, res, next) => {
  try {
    const { incidentId, serviceType, location, dispatchNotes, providerId } = req.body;

    if (!incidentId || !serviceType || !location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'incidentId, serviceType, and location coordinates [lng, lat] are required.',
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

    let createdRequest;
    if (mongoose.connection.readyState === 1) {
      try {
        createdRequest = await AssistanceRequest.create(newReq);
        const populated = await AssistanceRequest.findById(createdRequest._id)
          .populate('incidentId')
          .populate('travelerId', 'name phone email');
        createdRequest = populated;
      } catch {
        // Fallback below
      }
    }

    if (!createdRequest) {
      createdRequest = {
        _id: '65r' + Math.random().toString(16).substring(2, 23),
        ...newReq,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryRequests.unshift(createdRequest);
    }

    // Emit real-time notification to all providers via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('role_provider').emit('new_assistance_request', createdRequest);
      io.to('role_admin').emit('new_assistance_request', createdRequest);
    }

    return res.status(201).json({
      success: true,
      message: 'Assistance request created successfully.',
      data: createdRequest,
    });
  } catch (err) {
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
    const { status, filter, search } = req.query;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    // Optional provider coordinates for accurate distance calculation
    const providerCoords = req.user.providerDetails?.currentLocation?.coordinates || [79.8612, 6.9271];

    let queryFilter = {};

    if (userRole === 'provider') {
      if (filter === 'eligible' || status === 'Pending') {
        // Only return pending unassigned requests matching eligible criteria
        queryFilter.status = 'Pending';
        queryFilter.providerId = null;
      } else if (filter === 'active') {
        // Return active jobs claimed by this provider
        queryFilter.providerId = userId;
        queryFilter.status = { $in: ['Accepted', 'En Route', 'Arrived', 'On Scene', 'In Progress'] };
      } else if (filter === 'history' || filter === 'completed') {
        // Return completed / archived jobs for this provider
        queryFilter.providerId = userId;
        queryFilter.status = { $in: ['Completed', 'Declined', 'Cancelled'] };
      } else if (status) {
        queryFilter.status = status;
        if (status !== 'Pending') {
          queryFilter.providerId = userId;
        }
      } else {
        // Default provider view: jobs assigned to them OR pending requests in pool
        queryFilter.$or = [
          { providerId: userId },
          { status: 'Pending', providerId: null },
        ];
      }
    } else if (userRole === 'traveler') {
      queryFilter.travelerId = userId;
      if (status) queryFilter.status = status;
    } else if (userRole === 'admin') {
      if (status) queryFilter.status = status;
    }

    if (mongoose.connection.readyState === 1) {
      try {
        let requests = await AssistanceRequest.find(queryFilter)
          .sort({ createdAt: -1 })
          .populate('incidentId')
          .populate('travelerId', 'name phone email')
          .populate('providerId', 'name phone providerDetails')
          .lean();

        // Privacy enforcement: mask sensitive traveler info on pending requests
        const sanitized = requests.map((reqItem) => {
          const item = { ...reqItem };
          const reqLocationCoords = item.location?.coordinates || item.incidentId?.location?.coordinates;

          // Calculate real distance if coordinates exist
          if (reqLocationCoords) {
            item.distanceKm = calculateDistanceKm(providerCoords, reqLocationCoords);
          }

          // Privacy rule: Only assigned provider or admin can view private traveler contact info
          const isAssigned = item.providerId && String(item.providerId._id || item.providerId) === String(userId);
          if (userRole === 'provider' && item.status === 'Pending' && !isAssigned) {
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
      } catch {
        // Fallback to memory below
      }
    }
      // Memory fallback mode
      let results = [...memoryRequests];

      if (userRole === 'provider') {
        if (filter === 'eligible' || status === 'Pending') {
          results = results.filter((r) => r.status === 'Pending' && !r.providerId);
        } else if (filter === 'active') {
          results = results.filter(
            (r) =>
              String(r.providerId) === String(userId) &&
              ['Accepted', 'En Route', 'Arrived', 'On Scene', 'In Progress'].includes(r.status)
          );
        } else if (filter === 'history' || filter === 'completed') {
          results = results.filter(
            (r) =>
              String(r.providerId) === String(userId) &&
              ['Completed', 'Declined', 'Cancelled'].includes(r.status)
          );
        } else if (status) {
          results = results.filter((r) => r.status === status);
          if (status !== 'Pending') {
            results = results.filter((r) => String(r.providerId) === String(userId));
          }
        } else {
          results = results.filter(
            (r) => String(r.providerId) === String(userId) || (r.status === 'Pending' && !r.providerId)
          );
        }
      } else if (userRole === 'traveler') {
        results = results.filter(
          (r) => String(r.travelerId?._id || r.travelerId) === String(userId)
        );
      }

      // Format distance and apply traveler privacy
      const processed = results.map((item) => {
        const clone = { ...item };
        const reqLocationCoords = clone.location?.coordinates;
        if (reqLocationCoords) {
          clone.distanceKm = calculateDistanceKm(providerCoords, reqLocationCoords);
        }
        const isAssigned = clone.providerId && String(clone.providerId) === String(userId);
        if (userRole === 'provider' && clone.status === 'Pending' && !isAssigned) {
          clone.travelerId = maskTravelerInfo(clone.travelerId);
        }
        return clone;
      });

      return res.status(200).json({
        success: true,
        count: processed.length,
        data: processed,
      });
  } catch (err) {
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
    const providerId = req.user.id || req.user._id;

    let newRequestsCount = 0;
    let acceptedJobsCount = 0;
    let activeJobsCount = 0;
    let completedJobsCount = 0;

    if (mongoose.connection.readyState === 1) {
      try {
        newRequestsCount = await AssistanceRequest.countDocuments({
          status: 'Pending',
          providerId: null,
        });

        acceptedJobsCount = await AssistanceRequest.countDocuments({
          providerId,
          status: 'Accepted',
        });

        activeJobsCount = await AssistanceRequest.countDocuments({
          providerId,
          status: { $in: ['Accepted', 'En Route', 'Arrived', 'On Scene', 'In Progress'] },
        });

        completedJobsCount = await AssistanceRequest.countDocuments({
          providerId,
          status: 'Completed',
        });
      } catch {
        // Fallback below
      }
    } else {
      newRequestsCount = memoryRequests.filter((r) => r.status === 'Pending' && !r.providerId).length;
      acceptedJobsCount = memoryRequests.filter((r) => String(r.providerId) === String(providerId) && r.status === 'Accepted').length;
      activeJobsCount = memoryRequests.filter(
        (r) =>
          String(r.providerId) === String(providerId) &&
          ['Accepted', 'En Route', 'Arrived', 'On Scene', 'In Progress'].includes(r.status)
      ).length;
      completedJobsCount = memoryRequests.filter(
        (r) => String(r.providerId) === String(providerId) && r.status === 'Completed'
      ).length;
    }

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
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const providerCoords = req.user.providerDetails?.currentLocation?.coordinates || [79.8612, 6.9271];

    let request;
    if (mongoose.connection.readyState === 1) {
      try {
        request = await AssistanceRequest.findById(id)
          .populate('incidentId')
          .populate('travelerId', 'name phone email')
          .populate('providerId', 'name phone providerDetails')
          .lean();
      } catch {
        // Fallback below
      }
    }

    if (!request) {
      request = memoryRequests.find((r) => String(r._id) === String(id));
    }

    if (!request) {
      return res.status(404).json({ success: false, message: 'Assistance request not found.' });
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

    // Traveler privacy protection
    const isAssignedToMe =
      request.providerId &&
      String(request.providerId._id || request.providerId) === String(userId);

    if (userRole === 'provider' && request.status === 'Pending' && !isAssignedToMe) {
      request.travelerId = maskTravelerInfo(request.travelerId);
    }

    return res.status(200).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Provider responds to incoming assistance request (Accept or Decline)
 *          Includes:
 *          1. Server-side eligibility checks (verified, active, duty status)
 *          2. Atomic concurrency control to prevent double-claiming
 *          3. Coordination with Incident lifecycle (Member 3) & CaseLog
 * @route   PATCH /api/assistance-requests/:id/respond
 * @access  Private (Provider / Admin only)
 * @owner   Member 4 (Himla)
 */
exports.respondToRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // 'accept' or 'decline'
    const providerId = req.user.id || req.user._id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'accept' or 'decline'.",
      });
    }

    // ==========================================
    // REQUIREMENT 5: Server-side eligibility checks
    // ==========================================
    if (action === 'accept') {
      // 1. Check account status
      if (req.user.accountStatus === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Eligibility Error: Your provider account is suspended. Contact administration.',
          error: 'PROVIDER_SUSPENDED',
        });
      }

      // 2. Check duty availability
      if (req.user.providerDetails?.isAvailable === false) {
        return res.status(400).json({
          success: false,
          message: 'Eligibility Error: You are currently marked OFF-DUTY. Please toggle your duty status to Available before accepting dispatches.',
          error: 'PROVIDER_OFF_DUTY',
        });
      }
    }

    // ==========================================
    // REQUIREMENT 6: Prevent duplicate claims (Concurrency Control)
    // ==========================================
    let updatedRequest = null;
    let alreadyClaimed = false;

    if (action === 'accept') {
      if (mongoose.connection.readyState === 1) {
        try {
          // Atomic query: only update if status is 'Pending' AND providerId is still null
          updatedRequest = await AssistanceRequest.findOneAndUpdate(
            {
              _id: id,
              status: 'Pending',
              providerId: null,
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
            // Check if request exists to confirm if already claimed
            const existing = await AssistanceRequest.findById(id);
            if (existing && existing.providerId && String(existing.providerId) !== String(providerId)) {
              alreadyClaimed = true;
            } else if (existing && existing.status !== 'Pending') {
              alreadyClaimed = true;
            } else if (!existing) {
              return res.status(404).json({ success: false, message: 'Assistance request not found.' });
            }
          }
        } catch {
          // Fallback below
        }
      }

      if (!updatedRequest && !alreadyClaimed) {
        // Memory mode concurrency check
        const memReq = memoryRequests.find((r) => String(r._id) === String(id));
        if (!memReq) {
          return res.status(404).json({ success: false, message: 'Request not found in memory.' });
        }
        if (memReq.status !== 'Pending' || (memReq.providerId && String(memReq.providerId) !== String(providerId))) {
          alreadyClaimed = true;
        } else {
          memReq.status = 'Accepted';
          memReq.providerId = providerId;
          memReq.acceptedAt = new Date();
          memReq.timeline = memReq.timeline || [];
          memReq.timeline.push({
            status: 'Accepted',
            timestamp: new Date(),
            notes: notes || `Dispatched to ${req.user.name || 'Provider Unit'}`,
            updatedBy: providerId,
          });
          updatedRequest = memReq;
        }
      }

      if (alreadyClaimed) {
        return res.status(409).json({
          success: false,
          message: 'Dispatch Conflict: This assistance request has already been claimed by another emergency response unit.',
          error: 'ALREADY_CLAIMED',
        });
      }

      // ==========================================
      // REQUIREMENT 10: Coordinate with Incident Lifecycle & CaseLog (Member 3)
      // ==========================================
      if (mongoose.connection.readyState === 1) {
        try {
          const incidentId = updatedRequest.incidentId?._id || updatedRequest.incidentId;
          if (incidentId) {
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
                notes: `Service provider (${req.user.name || 'Authorized Unit'}) accepted dispatch for ${updatedRequest.serviceType}.`,
                timestamp: new Date(),
              });
            }
          }
        } catch (incidentErr) {
          console.warn('[Dispatch Lifecycle Notice] Incident transition note:', incidentErr.message);
        }
      }

      // Real-time notification via Socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(`incident_${updatedRequest.incidentId?._id || updatedRequest.incidentId}`).emit(
          'assistance_status_changed',
          {
            requestId: updatedRequest._id,
            status: 'Accepted',
            provider: { id: providerId, name: req.user.name },
            timestamp: new Date(),
          }
        );
        io.to('role_admin').emit('assistance_status_changed', {
          requestId: updatedRequest._id,
          status: 'Accepted',
          providerId,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Dispatch request accepted successfully! Full traveler details unlocked.',
        data: updatedRequest,
      });
    } else {
      // Action === 'decline'
      if (mongoose.connection.readyState === 1) {
        try {
          await AssistanceRequest.findByIdAndUpdate(id, {
            $push: {
              timeline: {
                status: 'Declined',
                timestamp: new Date(),
                notes: notes || `Declined by provider ${req.user.name}`,
                updatedBy: providerId,
              },
            },
          });
        } catch {
          // Fallback below
        }
      }

      const mem = memoryRequests.find((r) => String(r._id) === String(id));
      if (mem) {
        mem.timeline = mem.timeline || [];
        mem.timeline.push({
          status: 'Declined',
          timestamp: new Date(),
          notes: notes || `Declined by provider ${req.user.name}`,
          updatedBy: providerId,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Dispatch request declined. Released back to emergency network.',
      });
    }
  } catch (err) {
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
    const { id } = req.params;
    const { status, notes, etaMinutes } = req.body;
    const providerId = req.user.id || req.user._id;

    // Allowed status values
    const allowed = ['Accepted', 'En Route', 'Arrived', 'On Scene', 'In Progress', 'Completed', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid job status. Permitted: ${allowed.join(', ')}`,
      });
    }

    // Verify ownership of the job
    let existingJob;
    if (mongoose.connection.readyState === 1) {
      try {
        existingJob = await AssistanceRequest.findById(id);
      } catch {
        // Fallback below
      }
    }
    if (!existingJob) {
      existingJob = memoryRequests.find((r) => String(r._id) === String(id));
    }

    if (!existingJob) {
      return res.status(404).json({ success: false, message: 'Assistance request not found.' });
    }

    if (req.user.role === 'provider' && String(existingJob.providerId) !== String(providerId)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update a job assigned to another provider.',
        error: 'FORBIDDEN_JOB_UPDATE',
      });
    }

    // Prepare update fields & timestamps
    const updateFields = {
      status,
      updatedAt: new Date(),
    };

    if (notes) updateFields.dispatchNotes = notes;

    const timelineEntry = {
      status,
      timestamp: new Date(),
      notes: notes || `Job advanced to ${status}`,
      updatedBy: providerId,
    };

    if (status === 'En Route') {
      updateFields.enRouteAt = new Date();
    } else if (status === 'Arrived' || status === 'On Scene') {
      updateFields.arrivedAt = new Date();
    } else if (status === 'In Progress') {
      updateFields.inProgressAt = new Date();
    } else if (status === 'Completed') {
      updateFields.completedAt = new Date();
    }

    let updatedJob;
    if (mongoose.connection.readyState === 1) {
      try {
        updatedJob = await AssistanceRequest.findByIdAndUpdate(
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
      } catch {
        // Fallback below
      }
    }

    if (!updatedJob) {
      Object.assign(existingJob, updateFields);
      existingJob.timeline = existingJob.timeline || [];
      existingJob.timeline.push(timelineEntry);
      updatedJob = existingJob;
    }

    // ==========================================
    // REQUIREMENT 10: Coordinate with Member 3 Incident Lifecycle
    // ==========================================
    if (mongoose.connection.readyState === 1) {
      try {
        const incidentId = updatedJob.incidentId?._id || updatedJob.incidentId;
        if (incidentId) {
          const incident = await Incident.findById(incidentId);
          if (incident) {
            const prevIncidentStatus = incident.status;
            let targetIncidentStatus = null;

            if (['Arrived', 'On Scene', 'In Progress'].includes(status)) {
              if (incident.status === INCIDENT_STATUS.ASSISTANCE_DISPATCHED) {
                targetIncidentStatus = INCIDENT_STATUS.IN_PROGRESS;
              }
            } else if (status === 'Completed') {
              if (incident.status === INCIDENT_STATUS.IN_PROGRESS || incident.status === INCIDENT_STATUS.ASSISTANCE_DISPATCHED) {
                targetIncidentStatus = INCIDENT_STATUS.RESOLVED;
              }
            }

            if (targetIncidentStatus && targetIncidentStatus !== prevIncidentStatus) {
              incident.status = targetIncidentStatus;
              incident.updatedAt = new Date();
              await incident.save();

              await CaseLog.create({
                incidentId: incident._id,
                updatedBy: providerId,
                updaterRole: 'provider',
                previousStatus: prevIncidentStatus,
                newStatus: targetIncidentStatus,
                notes: notes || `Provider updated job status to '${status}'. Incident transitioned to '${targetIncidentStatus}'.`,
                timestamp: new Date(),
              });
            }
          }
        }
      } catch (incidentErr) {
        console.warn('[Incident Sync Notice]:', incidentErr.message);
      }
    }

    // Broadcast update via Socket.io
    const io = req.app.get('io');
    if (io) {
      const incidentId = updatedJob.incidentId?._id || updatedJob.incidentId;
      io.to(`incident_${incidentId}`).emit('assistance_status_changed', {
        requestId: id,
        incidentId,
        newStatus: status,
        notes,
        timestamp: new Date(),
      });
      io.to('role_admin').emit('assistance_status_changed', {
        requestId: id,
        newStatus: status,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Job status successfully updated to '${status}'.`,
      data: updatedJob,
    });
  } catch (err) {
    next(err);
  }
};
