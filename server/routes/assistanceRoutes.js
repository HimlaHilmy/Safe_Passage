const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  respondToRequest,
  updateJobStatus,
  getProviderStats,
} = require('../controllers/assistanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats/summary', authorize('provider', 'admin'), getProviderStats);

router.route('/')
  .post(createRequest)
  .get(getRequests);

router.route('/:id')
  .get(getRequestById);

router.patch('/:id/respond', authorize('provider', 'admin'), respondToRequest);
router.patch('/:id/status', authorize('provider', 'admin'), updateJobStatus);

module.exports = router;
