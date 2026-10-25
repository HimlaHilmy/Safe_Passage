const express = require('express');
const router = express.Router();
const {
  getProviders,
  getProviderMe,
  updateProviderMe,
} = require('../controllers/providerController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getProviders);
router.get('/me', protect, authorize('provider', 'admin'), getProviderMe);
router.patch('/me', protect, authorize('provider', 'admin'), updateProviderMe);

module.exports = router;
