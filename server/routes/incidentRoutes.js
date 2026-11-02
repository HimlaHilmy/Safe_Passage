const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  getIncidentHistory,
  addCaseNote,
} = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All incident endpoints require auth

router.route('/')
  .post(createIncident)
  .get(getIncidents);

router.route('/:id')
  .get(getIncidentById);

router.patch('/:id/status', updateIncidentStatus);
router.get('/:id/history', getIncidentHistory);
router.post('/:id/notes', addCaseNote);

module.exports = router;
