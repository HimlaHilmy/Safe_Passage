const EmergencyService = require('../models/EmergencyService');

// Seed sample emergency services across tourist hubs
const SEED_SERVICES = [
  {
    _id: '65s000000000000000000001',
    name: 'National Hospital Emergency Trauma Unit',
    type: 'Hospital & Medical',
    address: 'Regent Street, Colombo 10',
    location: {
      type: 'Point',
      coordinates: [79.8653, 6.9189],
    },
    contactInfo: {
      phone: '+94 11 269 1111',
      emergencyHotline: '1990',
      email: 'emergency@nationalhospital.health.gov',
      operatingHours: '24/7 Continuous Trauma Care',
    },
    servicesOffered: ['Trauma Surgery', 'ICU', 'Cardiac Unit', 'Ambulance Fleet'],
    verificationStatus: 'verified',
    rating: 4.9,
  },
  {
    _id: '65s000000000000000000002',
    name: 'Central Tourist Police Division',
    type: 'Police Station',
    address: 'Chatham Street, Fort, Colombo 01',
    location: {
      type: 'Point',
      coordinates: [79.8436, 6.9344],
    },
    contactInfo: {
      phone: '+94 11 242 1052',
      emergencyHotline: '119',
      email: 'touristpolice@police.lk',
      operatingHours: '24/7',
    },
    servicesOffered: ['Foreign National Support', 'Incident Reporting', 'Rapid Patrol'],
    verificationStatus: 'verified',
    rating: 4.8,
  },
  {
    _id: '65s000000000000000000003',
    name: 'Metropolitan Fire & Rescue Command',
    type: 'Fire & Rescue',
    address: 'T.B. Jayah Mawatha, Colombo 10',
    location: {
      type: 'Point',
      coordinates: [79.8631, 6.9242],
    },
    contactInfo: {
      phone: '+94 11 242 2222',
      emergencyHotline: '110',
      email: 'fire@colombo.gov',
      operatingHours: '24/7',
    },
    servicesOffered: ['Fire Suppression', 'Chemical Spill Containment', 'Heavy Vehicle Extrication'],
    verificationStatus: 'verified',
    rating: 4.7,
  },
  {
    _id: '65s000000000000000000004',
    name: 'Coast Guard & Maritime Rescue Center',
    type: 'Coast Guard & Marine',
    address: 'Harbour Gate 4, Marine Drive',
    location: {
      type: 'Point',
      coordinates: [79.8492, 6.9421],
    },
    contactInfo: {
      phone: '+94 11 244 1189',
      emergencyHotline: '1989',
      email: 'rescue@coastguard.gov',
      operatingHours: '24/7 Offshore Radar & Patrol',
    },
    servicesOffered: ['Sea Rescue', 'Diving Ops', 'Vessel Towing'],
    verificationStatus: 'verified',
    rating: 4.9,
  },
  {
    _id: '65s000000000000000000005',
    name: 'Apex Highway Towing & 24/7 Road Rescue',
    type: 'Roadside & Towing',
    address: 'Southern Expressway Interchange, Kottawa',
    location: {
      type: 'Point',
      coordinates: [79.9574, 6.8402],
    },
    contactInfo: {
      phone: '+94 11 789 4500',
      emergencyHotline: '1969',
      email: 'dispatch@apextowing.lk',
      operatingHours: '24/7',
    },
    servicesOffered: ['Flatbed Towing', 'Battery Jumpstart', 'Fuel Delivery', 'Winching'],
    verificationStatus: 'verified',
    rating: 4.6,
  },
  {
    _id: '65s000000000000000000006',
    name: 'Kandy General Teaching Hospital',
    type: 'Hospital & Medical',
    address: 'William Gopallawa Mawatha, Kandy',
    location: {
      type: 'Point',
      coordinates: [80.6350, 7.2880],
    },
    contactInfo: {
      phone: '+94 81 222 2261',
      emergencyHotline: '1990',
      email: 'emergency@kandyhospital.health.gov',
      operatingHours: '24/7',
    },
    servicesOffered: ['Emergency Surgery', 'Antivenom Bank', 'Pediatric Emergency'],
    verificationStatus: 'verified',
    rating: 4.8,
  },
];

// Haversine distance formula in meters
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * @desc    Get all emergency services
 * @route   GET /api/services
 * @access  Public
 * @owner   Member 2 (Samindika)
 */
exports.getServices = async (req, res, next) => {
  try {
    const { type, verified } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (verified) filter.verificationStatus = verified;

    try {
      const services = await EmergencyService.find(filter);
      if (services && services.length > 0) {
        return res.status(200).json({ success: true, count: services.length, data: services });
      }
    } catch {
      // Fallback
    }

    let results = SEED_SERVICES;
    if (type) results = results.filter((s) => s.type === type);
    if (verified) results = results.filter((s) => s.verificationStatus === verified);

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Find emergency services near given coordinates (2dsphere geospatial)
 * @route   GET /api/services/nearby?lng=...&lat=...&radius=...&type=...
 * @access  Public
 * @owner   Member 2 (Samindika)
 */
exports.getNearbyServices = async (req, res, next) => {
  try {
    const { lng, lat, radius = 50000, type } = req.query; // radius in meters, default 50km

    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        message: 'Longitude (lng) and Latitude (lat) query parameters are required for geospatial discovery.',
      });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    const maxDistanceMeters = parseInt(radius, 10);

    try {
      const query = {
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistanceMeters,
          },
        },
      };

      if (type) {
        query.type = type;
      }

      const services = await EmergencyService.find(query);
      if (services && services.length > 0) {
        return res.status(200).json({
          success: true,
          count: services.length,
          queryCenter: [longitude, latitude],
          radiusMeters: maxDistanceMeters,
          data: services,
        });
      }
    } catch {
      // Fallback calculation using Haversine
    }

    let nearby = SEED_SERVICES.map((s) => {
      const [sLng, sLat] = s.location.coordinates;
      const distance = calculateDistanceMeters(latitude, longitude, sLat, sLng);
      return {
        ...s,
        distanceMeters: Math.round(distance),
        distanceKm: (distance / 1000).toFixed(1),
      };
    }).filter((s) => s.distanceMeters <= maxDistanceMeters);

    if (type) {
      nearby = nearby.filter((s) => s.type === type);
    }

    nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);

    return res.status(200).json({
      success: true,
      count: nearby.length,
      queryCenter: [longitude, latitude],
      radiusMeters: maxDistanceMeters,
      data: nearby,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      const service = await EmergencyService.findById(id);
      if (service) return res.status(200).json({ success: true, data: service });
    } catch {
      // Fallback
    }

    const found = SEED_SERVICES.find((s) => String(s._id) === String(id));
    if (!found) {
      return res.status(404).json({ success: false, message: 'Emergency service not found.' });
    }
    return res.status(200).json({ success: true, data: found });
  } catch (err) {
    next(err);
  }
};
