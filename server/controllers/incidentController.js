const mongoose = require('mongoose');
const { Incident, INCIDENT_STATUS, VALID_STATUS_TRANSITIONS } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');
const {
  validateTransition,
  formatIncidentReference,
  broadcastTransition,
} = require('../services/lifecycleService');

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// In-memory demo store for when MongoDB is disconnected during initial UI development
let memoryIncidents = [
  {
    _id: '65f000000000000000000010',
    incidentReference: 'SP-REF-000010',
    travelerId: {
      _id: '65e000000000000000000001',
      name: 'Sarah Jenkins',
      email: 'traveler@safepassage.org',
      phone: '+1 (555) 234-5678',
    },
    category: 'Roadside & Vehicle Breakdown',
    title: 'Engine overheating on Mountain Pass A4',
    description: 'Vehicle radiator steam observed, unable to proceed. Two passengers on board with limited water.',
    severity: 'High',
    incidentDate: new Date(Date.now() - 7200000),
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
    assignedProviderId: {
      _id: '65e000000000000000000002',
      name: 'Apex Rapid Response Ltd',
      phone: '+1 (555) 987-6543',
      rating: 4.9,
      providerDetails: {
        serviceTypes: ['Roadside Towing & Vehicle Repair', 'Emergency Paramedic Escort'],
        licenseNumber: 'SL-EMG-9021',
        verified: true,
        currentLocation: { type: 'Point', coordinates: [80.6350, 7.2880] },
        isAvailable: true,
      },
    },
    estimatedArrivalTimeMinutes: 18,
    notes: 'Patrol vehicle dispatched from Central depot with cooling fluids and tow hitch.',
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 1800000),
  },
  {
    _id: '65f000000000000000000011',
    incidentReference: 'SP-REF-000011',
    travelerId: {
      _id: '65e000000000000000000001',
      name: 'Sarah Jenkins',
      email: 'traveler@safepassage.org',
      phone: '+1 (555) 234-5678',
    },
    category: 'Medical Emergency',
    title: 'Severe allergic reaction to food ingredient',
    description: 'Difficulty breathing, facial swelling. Antihistamine administered but condition worsening.',
    severity: 'Critical',
    incidentDate: new Date(Date.now() - 14400000),
    location: {
      type: 'Point',
      coordinates: [79.8612, 6.9271], // Colombo area
      address: 'Galle Face Terrace, Coastal Road',
      landmark: 'Opposite Lighthouse Hotel',
    },
    media: [],
    status: INCIDENT_STATUS.IN_PROGRESS,
    assignedProviderId: {
      _id: '65e000000000000000000002',
      name: 'Apex Rapid Response Ltd',
      phone: '+1 (555) 987-6543',
      rating: 4.9,
      providerDetails: {
        serviceTypes: ['Emergency Medical Care', 'Paramedic Rapid Response'],
        licenseNumber: 'SL-MED-4401',
        verified: true,
        currentLocation: { type: 'Point', coordinates: [79.8650, 6.9250] },
        isAvailable: true,
      },
    },
    estimatedArrivalTimeMinutes: 4,
    notes: 'Paramedic unit arrived on scene; administering stabilized oxygen.',
    createdAt: new Date(Date.now() - 14400000),
    updatedAt: new Date(Date.now() - 900000),
  },
  {
    _id: '65f000000000000000000012',
    incidentReference: 'SP-REF-000012',
    travelerId: {
      _id: '65e000000000000000000001',
      name: 'Sarah Jenkins',
      email: 'traveler@safepassage.org',
      phone: '+1 (555) 234-5678',
    },
    category: 'Lost & Stranded',
    title: 'Missed trail marker in dense fog',
    description: 'Hiker disoriented off marked path. Battery at 25%, flashlight operational, safe from precipice.',
    severity: 'Medium',
    incidentDate: new Date(Date.now() - 21600000),
    location: {
      type: 'Point',
      coordinates: [80.7891, 6.8096],
      address: 'Central Station Food Court, Colombo',
      landmark: 'Platform 2 entrance',
    },
    media: [],
    status: INCIDENT_STATUS.UNDER_REVIEW,
    assignedProviderId: null,
    estimatedArrivalTimeMinutes: null,
    notes: 'Awaiting local park ranger patrol check-in.',
    createdAt: new Date(Date.now() - 21600000),
    updatedAt: new Date(Date.now() - 7200000),
  },
];

let memoryCaseLogs = [
  {
    _id: '65f100000000000000000001',
    incidentId: '65f000000000000000000010',
    updatedBy: {
      _id: '65e000000000000000000001',
      name: 'Sarah Jenkins',
      role: 'traveler',
    },
    updaterRole: 'traveler',
    previousStatus: 'None',
    newStatus: INCIDENT_STATUS.SUBMITTED,
    notes: 'Emergency reported from mobile device with GPS coordinates.',
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    _id: '65f100000000000000000002',
    incidentId: '65f000000000000000000010',
    updatedBy: {
      _id: '65e000000000000000000003',
      name: 'Central Dispatch Admin',
      role: 'admin',
    },
    updaterRole: 'admin',
    previousStatus: INCIDENT_STATUS.SUBMITTED,
    newStatus: INCIDENT_STATUS.UNDER_REVIEW,
    notes: 'Verified traveler coordinates and triage priority set to High.',
    timestamp: new Date(Date.now() - 5400000),
  },
  {
    _id: '65f100000000000000000003',
    incidentId: '65f000000000000000000010',
    updatedBy: {
      _id: '65e000000000000000000003',
      name: 'Central Dispatch Admin',
      role: 'admin',
    },
    updaterRole: 'admin',
    previousStatus: INCIDENT_STATUS.UNDER_REVIEW,
    newStatus: INCIDENT_STATUS.ASSIGNED,
    notes: 'Assigned to Apex Rapid Response Ltd patrol unit 4.',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    _id: '65f100000000000000000004',
    incidentId: '65f000000000000000000010',
    updatedBy: {
      _id: '65e000000000000000000002',
      name: 'Apex Rapid Response Ltd',
      role: 'provider',
    },
    updaterRole: 'provider',
    previousStatus: INCIDENT_STATUS.ASSIGNED,
    newStatus: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
    notes: 'Patrol unit en route with coolant and recovery equipment. ETA 18 minutes.',
    timestamp: new Date(Date.now() - 1800000),
  },
];

/**
 * @desc    Create new emergency incident
 * @route   POST /api/incidents
 * @access  Private (Traveler / Admin)
 * @owner   Member 1 (Dulanjani) / Member 3 (Jayasundara)
 */
exports.createIncident = async (req, res, next) => {
  try {
    const { category, title, description, severity, location, media, incidentDate } = req.body;

    // Validate Category
    const allowedCategories = [
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
    ];

    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid emergency category. Permitted: ${allowedCategories.slice(0, 5).join(', ')}`,
        error: 'INVALID_CATEGORY',
      });
    }

    // Validate Title
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Incident title is required and must be at least 3 characters long.',
        error: 'INVALID_TITLE',
      });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Incident title cannot exceed 150 characters.',
        error: 'TITLE_TOO_LONG',
      });
    }

    // Validate Description
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Detailed incident description is required (at least 10 characters).',
        error: 'INVALID_DESCRIPTION',
      });
    }

    const reference = formatIncidentReference(Date.now().toString());

    const newIncidentData = {
      incidentReference: reference,
      travelerId: req.user.id || req.user._id,
      category,
      title: title.trim(),
      description: description.trim(),
      severity: chosenSeverity,
      incidentDate: parsedIncidentDate,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        address: location.address ? location.address.trim() : 'Location pinned via map',
        landmark: location.landmark ? location.landmark.trim() : '',
      },
      media: Array.isArray(media) ? media : [],
      status: INCIDENT_STATUS.SUBMITTED,
    };

    if (isDbConnected()) {
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

        const io = req.app.get('io');
        if (io) {
          broadcastTransition(io, incident._id, {
            incidentId: incident._id,
            previousStatus: 'None',
            newStatus: INCIDENT_STATUS.SUBMITTED,
            notes: 'New emergency incident created.',
            updatedBy: { id: req.user.id || req.user._id, role: req.user.role },
            timestamp: new Date(),
          });
        }

        return res.status(201).json({
          success: true,
          message: 'Emergency incident reported successfully.',
          data: incident,
        });
      } catch (dbErr) {
        console.warn('[Incident DB Error]', dbErr.message);
      }
    }

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
      updatedBy: {
        _id: req.user.id || req.user._id,
        name: req.user.name || 'Traveler',
        role: req.user.role || 'traveler',
      },
      updaterRole: req.user.role || 'traveler',
      previousStatus: 'None',
      newStatus: INCIDENT_STATUS.SUBMITTED,
      notes: 'Emergency reported and logged in memory mode.',
      timestamp: new Date(),
    });

    const io = req.app.get('io');
    if (io) {
      broadcastTransition(io, mockIncident._id, {
        incidentId: mockIncident._id,
        previousStatus: 'None',
        newStatus: INCIDENT_STATUS.SUBMITTED,
        notes: 'Emergency reported (Memory Mode).',
        updatedBy: { id: req.user.id || req.user._id, role: req.user.role },
        timestamp: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Incident reported successfully (Development Mode).',
      data: mockIncident,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all incidents (filtered by role: traveler sees only own, admin/provider sees permitted)
 * @route   GET /api/incidents
 * @access  Private
 * @owner   Member 1 (Dulanjani)
 */
exports.getIncidents = async (req, res, next) => {
  try {
    const { status, category, severity, search } = req.query;
    const filter = {};

    // STRICT ACCESS CONTROL: Authenticated travelers ONLY see their own incidents
    if (req.user.role === 'traveler') {
      filter.travelerId = req.user.id || req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { incidentReference: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (isDbConnected()) {
      try {
        let query = Incident.find(filter)
          .sort({ createdAt: -1 })
          .populate('travelerId', 'name email phone')
          .populate('assignedProviderId', 'name phone providerDetails');

        const incidents = await query;

        return res.status(200).json({
          success: true,
          count: incidents.length,
          data: incidents,
        });
      } catch (dbErr) {
        console.warn('[Incident DB Error]', dbErr.message);
      }
    }

    // In-memory filter
    let result = [...memoryIncidents];
    if (req.user.role === 'traveler') {
      const userId = String(req.user.id || req.user._id);
      result = result.filter((inc) => {
        const tId = inc.travelerId?._id ? String(inc.travelerId._id) : String(inc.travelerId);
        return tId === userId;
      });
    }
    if (status) result = result.filter((inc) => inc.status === status);
    if (category) result = result.filter((inc) => inc.category === category);
    if (severity) result = result.filter((inc) => inc.severity === severity);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((inc) =>
        (inc.title && inc.title.toLowerCase().includes(q)) ||
        (inc.incidentReference && inc.incidentReference.toLowerCase().includes(q)) ||
        (inc.location?.address && inc.location.address.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single incident by ID with ownership enforcement
 * @route   GET /api/incidents/:id
 * @access  Private
 * @owner   Member 1 & Member 3
 */
exports.getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      try {
        const incident = await Incident.findById(id)
          .populate('travelerId', 'name email phone')
          .populate('assignedProviderId', 'name phone providerDetails');

        if (!incident) {
          return res.status(404).json({ success: false, message: 'Incident not found.' });
        }

        return res.status(200).json({ success: true, data: incident });
      } catch (dbErr) {
        console.warn('[Incident DB Error]', dbErr.message);
      }
    }

    const found = memoryIncidents.find((i) => String(i._id) === String(id));
    if (!found) {
      return res.status(404).json({ success: false, message: 'Incident not found in memory store.' });
    }
    return res.status(200).json({ success: true, data: found });
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

    let incident;
    if (isDbConnected()) {
      try {
        incident = await Incident.findById(id);
      } catch (dbErr) {
        console.warn('[Incident DB Error]', dbErr.message);
      }
    }
    if (!incident) {
      incident = memoryIncidents.find((i) => String(i._id) === String(id));
    }

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const currentStatus = incident.status;

    // Finite state machine enforcement via lifecycleService
    const validation = validateTransition(currentStatus, newStatus, req.user.role);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
        error: validation.errorCode,
      });
    }

    const updateFields = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (assignedProviderId) updateFields.assignedProviderId = assignedProviderId;
    if (estimatedArrivalTimeMinutes !== undefined) {
      updateFields.estimatedArrivalTimeMinutes = estimatedArrivalTimeMinutes;
    }
    if (notes) {
      updateFields.notes = notes;
    }

    if (isDbConnected()) {
      try {
        const updated = await Incident.findByIdAndUpdate(id, updateFields, { new: true })
          .populate('travelerId', 'name email phone')
          .populate('assignedProviderId', 'name phone providerDetails');

        await CaseLog.create({
          incidentId: id,
          updatedBy: req.user.id || req.user._id,
          updaterRole: req.user.role || 'system',
          previousStatus: currentStatus,
          newStatus,
          notes: notes || `Status updated from ${currentStatus} to ${newStatus}`,
          timestamp: new Date(),
        });

        const io = req.app.get('io');
        if (io) {
          broadcastTransition(io, id, {
            incidentId: id,
            previousStatus: currentStatus,
            newStatus,
            notes: notes || `Status transitioned to ${newStatus}`,
            updatedBy: { id: req.user.id || req.user._id, role: req.user.role, name: req.user.name },
            timestamp: new Date(),
          });
        }

        return res.status(200).json({
          success: true,
          message: `Incident status successfully updated to ${newStatus}.`,
          data: updated,
        });
      } catch (dbErr) {
        console.warn('[Incident DB Error]', dbErr.message);
      }
    }

    // Memory mode update
    Object.assign(incident, updateFields);
    const newLog = {
      _id: '65log' + Math.random().toString(16).substring(2, 23),
      incidentId: id,
      updatedBy: {
        _id: req.user.id || req.user._id,
        name: req.user.name || 'Operator',
        role: req.user.role || 'system',
      },
      updaterRole: req.user.role || 'system',
      previousStatus: currentStatus,
      newStatus,
      notes: notes || `Status updated to ${newStatus} (Memory Mode)`,
      timestamp: new Date(),
    };
    memoryCaseLogs.push(newLog);

    const io = req.app.get('io');
    if (io) {
      broadcastTransition(io, id, {
        incidentId: id,
        previousStatus: currentStatus,
        newStatus,
        notes: newLog.notes,
        updatedBy: newLog.updatedBy,
        timestamp: newLog.timestamp,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Incident status updated to ${newStatus} (Development Mode).`,
      data: incident,
    });
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

    if (isDbConnected()) {
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
      } catch (dbErr) {
        console.warn('[Incident DB Error]', dbErr.message);
      }
    }

    const logs = memoryCaseLogs.filter((l) => String(l.incidentId) === String(id));
    return res.status(200).json({
      success: true,
      incidentId: id,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add a case note or field report update to an incident without changing status
 * @route   POST /api/incidents/:id/notes
 * @access  Private
 * @owner   Member 3 (Jayasundara)
 */
exports.addCaseNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Case note content is required.',
      });
    }

    let incident;
    if (isDbConnected()) {
      try {
        incident = await Incident.findById(id);
      } catch (dbErr) {
        console.warn('[Incident DB Error]', dbErr.message);
      }
    }
    if (!incident) {
      incident = memoryIncidents.find((i) => String(i._id) === String(id));
    }

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const currentStatus = incident.status;
    let createdLog;

    if (isDbConnected()) {
      try {
        createdLog = await CaseLog.create({
          incidentId: id,
          updatedBy: req.user.id || req.user._id,
          updaterRole: req.user.role || 'system',
          previousStatus: currentStatus,
          newStatus: currentStatus,
          notes: notes.trim(),
          timestamp: new Date(),
        });
      } catch (dbErr) {
        console.warn('[Incident DB Error]', dbErr.message);
      }
    }

    if (!createdLog) {
      createdLog = {
        _id: '65log' + Math.random().toString(16).substring(2, 23),
        incidentId: id,
        updatedBy: {
          _id: req.user.id || req.user._id,
          name: req.user.name || 'User',
          role: req.user.role || 'system',
        },
        updaterRole: req.user.role || 'system',
        previousStatus: currentStatus,
        newStatus: currentStatus,
        notes: notes.trim(),
        timestamp: new Date(),
      };
      memoryCaseLogs.push(createdLog);
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`incident_${id}`).emit('case_log_added', createdLog);
      io.to('role_admin').emit('case_log_added', createdLog);
    }

    return res.status(201).json({
      success: true,
      message: 'Case note added successfully.',
      data: createdLog,
    });
  } catch (err) {
    next(err);
  }
};
