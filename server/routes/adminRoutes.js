const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getUsers,
  getAdminProviders,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All Admin routes strictly require admin role
router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/providers', getAdminProviders);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
