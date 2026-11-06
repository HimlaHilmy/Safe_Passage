const mongoose = require('mongoose');
const { Incident, INCIDENT_STATUS } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');
const AssistanceRequest = require('../models/AssistanceRequest');
const {
  validateTransition,
  formatIncidentReference,
  broadcastTransition,
} = require('../services/lifecycleService');
const { isDbConnected } = require('../config/db');

/**
 * @desc    Create new emergency incident
 * @route   POST /api/incidents
 * @access  Private (Traveler / Admin)
 * @owner   Member 1 (Dulanjani) / Member 3 (Jayasundara)
 */
exports.createIncident = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Incident cannot be saved to MongoDB.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

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

    // Generate unique human-readable reference number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `SP-REF-${dateStr.slice(2)}-${randomSuffix}`;

    const chosenSeverity = ['Critical', 'High', 'Medium', 'Low'].includes(severity) ? severity : 'Medium';
    const parsedIncidentDate = incidentDate ? new Date(incidentDate) : new Date();
    const rawCoords = location && location.coordinates ? location.coordinates : [79.8612, 6.9271];
    const lng = Array.isArray(rawCoords) ? Number(rawCoords[0]) || 79.8612 : 79.8612;
    const lat = Array.isArray(rawCoords) ? Number(rawCoords[1]) || 6.9271 : 6.9271;

    // Sanitize media items
    const sanitizedMedia = Array.isArray(media)
      ? media
          .map((item) => {
            if (typeof item === 'string') {
              return { url: item, type: 'image', caption: '', uploadedAt: new Date() };
            }
            if (item && item.url) {
              return {
                url: item.url,
                type: item.type || 'image',
                caption: item.caption || '',
                uploadedAt: item.uploadedAt || new Date(),
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];

    const newIncidentData = {
      incidentReference: reference,
      referenceNumber: reference,
      travelerId: req.user.id || req.user._id,
      category,
      title: title.trim(),
      description: description.trim(),
      severity: chosenSeverity,
      incidentDate: parsedIncidentDate,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        address: location && location.address ? location.address.trim() : 'Location pinned via map',
        landmark: location && location.landmark ? location.landmark.trim() : '',
      },
      media: sanitizedMedia,
      status: INCIDENT_STATUS.SUBMITTED,
    };

    console.log(`[Incident Storage] Saving incident to MongoDB (${mongoose.connection.name}). Ref: ${reference}`);
    const incident = await Incident.create(newIncidentData);
    await incident.populate('travelerId', 'name email phone');

    // Create initial case history log in MongoDB
    await CaseLog.create({
      incidentId: incident._id,
      updatedBy: req.user.id || req.user._id,
      updaterRole: req.user.role || 'traveler',
      previousStatus: 'None',
      newStatus: INCIDENT_STATUS.SUBMITTED,
      notes: `Emergency reported: ${title.trim()} (${category})`,
      timestamp: new Date(),
    });

    console.log(`[Incident Storage] Successfully saved Incident ID: ${incident._id} to MongoDB.`);

    // Real-time broadcasts to Admin Dashboard and other roles via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('role_admin').emit('new_incident_alert', incident);
      io.to('role_admin').emit('new_incident', incident);
      io.to('role_provider').emit('new_incident_alert', incident);
      io.to('role_traveler').emit('new_incident_alert', incident);
      io.emit('new_incident_alert', incident);
      io.emit('incident_updated', {
        incidentId: incident._id,
        newStatus: INCIDENT_STATUS.SUBMITTED,
        incident,
      });
      broadcastTransition(io, incident._id, {
        incidentId: incident._id,
        previousStatus: 'None',
        newStatus: INCIDENT_STATUS.SUBMITTED,
        notes: `New emergency incident created by traveler (${req.user.name || 'Traveler'}).`,
        updatedBy: { id: req.user.id || req.user._id, role: req.user.role, name: req.user.name },
        timestamp: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Emergency incident reported successfully.',
      data: incident,
    });
  } catch (err) {
    console.error('[Incident Creation Failed]', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Mongoose schema validation failed.',
        error: err.message,
      });
    }
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
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Cannot fetch incidents from MongoDB.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

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

    const incidents = await Incident.find(filter)
      .sort({ createdAt: -1 })
      .populate('travelerId', 'name email phone')
      .populate('assignedProviderId', 'name phone providerDetails');

    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (err) {
    console.error('[Get Incidents DB Error]', err.message);
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
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid incident ID format: '${id}'.`,
        error: 'INVALID_ID',
      });
    }

    const incident = await Incident.findById(id)
      .populate('travelerId', 'name email phone')
      .populate('assignedProviderId', 'name phone providerDetails');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found in MongoDB.',
      });
    }

    // Role-based visibility check: traveler can only access their own incident
    if (
      req.user.role === 'traveler' &&
      String(incident.travelerId?._id || incident.travelerId) !== String(req.user.id || req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this incident.',
        error: 'FORBIDDEN',
      });
    }

    return res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (err) {
    console.error('[Get Incident Detail DB Error]', err.message);
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
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable. Cannot update incident in MongoDB.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { id } = req.params;
    const { newStatus, notes, assignedProviderId, estimatedArrivalTimeMinutes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid incident ID format: '${id}'.`,
        error: 'INVALID_ID',
      });
    }

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found in MongoDB.',
      });
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
    if (assignedProviderId !== undefined) updateFields.assignedProviderId = assignedProviderId;
    if (estimatedArrivalTimeMinutes !== undefined) {
      updateFields.estimatedArrivalTimeMinutes = estimatedArrivalTimeMinutes;
    }
    if (notes) {
      updateFields.notes = notes;
    }

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

    console.log(`[Incident Lifecycle] Incident ${id} transitioned: ${currentStatus} -> ${newStatus}`);

    // Synchronize AssistanceRequest if assignedProviderId is present
    if (assignedProviderId) {
      try {
        let assistReq = await AssistanceRequest.findOne({ incidentId: id });
        const timelineEntry = {
          status: 'Pending',
          timestamp: new Date(),
          notes: notes || `Assigned to service provider. Case ref: ${updated.incidentReference || id}`,
          updatedBy: req.user.id || req.user._id,
        };

        if (assistReq) {
          assistReq.providerId = assignedProviderId;
          assistReq.status = 'Pending';
          if (notes) assistReq.dispatchNotes = notes;
          assistReq.timeline = assistReq.timeline || [];
          assistReq.timeline.push(timelineEntry);
          await assistReq.save();
        } else {
          assistReq = await AssistanceRequest.create({
            incidentId: id,
            travelerId: updated.travelerId?._id || updated.travelerId,
            providerId: assignedProviderId,
            serviceType: updated.category || 'Emergency Assistance',
            location: {
              type: 'Point',
              coordinates: updated.location?.coordinates || [79.8612, 6.9271],
              address: updated.location?.address || '',
            },
            status: 'Pending',
            dispatchNotes: notes || `Assigned to provider. Incident: ${updated.title}`,
            timeline: [timelineEntry],
          });
        }

        const populatedAssist = await AssistanceRequest.findById(assistReq._id)
          .populate('incidentId')
          .populate('travelerId', 'name phone email')
          .populate('providerId', 'name phone providerDetails')
          .lean();

        const io = req.app.get('io');
        if (io) {
          io.to(`user_${assignedProviderId}`).emit('new_assistance_request', populatedAssist);
          io.to('role_provider').emit('new_assistance_request', populatedAssist);
          io.to('role_provider').emit('assistance_status_changed', populatedAssist);
        }
      } catch (assistErr) {
        console.warn('[Incident Provider Sync Warning]:', assistErr.message);
      }
    }

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
  } catch (err) {
    console.error('[Update Incident Status DB Error]', err.message);
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
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid incident ID format: '${id}'.`,
        error: 'INVALID_ID',
      });
    }

    const logs = await CaseLog.find({ incidentId: id })
      .sort({ timestamp: 1 })
      .populate('updatedBy', 'name role');

    return res.status(200).json({
      success: true,
      incidentId: id,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    console.error('[Get Incident History DB Error]', err.message);
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
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable.',
        error: 'DATABASE_UNAVAILABLE',
      });
    }

    const { id } = req.params;
    const { notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Case note content is required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid incident ID format: '${id}'.`,
        error: 'INVALID_ID',
      });
    }

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found in MongoDB.',
      });
    }

    const currentStatus = incident.status;
    const createdLog = await CaseLog.create({
      incidentId: id,
      updatedBy: req.user.id || req.user._id,
      updaterRole: req.user.role || 'system',
      previousStatus: currentStatus,
      newStatus: currentStatus,
      notes: notes.trim(),
      timestamp: new Date(),
    });

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
    console.error('[Add Case Note DB Error]', err.message);
    next(err);
  }
};
