const { Incident, INCIDENT_STATUS, VALID_STATUS_TRANSITIONS, generateIncidentReference } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');

// In-memory demo store for when MongoDB is disconnected during initial UI development
let memoryIncidents = [
  {
    _id: '65f000000000000000000010',
    incidentReference: 'INC-20261028-1001',
    referenceNumber: 'INC-20261028-1001',
    travelerId: '65e000000000000000000001',
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
    assignedProviderId: '65e000000000000000000002',
    estimatedArrivalTimeMinutes: 18,
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 1800000),
  },
  {
    _id: '65f000000000000000000011',
    incidentReference: 'INC-20261028-1002',
    referenceNumber: 'INC-20261028-1002',
    travelerId: '65e000000000000000000001',
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
    assignedProviderId: '65e000000000000000000002',
    estimatedArrivalTimeMinutes: 5,
    createdAt: new Date(Date.now() - 14400000),
    updatedAt: new Date(Date.now() - 900000),
  },
  {
    _id: '65f000000000000000000012',
    incidentReference: 'INC-20261028-1003',
    referenceNumber: 'INC-20261028-1003',
    travelerId: '65e000000000000000000001',
    category: 'Lost Passport or Documents',
    title: 'Backpack stolen with passport and visa documents',
    description: 'Stolen from restaurant table while ordering. Embassy contact needed immediately.',
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

    // Validate Location
    if (
      !location ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2 ||
      typeof location.coordinates[0] !== 'number' ||
      typeof location.coordinates[1] !== 'number' ||
      isNaN(location.coordinates[0]) ||
      isNaN(location.coordinates[1])
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid GeoJSON location coordinates [longitude, latitude] are required.',
        error: 'INVALID_COORDINATES',
      });
    }

    const [lng, lat] = location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of range. Longitude must be -180 to 180, and Latitude must be -90 to 90.',
        error: 'COORDINATES_OUT_OF_BOUNDS',
      });
    }

    // Validate Severity
    const allowedSeverities = ['Low', 'Medium', 'High', 'Critical'];
    const chosenSeverity = severity && allowedSeverities.includes(severity) ? severity : 'Medium';

    // Validate Date/Time
    let parsedIncidentDate = new Date();
    if (incidentDate) {
      const parsed = new Date(incidentDate);
      if (!isNaN(parsed.getTime())) {
        parsedIncidentDate = parsed;
      }
    }

    // Server-generated Reference Number
    const generatedReference = generateIncidentReference();

    const travelerId = req.user.id || req.user._id;

    const newIncidentData = {
      travelerId,
      incidentReference: generatedReference,
      referenceNumber: generatedReference,
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

    try {
      const incident = await Incident.create(newIncidentData);

      // Create initial case log in caselogs collection (Member 3 Lifecycle)
      try {
        await CaseLog.create({
          incidentId: incident._id,
          updatedBy: travelerId,
          updaterRole: req.user.role || 'traveler',
          previousStatus: 'None',
          newStatus: INCIDENT_STATUS.SUBMITTED,
          notes: 'Emergency incident reported by traveler.',
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.warn('[CaseLog Warning]:', logErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Emergency incident reported successfully.',
        data: incident,
      });
    } catch (dbErr) {
      console.warn('[Incident DB Fallback]:', dbErr.message);
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
        updatedBy: travelerId,
        updaterRole: req.user.role || 'traveler',
        previousStatus: 'None',
        newStatus: INCIDENT_STATUS.SUBMITTED,
        notes: 'Emergency reported and logged in memory mode.',
        timestamp: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Incident reported successfully.',
        data: mockIncident,
      });
    }
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
      // In-memory filter fallback
      let result = memoryIncidents;
      if (req.user.role === 'traveler') {
        const currentUserId = String(req.user.id || req.user._id);
        result = result.filter((inc) => String(inc.travelerId) === currentUserId);
      }
      if (status) result = result.filter((inc) => inc.status === status);
      if (category) result = result.filter((inc) => inc.category === category);
      if (severity) result = result.filter((inc) => inc.severity === severity);
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (inc) =>
            (inc.title && inc.title.toLowerCase().includes(q)) ||
            (inc.description && inc.description.toLowerCase().includes(q)) ||
            (inc.incidentReference && inc.incidentReference.toLowerCase().includes(q)) ||
            (inc.referenceNumber && inc.referenceNumber.toLowerCase().includes(q))
        );
      }

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
 * @desc    Get single incident by ID with ownership enforcement
 * @route   GET /api/incidents/:id
 * @access  Private
 * @owner   Member 1 & Member 3
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

      // STRICT ACCESS CONTROL: Travelers cannot view incidents belonging to others
      if (req.user.role === 'traveler') {
        const ownerId = incident.travelerId?._id
          ? String(incident.travelerId._id)
          : String(incident.travelerId);
        const currentUserId = String(req.user.id || req.user._id);

        if (ownerId !== currentUserId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You do not have permission to view incidents reported by other travelers.',
            error: 'FORBIDDEN_INCIDENT_ACCESS',
          });
        }
      }

      return res.status(200).json({ success: true, data: incident });
    } catch {
      const found = memoryIncidents.find((i) => String(i._id) === String(id));
      if (!found) {
        return res.status(404).json({ success: false, message: 'Incident not found.' });
      }

      // Memory mode access control
      if (req.user.role === 'traveler') {
        const ownerId = String(found.travelerId);
        const currentUserId = String(req.user.id || req.user._id);
        if (ownerId !== currentUserId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You do not have permission to view incidents reported by other travelers.',
            error: 'FORBIDDEN_INCIDENT_ACCESS',
          });
        }
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
