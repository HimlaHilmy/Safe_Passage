const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  respondToRequest,
  updateJobStatus,
} = require('../controllers/assistanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(createRequest)
  .get(getRequests);

router.route('/:id')
  .get(getRequestById);

router.patch('/:id/respond', authorize('provider', 'admin'), respondToRequest);
router.patch('/:id/status', authorize('provider', 'admin'), updateJobStatus);

module.exports = router;
