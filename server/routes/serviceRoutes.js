const express = require('express');
const router = express.Router();
const {
  getServices,
  getNearbyServices,
  getServiceById,
} = require('../controllers/serviceController');

router.get('/', getServices);
router.get('/nearby', getNearbyServices);
router.get('/:id', getServiceById);

module.exports = router;
