const AssistanceRequest = require('../models/AssistanceRequest');
const { Incident, INCIDENT_STATUS } = require('../models/Incident');

let memoryRequests = [
  {
    _id: '65r000000000000000000001',
    incidentId: '65f000000000000000000010',
    travelerId: '65e000000000000000000001',
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
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    _id: '65r000000000000000000002',
    incidentId: '65f000000000000000000011',
    travelerId: '65e000000000000000000001',
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
    createdAt: new Date(Date.now() - 5400000),
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

    if (!incidentId || !serviceType || !location) {
      return res.status(400).json({
        success: false,
        message: 'incidentId, serviceType, and location are required.',
      });
    }

    const newReq = {
      incidentId,
      travelerId: req.user.id || req.user._id,
      providerId: providerId || null,
      serviceType,
      location,
      status: 'Pending',
      dispatchNotes: dispatchNotes || '',
    };

    try {
      const created = await AssistanceRequest.create(newReq);
      return res.status(201).json({ success: true, data: created });
    } catch {
      const mockReq = {
        _id: '65r' + Math.random().toString(16).substring(2, 23),
        ...newReq,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryRequests.unshift(mockReq);
      return res.status(201).json({ success: true, data: mockReq });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get assistance requests (filtered for current provider or traveler)
 * @route   GET /api/assistance-requests
 * @access  Private
 */
exports.getRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (req.user.role === 'provider') {
      // Return jobs assigned to this provider or pending requests matching provider's services
      filter.$or = [
        { providerId: req.user.id || req.user._id },
        { status: 'Pending' },
      ];
    } else if (req.user.role === 'traveler') {
      filter.travelerId = req.user.id || req.user._id;
    }

    if (status) filter.status = status;

    try {
      const requests = await AssistanceRequest.find(filter)
        .sort({ createdAt: -1 })
        .populate('incidentId')
        .populate('travelerId', 'name phone email')
        .populate('providerId', 'name phone providerDetails');

      return res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch {
      let results = memoryRequests;
      if (status) results = results.filter((r) => r.status === status);
      return res.status(200).json({ success: true, count: results.length, data: results });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get assistance request by ID
 * @route   GET /api/assistance-requests/:id
 * @access  Private
 */
exports.getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      const request = await AssistanceRequest.findById(id)
        .populate('incidentId')
        .populate('travelerId', 'name phone email')
        .populate('providerId', 'name phone providerDetails');

      if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
      return res.status(200).json({ success: true, data: request });
    } catch {
      const found = memoryRequests.find((r) => String(r._id) === String(id));
      if (!found) return res.status(404).json({ success: false, message: 'Request not found in memory.' });
      return res.status(200).json({ success: true, data: found });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Provider responds to incoming assistance request (Accept or Decline)
 * @route   PATCH /api/assistance-requests/:id/respond
 * @access  Private (Provider only)
 */
exports.respondToRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'accept' or 'decline'.",
      });
    }

    const providerId = req.user.id || req.user._id;

    try {
      const newStatus = action === 'accept' ? 'Accepted' : 'Declined';
      const updated = await AssistanceRequest.findByIdAndUpdate(
        id,
        {
          status: newStatus,
          providerId: action === 'accept' ? providerId : null,
          acceptedAt: action === 'accept' ? new Date() : null,
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: `Request ${action}ed successfully.`,
        data: updated,
      });
    } catch {
      const found = memoryRequests.find((r) => String(r._id) === String(id));
      if (found) {
        found.status = action === 'accept' ? 'Accepted' : 'Declined';
        found.providerId = action === 'accept' ? providerId : null;
        found.acceptedAt = action === 'accept' ? new Date() : null;
      }
      return res.status(200).json({
        success: true,
        message: `Request ${action}ed (Memory Mode).`,
        data: found,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update active assistance job status (En Route, On Scene, Completed)
 * @route   PATCH /api/assistance-requests/:id/status
 * @access  Private (Provider / Admin)
 */
exports.updateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowed = ['Accepted', 'En Route', 'On Scene', 'Completed', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid job status. Permitted: ${allowed.join(', ')}`,
      });
    }

    const updateFields = { status };
    if (notes) updateFields.dispatchNotes = notes;
    if (status === 'Completed') updateFields.completedAt = new Date();

    try {
      const updated = await AssistanceRequest.findByIdAndUpdate(id, updateFields, { new: true });
      return res.status(200).json({ success: true, data: updated });
    } catch {
      const found = memoryRequests.find((r) => String(r._id) === String(id));
      if (found) {
        Object.assign(found, updateFields);
      }
      return res.status(200).json({ success: true, data: found });
    }
  } catch (err) {
    next(err);
  }
};
