const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAdminIncidents,
  getAdminIncidentById,
  updateAdminIncident,
  getUsers,
  updateUserStatus,
  getAdminProviders,
  verifyProvider,
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  getAuditLogs,
  exportReportCSV,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All Admin routes strictly require JWT authentication and 'admin' role
router.use(protect, authorize('admin'));

// Analytics & Reports
router.get('/analytics', getAnalytics);
router.get('/export/csv', exportReportCSV);

// Incident Management
router.get('/incidents', getAdminIncidents);
router.get('/incidents/:id', getAdminIncidentById);
router.patch('/incidents/:id', updateAdminIncident);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Provider Management & Verifications
router.get('/providers', getAdminProviders);
router.patch('/providers/:id/verify', verifyProvider);

// Emergency Services Directory Management
router.get('/services', getAdminServices);
router.post('/services', createAdminService);
router.patch('/services/:id', updateAdminService);
router.delete('/services/:id', deleteAdminService);

// System Audit Logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
