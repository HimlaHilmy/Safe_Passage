const { Incident, INCIDENT_STATUS, VALID_STATUS_TRANSITIONS } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');

// In-memory demo store for when MongoDB is disconnected during initial UI development
let memoryIncidents = [
  {
    _id: '65f000000000000000000010',
    travelerId: '65e000000000000000000001',
    category: 'Roadside & Vehicle Breakdown',
    title: 'Engine overheating on Mountain Pass A4',
    description: 'Vehicle radiator steam observed, unable to proceed. Two passengers on board with limited water.',
    severity: 'High',
    location: {
      type: 'Point',
      coordinates: [80.6337, 7.2906], // Kandy area
      address: 'Route A4, Mile Marker 42, Central Province',
      landmark: 'Near Viewpoint Cafe',
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        type: 'image',
        caption: 'Radiator steam and warning light on dashboard',
        uploadedAt: new Date(Date.now() - 3600000),
      },
    ],
    status: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
    assignedProviderId: '65e000000000000000000002',
    estimatedArrivalTimeMinutes: 18,
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 1800000),
  },
  {
    _id: '65f000000000000000000011',
    travelerId: '65e000000000000000000001',
    category: 'Medical Emergency',
    title: 'Severe allergic reaction to food ingredient',
    description: 'Difficulty breathing, facial swelling. Antihistamine administered but condition worsening.',
    severity: 'Critical',
    location: {
      type: 'Point',
      coordinates: [79.8612, 6.9271], // Colombo area
      address: 'Galle Face Terrace, Coastal Road',
      landmark: 'Opposite Lighthouse Hotel',
    },
    media: [],
    status: INCIDENT_STATUS.IN_PROGRESS,
    assignedProviderId: '65e000000000000000000002',
    estimatedArrivalTimeMinutes: 5,
    createdAt: new Date(Date.now() - 14400000),
    updatedAt: new Date(Date.now() - 900000),
  },
  {
    _id: '65f000000000000000000012',
    travelerId: '65e000000000000000000001',
    category: 'Lost & Stranded',
    title: 'Missed trail marker in dense fog',
    description: 'Hiker disoriented off marked path. Battery at 25%, flashlight operational, safe from precipice.',
    severity: 'Medium',
    location: {
      type: 'Point',
      coordinates: [80.7891, 6.8096], // Horton Plains
      address: 'Horton Plains National Park trail 3',
      landmark: 'Between Chimney Pond and Mini Worlds End',
    },
    media: [],
    status: INCIDENT_STATUS.UNDER_REVIEW,
    assignedProviderId: null,
    estimatedArrivalTimeMinutes: null,
    createdAt: new Date(Date.now() - 21600000),
    updatedAt: new Date(Date.now() - 7200000),
  },
];

let memoryCaseLogs = [
  {
    _id: '65f100000000000000000001',
    incidentId: '65f000000000000000000010',
    updatedBy: '65e000000000000000000001',
    updaterRole: 'traveler',
    previousStatus: 'None',
    newStatus: INCIDENT_STATUS.SUBMITTED,
    notes: 'Incident submitted by traveler from mobile device.',
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    _id: '65f100000000000000000002',
    incidentId: '65f000000000000000000010',
    updatedBy: '65e000000000000000000003',
    updaterRole: 'admin',
    previousStatus: INCIDENT_STATUS.SUBMITTED,
    newStatus: INCIDENT_STATUS.UNDER_REVIEW,
    notes: 'Verified traveler coordinates and triage priority set to High.',
    timestamp: new Date(Date.now() - 5400000),
  },
  {
    _id: '65f100000000000000000003',
    incidentId: '65f000000000000000000010',
    updatedBy: '65e000000000000000000003',
    updaterRole: 'admin',
    previousStatus: INCIDENT_STATUS.UNDER_REVIEW,
    newStatus: INCIDENT_STATUS.ASSIGNED,
    notes: 'Assigned to Apex Rapid Response Ltd.',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    _id: '65f100000000000000000004',
    incidentId: '65f000000000000000000010',
    updatedBy: '65e000000000000000000002',
    updaterRole: 'provider',
    previousStatus: INCIDENT_STATUS.ASSIGNED,
    newStatus: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
    notes: 'Patrol unit en route. ETA 18 minutes.',
    timestamp: new Date(Date.now() - 1800000),
  },
];

/**
 * @desc    Create new emergency incident
 * @route   POST /api/incidents
 * @access  Private (Traveler / Admin)
 * @owner   Member 1 (Dulanjani)
 */
exports.createIncident = async (req, res, next) => {
  try {
    const { category, title, description, severity, location, media } = req.body;

    if (!category || !title || !description || !location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Category, title, description, and valid GeoJSON location coordinates are required.',
      });
    }

    const newIncidentData = {
      travelerId: req.user.id || req.user._id,
      category,
      title,
      description,
      severity: severity || 'Medium',
      location: {
        type: 'Point',
        coordinates: location.coordinates, // [lng, lat]
        address: location.address || '',
        landmark: location.landmark || '',
      },
      media: media || [],
      status: INCIDENT_STATUS.SUBMITTED,
    };

    try {
      const incident = await Incident.create(newIncidentData);

      // Create initial case log
      await CaseLog.create({
        incidentId: incident._id,
        updatedBy: req.user.id || req.user._id,
        updaterRole: req.user.role || 'traveler',
        previousStatus: 'None',
        newStatus: INCIDENT_STATUS.SUBMITTED,
        notes: 'Emergency reported and created.',
        timestamp: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Emergency incident reported successfully.',
        data: incident,
      });
    } catch {
      // In-memory fallback
      const mockIncident = {
        _id: '65f' + Math.random().toString(16).substring(2, 23),
        ...newIncidentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryIncidents.unshift(mockIncident);

      memoryCaseLogs.push({
        _id: '65log' + Math.random().toString(16).substring(2, 23),
        incidentId: mockIncident._id,
        updatedBy: req.user.id || req.user._id,
        updaterRole: req.user.role || 'traveler',
        previousStatus: 'None',
        newStatus: INCIDENT_STATUS.SUBMITTED,
        notes: 'Emergency reported and logged in memory mode.',
        timestamp: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Incident reported successfully (Development Mode).',
        data: mockIncident,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all incidents (filtered by role: traveler sees own, admin/provider sees permitted)
 * @route   GET /api/incidents
 * @access  Private
 */
exports.getIncidents = async (req, res, next) => {
  try {
    const { status, category, severity } = req.query;
    const filter = {};

    if (req.user.role === 'traveler') {
      filter.travelerId = req.user.id || req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;

    try {
      const incidents = await Incident.find(filter)
        .sort({ createdAt: -1 })
        .populate('travelerId', 'name email phone')
        .populate('assignedProviderId', 'name phone providerDetails');

      return res.status(200).json({
        success: true,
        count: incidents.length,
        data: incidents,
      });
    } catch {
      // In-memory filter
      let result = memoryIncidents;
      if (req.user.role === 'traveler') {
        result = result.filter(
          (inc) => String(inc.travelerId) === String(req.user.id || req.user._id)
        );
      }
      if (status) result = result.filter((inc) => inc.status === status);
      if (category) result = result.filter((inc) => inc.category === category);
      if (severity) result = result.filter((inc) => inc.severity === severity);

      return res.status(200).json({
        success: true,
        count: result.length,
        data: result,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single incident by ID
 * @route   GET /api/incidents/:id
 * @access  Private
 */
exports.getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      const incident = await Incident.findById(id)
        .populate('travelerId', 'name email phone')
        .populate('assignedProviderId', 'name phone providerDetails');

      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found.' });
      }

      return res.status(200).json({ success: true, data: incident });
    } catch {
      const found = memoryIncidents.find((i) => String(i._id) === String(id));
      if (!found) {
        return res.status(404).json({ success: false, message: 'Incident not found in memory store.' });
      }
      return res.status(200).json({ success: true, data: found });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update incident status with Lifecycle finite state validation
 * @route   PATCH /api/incidents/:id/status
 * @access  Private
 * @owner   Member 3 (Jayasundara)
 */
exports.updateIncidentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newStatus, notes, assignedProviderId, estimatedArrivalTimeMinutes } = req.body;

    if (!newStatus || !Object.values(INCIDENT_STATUS).includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target status. Permitted statuses: ${Object.values(INCIDENT_STATUS).join(', ')}`,
      });
    }

    let incident;
    try {
      incident = await Incident.findById(id);
    } catch {
      incident = memoryIncidents.find((i) => String(i._id) === String(id));
    }

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const currentStatus = incident.status;
    const validNextStates = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    // Enforce transition rules unless Admin override
    if (req.user.role !== 'admin' && !validNextStates.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Illegal transition: Cannot transition incident from '${currentStatus}' to '${newStatus}'. Permitted transitions: ${validNextStates.join(', ') || 'None (Terminal State)'}`,
        error: 'ILLEGAL_STATUS_TRANSITION',
      });
    }

    const updateFields = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (assignedProviderId) updateFields.assignedProviderId = assignedProviderId;
    if (estimatedArrivalTimeMinutes !== undefined) updateFields.estimatedArrivalTimeMinutes = estimatedArrivalTimeMinutes;

    try {
      const updated = await Incident.findByIdAndUpdate(id, updateFields, { new: true });
      await CaseLog.create({
        incidentId: id,
        updatedBy: req.user.id || req.user._id,
        updaterRole: req.user.role,
        previousStatus: currentStatus,
        newStatus,
        notes: notes || `Status updated to ${newStatus}`,
        timestamp: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: `Incident status successfully updated to ${newStatus}.`,
        data: updated,
      });
    } catch {
      // Memory mode update
      Object.assign(incident, updateFields);
      const newLog = {
        _id: '65log' + Math.random().toString(16).substring(2, 23),
        incidentId: id,
        updatedBy: req.user.id || req.user._id,
        updaterRole: req.user.role,
        previousStatus: currentStatus,
        newStatus,
        notes: notes || `Status updated to ${newStatus} (Memory Mode)`,
        timestamp: new Date(),
      };
      memoryCaseLogs.push(newLog);

      return res.status(200).json({
        success: true,
        message: `Incident status updated to ${newStatus} (Development Mode).`,
        data: incident,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get chronological case logs and lifecycle timeline for an incident
 * @route   GET /api/incidents/:id/history
 * @access  Private
 * @owner   Member 3 (Jayasundara)
 */
exports.getIncidentHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      const logs = await CaseLog.find({ incidentId: id })
        .sort({ timestamp: 1 })
        .populate('updatedBy', 'name role');

      return res.status(200).json({
        success: true,
        incidentId: id,
        count: logs.length,
        data: logs,
      });
    } catch {
      const logs = memoryCaseLogs.filter((l) => String(l.incidentId) === String(id));
      return res.status(200).json({
        success: true,
        incidentId: id,
        count: logs.length,
        data: logs,
      });
    }
  } catch (err) {
    next(err);
  }
};
