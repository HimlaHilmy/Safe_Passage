const mongoose = require('mongoose');
const EmergencyService = require('../models/EmergencyService');

const isDbReady = () => mongoose.connection && mongoose.connection.readyState === 1;

/**
 * Category alias mapping for flexible frontend and backend interoperability.
 * Supports both display labels ('Hospitals', 'Police Stations', etc.) and schema enum names.
 */
const CATEGORY_MAP = {
  hospitals: ['Hospital & Medical', 'Hospitals'],
  'hospital & medical': ['Hospital & Medical', 'Hospitals'],
  'police stations': ['Police Station', 'Police Stations'],
  'police station': ['Police Station', 'Police Stations'],
  embassies: ['Embassy & Consulate', 'Embassies'],
  'embassy & consulate': ['Embassy & Consulate', 'Embassies'],
  mechanics: ['Mechanic & Repair', 'Mechanics'],
  'mechanic & repair': ['Mechanic & Repair', 'Mechanics'],
  'towing services': ['Roadside & Towing', 'Towing Services'],
  'roadside & towing': ['Roadside & Towing', 'Towing Services'],
  'fire & rescue': ['Fire & Rescue'],
  'coast guard & marine': ['Coast Guard & Marine'],
};

/**
 * Verified & Demonstration Emergency Service Records
 * Official public facilities (Hospitals, Police, Embassies) use real-world coordinates and verified addresses.
 * Private services (Mechanics, Towing) are verified demonstration partner records clearly marked.
 */
const SEED_SERVICES = [
  // --- 1. HOSPITALS & MEDICAL FACILITIES ---
  {
    _id: '65f000000000000000000010',
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
      website: 'https://nhsl.health.gov.lk',
      operatingHours: '24/7 Continuous Trauma Care',
    },
    servicesOffered: ['Trauma Surgery', 'ICU', 'Cardiac Emergency', 'Ambulance Dispatch', 'Burn Unit'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000002',
    name: 'Colombo South Teaching Hospital (Kalubowila)',
    type: 'Hospital & Medical',
    address: 'Kalubowila Road, Dehiwala-Mount Lavinia',
    location: {
      type: 'Point',
      coordinates: [79.8856, 6.8732],
    },
    contactInfo: {
      phone: '+94 11 276 3064',
      emergencyHotline: '1990',
      email: 'csth@health.gov.lk',
      website: 'https://csth.health.gov.lk',
      operatingHours: '24/7',
    },
    servicesOffered: ['Emergency Treatment', 'Surgical Casualty', 'Pediatric Emergency', 'Blood Bank'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000003',
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
      website: 'https://thkandy.health.gov.lk',
      operatingHours: '24/7 Emergency Wing',
    },
    servicesOffered: ['Emergency Surgery', 'Antivenom Bank', 'Neurological Trauma', 'High Altitude Sickness'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000004',
    name: 'Karapitiya National Teaching Hospital',
    type: 'Hospital & Medical',
    address: 'Hirimbura Cross Road, Karapitiya, Galle',
    location: {
      type: 'Point',
      coordinates: [80.2263, 6.0652],
    },
    contactInfo: {
      phone: '+94 91 223 2250',
      emergencyHotline: '1990',
      email: 'info@thkarapitiya.health.gov.lk',
      website: 'https://thkarapitiya.health.gov.lk',
      operatingHours: '24/7 Southern Trauma Center',
    },
    servicesOffered: ['Trauma Center', 'Hyperbaric Chamber (Diving Rescue)', 'ICU', 'Ambulance Units'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000005',
    name: 'Negombo District General Hospital',
    type: 'Hospital & Medical',
    address: 'Colombo Road, Negombo (Near BIA Airport)',
    location: {
      type: 'Point',
      coordinates: [79.8398, 7.2094],
    },
    contactInfo: {
      phone: '+94 31 222 2261',
      emergencyHotline: '1990',
      email: 'dghnegombo@health.gov.lk',
      website: 'https://dghnegombo.health.gov.lk',
      operatingHours: '24/7',
    },
    servicesOffered: ['Rapid Traveler Triage', 'Airport Medical Evacuation', 'Emergency Surgery', 'Infectious Disease Unit'],
    verificationStatus: 'verified',
    rating: 4.6,
    isDemonstration: false,
  },

  // --- 2. POLICE STATIONS & TOURIST SECURITY ---
  {
    _id: '65f000000000000000000015',
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
      website: 'https://www.police.lk/tourist-police',
      operatingHours: '24/7 Foreign Traveler Support',
    },
    servicesOffered: ['Multilingual Officer Support', 'Lost Passport Assistance', 'Tourist Incident Reports', 'Rapid Patrol'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000011',
    name: 'Wellawatte Police Station',
    type: 'Police Station',
    address: 'Galle Road, Colombo 06',
    location: {
      type: 'Point',
      coordinates: [79.8601, 6.8778],
    },
    contactInfo: {
      phone: '+94 11 258 8212',
      emergencyHotline: '119',
      email: 'hq.wellawatte@police.lk',
      website: 'https://www.police.lk',
      operatingHours: '24/7',
    },
    servicesOffered: ['Coastal Route Security', 'Traffic & Highway Incidents', 'Emergency Response Unit'],
    verificationStatus: 'verified',
    rating: 4.5,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000012',
    name: 'Kandy Tourist Police Unit',
    type: 'Police Station',
    address: 'Dalada Veediya (Near Temple of the Tooth), Kandy',
    location: {
      type: 'Point',
      coordinates: [80.6375, 7.2936],
    },
    contactInfo: {
      phone: '+94 81 222 2222',
      emergencyHotline: '119',
      email: 'touristpolice.kandy@police.lk',
      website: 'https://www.police.lk',
      operatingHours: '24/7',
    },
    servicesOffered: ['Heritage Zone Protection', 'Lost Property Recovery', 'Traveler Safety Escort'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000013',
    name: 'Galle Fort Tourist Police Unit',
    type: 'Police Station',
    address: 'Rampart Street, Galle Fort, Galle',
    location: {
      type: 'Point',
      coordinates: [80.2170, 6.0328],
    },
    contactInfo: {
      phone: '+94 91 222 2222',
      emergencyHotline: '119',
      email: 'galle.tourist@police.lk',
      website: 'https://www.police.lk',
      operatingHours: '24/7',
    },
    servicesOffered: ['Southern Coast Patrol', 'Traveler Guidance', 'Theft Investigation', 'Beach Safety Liaison'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000014',
    name: 'Katunayake Airport Police Station',
    type: 'Police Station',
    address: 'Bandaranaike International Airport Corridor, Katunayake',
    location: {
      type: 'Point',
      coordinates: [79.8841, 7.1808],
    },
    contactInfo: {
      phone: '+94 11 225 2433',
      emergencyHotline: '119',
      email: 'airport.police@police.lk',
      website: 'https://www.police.lk',
      operatingHours: '24/7 Airport Security Desk',
    },
    servicesOffered: ['Transit Assistance', 'Luggage Dispute Resolution', 'Expressway Transit Security'],
    verificationStatus: 'verified',
    rating: 4.6,
    isDemonstration: false,
  },

  // --- 3. EMBASSIES & DIPLOMATIC MISSIONS ---
  {
    _id: '65f000000000000000000020',
    name: 'Embassy of the United States of America',
    type: 'Embassy & Consulate',
    address: '210 Galle Road, Kollupitiya, Colombo 03',
    location: {
      type: 'Point',
      coordinates: [79.8499, 6.9152],
    },
    contactInfo: {
      phone: '+94 11 249 8500',
      emergencyHotline: '+94 11 249 8500',
      email: 'colomboacs@state.gov',
      website: 'https://lk.usembassy.gov',
      operatingHours: '24/7 Citizen Emergency Duty Officer',
    },
    servicesOffered: ['Emergency Citizen Evacuation', 'Emergency Passports', 'Consular Protection', 'Legal Referral'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000021',
    name: 'High Commission of India',
    type: 'Embassy & Consulate',
    address: '36-38 Galle Road, Kollupitiya, Colombo 03',
    location: {
      type: 'Point',
      coordinates: [79.8512, 6.9118],
    },
    contactInfo: {
      phone: '+94 11 242 1605',
      emergencyHotline: '+94 77 790 3082',
      email: 'cons.colombo@mea.gov.in',
      website: 'https://hcicolombo.gov.in',
      operatingHours: '24/7 Consular Emergency Line',
    },
    servicesOffered: ['Emergency Travel Certificates', 'Repatriation Assistance', 'Hospitalization Liaison'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000022',
    name: 'British High Commission Colombo',
    type: 'Embassy & Consulate',
    address: '389 Bauddhaloka Mawatha, Colombo 07',
    location: {
      type: 'Point',
      coordinates: [79.8694, 6.8992],
    },
    contactInfo: {
      phone: '+94 11 539 0639',
      emergencyHotline: '+94 11 539 0639',
      email: 'colombo.consular@fcdo.gov.uk',
      website: 'https://www.gov.uk/world/organisations/british-high-commission-colombo',
      operatingHours: '24/7 Global Response Center Access',
    },
    servicesOffered: ['Emergency Travel Documents', 'Consular Support in Crisis', 'Victims of Crime Assistance'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000023',
    name: 'Australian High Commission Sri Lanka',
    type: 'Embassy & Consulate',
    address: '21 Gregory\'s Road, Colombo 07',
    location: {
      type: 'Point',
      coordinates: [79.8705, 6.9103],
    },
    contactInfo: {
      phone: '+94 11 246 3200',
      emergencyHotline: '+61 2 6261 3305',
      email: 'consular.colombo@dfat.gov.au',
      website: 'https://srilanka.highcommission.gov.au',
      operatingHours: '24/7 Consular Emergency Service',
    },
    servicesOffered: ['Crisis Response', 'Emergency Financial Assistance', 'Passport Replacement', 'Family Liaison'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
  {
    _id: '65f000000000000000000024',
    name: 'Embassy of the People\'s Republic of China',
    type: 'Embassy & Consulate',
    address: '395 Bauddhaloka Mawatha, Colombo 07',
    location: {
      type: 'Point',
      coordinates: [79.8640, 6.8995],
    },
    contactInfo: {
      phone: '+94 11 268 8611',
      emergencyHotline: '+94 11 267 6033',
      email: 'chinaemb_lk@mfa.gov.cn',
      website: 'http://lk.china-embassy.gov.cn',
      operatingHours: '24/7 Consular Protection Desk',
    },
    servicesOffered: ['Mandarin Emergency Dispatch', 'Consular Protection', 'Emergency Medical Assistance Coordination'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: false,
  },

  // --- 4. MECHANICS & AUTOMOTIVE REPAIR GARAGES ---
  {
    _id: '65f000000000000000000030',
    name: 'Auto Miraj Grand Express Repair & Diagnostics',
    type: 'Mechanic & Repair',
    address: 'Baseline Road, Dematagoda, Colombo 09',
    location: {
      type: 'Point',
      coordinates: [79.8785, 6.9320],
    },
    contactInfo: {
      phone: '+94 11 267 7777',
      emergencyHotline: '+94 77 788 9900',
      email: 'service@automiraj.lk',
      website: 'https://automiraj.lk',
      operatingHours: '24/7 Roadside Mechanical Unit',
    },
    servicesOffered: ['Mobile Diagnostic Van', 'Alternator/Starter Fix', 'Cooling System Flush', 'Brake Overhaul', 'Battery Replacement'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: true,
  },
  {
    _id: '65f000000000000000000031',
    name: 'Carepoint Mechanical & Hybrid Care Center',
    type: 'Mechanic & Repair',
    address: 'Nawala Road, Nugegoda, Colombo Suburbs',
    location: {
      type: 'Point',
      coordinates: [79.8932, 6.8834],
    },
    contactInfo: {
      phone: '+94 11 440 5500',
      emergencyHotline: '+94 71 889 0011',
      email: 'support@carepoint.lk',
      website: 'https://carepoint.lk',
      operatingHours: 'Mon - Sun 6:00 AM - 11:00 PM (Emergency Callout 24/7)',
    },
    servicesOffered: ['Hybrid & EV Diagnostics', 'Transmission Repair', 'Emergency Suspension Fix', 'AC Recharging'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: true,
  },
  {
    _id: '65f000000000000000000032',
    name: 'Dimo 800 Express Auto Workshop',
    type: 'Mechanic & Repair',
    address: 'Negombo Road, Peliyagoda (Expressway Junction)',
    location: {
      type: 'Point',
      coordinates: [79.8970, 6.9650],
    },
    contactInfo: {
      phone: '+94 11 244 9797',
      emergencyHotline: '1900',
      email: 'dimo800@dimolanka.com',
      website: 'https://dimolanka.com',
      operatingHours: '24/7 Certified Workshop',
    },
    servicesOffered: ['European & Japanese Vehicles', 'Engine Management Overhaul', 'Fast Track Pitstop', 'OEM Parts'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: true,
  },
  {
    _id: '65f000000000000000000033',
    name: 'Kandy Express Auto Diagnostics & Garage',
    type: 'Mechanic & Repair',
    address: 'Katugastota Road, Kandy',
    location: {
      type: 'Point',
      coordinates: [80.6210, 7.3200],
    },
    contactInfo: {
      phone: '+94 81 223 4567',
      emergencyHotline: '+94 77 123 4567',
      email: 'kandyauto@repaircenter.lk',
      website: 'https://kandyauto.repaircenter.lk',
      operatingHours: '24/7 Hill Country Mobile Mechanic',
    },
    servicesOffered: ['Mountain Breakdown Assistance', 'Brake Pad Replacement', 'Radiator Welding', 'Clutch Repair'],
    verificationStatus: 'verified',
    rating: 4.6,
    isDemonstration: true,
  },
  {
    _id: '65f000000000000000000034',
    name: 'Southern Auto Care & Breakdown Garage',
    type: 'Mechanic & Repair',
    address: 'Wakwella Road, Galle',
    location: {
      type: 'Point',
      coordinates: [80.2120, 6.0510],
    },
    contactInfo: {
      phone: '+94 91 224 8899',
      emergencyHotline: '+94 77 987 6543',
      email: 'galleautocare@gmail.com',
      website: 'https://southernautocare.lk',
      operatingHours: '24/7 Coastal Emergency Callout',
    },
    servicesOffered: ['Tourist Rental Car Repairs', 'Puncture Repair & Tyre Fitting', 'Alternator Belt Replacement'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: true,
  },

  // --- 5. TOWING SERVICES & ROADSIDE RESCUE ---
  {
    _id: '65f000000000000000000040',
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
      website: 'https://apextowing.lk',
      operatingHours: '24/7 Expressway Rapid Fleet',
    },
    servicesOffered: ['Hydraulic Flatbed Towing', 'Heavy Winching', 'Battery Jumpstart', 'Emergency Fuel Delivery', 'Ditch Extraction'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: true,
  },
  {
    _id: '65f000000000000000000041',
    name: 'Metro Heavy Towing & Flatbed Recovery',
    type: 'Roadside & Towing',
    address: 'Biyagama Road, Kelaniya',
    location: {
      type: 'Point',
      coordinates: [79.9120, 6.9580],
    },
    contactInfo: {
      phone: '+94 11 291 3344',
      emergencyHotline: '+94 77 334 5566',
      email: 'metrorecovery@slnet.lk',
      website: 'https://metrotowing.lk',
      operatingHours: '24/7 Heavy Recovery Desk',
    },
    servicesOffered: ['Commercial Truck Towing', 'Low Clearance Flatbed', 'Accident Scene Clearance', 'Long Distance Haul'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: true,
  },
  {
    _id: '65f000000000000000000042',
    name: 'Southern Expressway Quick Tow & Recovery',
    type: 'Roadside & Towing',
    address: 'Kurundugahahetekma Interchange (E01), Galle Corridor',
    location: {
      type: 'Point',
      coordinates: [80.2050, 6.2500],
    },
    contactInfo: {
      phone: '+94 91 750 2000',
      emergencyHotline: '1969',
      email: 'southernquicktow@gmail.com',
      website: 'https://expresswaytowing.lk',
      operatingHours: '24/7 Expressway Standby',
    },
    servicesOffered: ['15-Minute Highway Response', 'Motorcycle Flatbed', 'Tire Change', 'Overheated Towing'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: true,
  },
  {
    _id: '65f000000000000000000043',
    name: 'Central Highland Recovery & Towing',
    type: 'Roadside & Towing',
    address: 'Peradeniya Junction, Kandy',
    location: {
      type: 'Point',
      coordinates: [80.5980, 7.2640],
    },
    contactInfo: {
      phone: '+94 81 238 9000',
      emergencyHotline: '+94 71 456 7890',
      email: 'highlandtow@kandynet.lk',
      website: 'https://highlandrecovery.lk',
      operatingHours: '24/7 Mountain Tow Trucks',
    },
    servicesOffered: ['Hill Incline Winching', 'Steep Ravine Pull', 'Wheel-Lift Towing', 'Tourist Bus Towing'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: true,
  },
  {
    _id: '65f000000000000000000044',
    name: 'Airport Corridor 24/7 Rapid Towing',
    type: 'Roadside & Towing',
    address: 'Minuwangoda Road, Katunayake',
    location: {
      type: 'Point',
      coordinates: [79.8950, 7.1650],
    },
    contactInfo: {
      phone: '+94 31 228 1122',
      emergencyHotline: '+94 77 890 1234',
      email: 'airporttowing@sl.lk',
      website: 'https://airporttowing.lk',
      operatingHours: '24/7 Immediate Airport Response',
    },
    servicesOffered: ['Airport Taxi Breakdown', 'Rental Fleet Towing', 'Jumpstart Service', 'Lockout Assistance'],
    verificationStatus: 'verified',
    rating: 4.6,
    isDemonstration: true,
  },

  // --- 6. FIRE & RESCUE ---
  {
    _id: '65f000000000000000000050',
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
      email: 'fire@colombo.gov.lk',
      website: 'https://fire.colombo.gov.lk',
      operatingHours: '24/7 Emergency Dispatch',
    },
    servicesOffered: ['Fire Suppression', 'Hazardous Materials Containment', 'High-Rise Rescue', 'Vehicle Extrication'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: false,
  },

  // --- 7. COAST GUARD & MARINE RESCUE ---
  {
    _id: '65f000000000000000000060',
    name: 'Coast Guard & Maritime Rescue Center',
    type: 'Coast Guard & Marine',
    address: 'Harbour Gate 4, Marine Drive, Colombo',
    location: {
      type: 'Point',
      coordinates: [79.8492, 6.9421],
    },
    contactInfo: {
      phone: '+94 11 244 1189',
      emergencyHotline: '1989',
      email: 'rescue@coastguard.gov.lk',
      website: 'https://coastguard.gov.lk',
      operatingHours: '24/7 Offshore Radar & Marine Dispatch',
    },
    servicesOffered: ['Sea Air Rescue', 'Drowning Prevention & Lifeguards', 'Vessel Towing', 'Oil Spill Response'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: false,
  },
];

/**
 * Haversine formula to compute great-circle distance between two points in meters
 */
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
 * Resolves query category string to matched types using canonical alias mapping
 */
function resolveCategoryTypes(typeQuery) {
  if (!typeQuery) return null;
  const lower = String(typeQuery).trim().toLowerCase();
  if (CATEGORY_MAP[lower]) {
    return CATEGORY_MAP[lower];
  }
  return [typeQuery];
}

/**
 * @desc    Get all emergency services with filtering & keyword search
 * @route   GET /api/services
 * @access  Public
 * @owner   Member 2 (Samindika)
 */
exports.getServices = async (req, res, next) => {
  try {
    const { type, verified, search, lat, lng, limit } = req.query;
    const filter = {};

    const matchedTypes = resolveCategoryTypes(type);
    if (matchedTypes) {
      filter.type = { $in: matchedTypes };
    }
    if (verified) {
      filter.verificationStatus = verified;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { servicesOffered: { $regex: search, $options: 'i' } },
      ];
    }

    let services = [];

    // Attempt MongoDB Query if database connection is active
    if (isDbReady()) {
      try {
        services = await EmergencyService.find(filter).lean();
      } catch {
        services = [];
      }
    }

    // If database returned no records or was unavailable, use SEED_SERVICES
    if (!services || services.length === 0) {
      services = SEED_SERVICES.filter((s) => {
        if (matchedTypes && !matchedTypes.includes(s.type)) return false;
        if (verified && s.verificationStatus !== verified) return false;
        if (search) {
          const q = search.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchAddr = s.address.toLowerCase().includes(q);
          const matchSrv = s.servicesOffered?.some((srv) => srv.toLowerCase().includes(q));
          if (!matchName && !matchAddr && !matchSrv) return false;
        }
        return true;
      });
    }

    // If client supplied user coordinates, compute distances and sort
    if (lat && lng) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      if (!isNaN(uLat) && !isNaN(uLng)) {
        services = services.map((s) => {
          const sLng = s.location?.coordinates?.[0] || 0;
          const sLat = s.location?.coordinates?.[1] || 0;
          const dist = calculateDistanceMeters(uLat, uLng, sLat, sLng);
          return {
            ...s,
            distanceMeters: Math.round(dist),
            distanceKm: (dist / 1000).toFixed(1),
          };
        });
        services.sort((a, b) => a.distanceMeters - b.distanceMeters);
      }
    }

    if (limit && !isNaN(parseInt(limit, 10))) {
      services = services.slice(0, parseInt(limit, 10));
    }

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
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
    const { lng, lat, radius = 50000, type, search } = req.query;

    // 1. Validate Longitude
    if (lng === undefined || lng === null || String(lng).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Longitude (lng) query parameter is required for geospatial discovery.',
        error: 'MISSING_LONGITUDE',
      });
    }
    const longitude = parseFloat(lng);
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude coordinate. Must be a decimal number between -180.0 and 180.0.',
        error: 'INVALID_COORDINATES',
      });
    }

    // 2. Validate Latitude
    if (lat === undefined || lat === null || String(lat).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Latitude (lat) query parameter is required for geospatial discovery.',
        error: 'MISSING_LATITUDE',
      });
    }
    const latitude = parseFloat(lat);
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude coordinate. Must be a decimal number between -90.0 and 90.0.',
        error: 'INVALID_COORDINATES',
      });
    }

    // 3. Validate Query Radius (meters)
    const maxDistanceMeters = parseInt(radius, 10);
    if (isNaN(maxDistanceMeters) || maxDistanceMeters <= 0 || maxDistanceMeters > 500000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search radius. Must be a positive integer between 1 meter and 500,000 meters (500 km).',
        error: 'INVALID_RADIUS',
      });
    }

    const matchedTypes = resolveCategoryTypes(type);

    let foundServices = [];

    // Attempt MongoDB 2dsphere $nearSphere spatial query if database connection is active
    if (isDbReady()) {
      try {
        const spatialQuery = {
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

        if (matchedTypes) {
          spatialQuery.type = { $in: matchedTypes };
        }

        if (search) {
          spatialQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
          ];
        }

        const dbResults = await EmergencyService.find(spatialQuery).lean();
        if (dbResults && dbResults.length > 0) {
          foundServices = dbResults.map((s) => {
            const sLng = s.location.coordinates[0];
            const sLat = s.location.coordinates[1];
            const distance = calculateDistanceMeters(latitude, longitude, sLat, sLng);
            return {
              ...s,
              distanceMeters: Math.round(distance),
              distanceKm: (distance / 1000).toFixed(1),
            };
          });
        }
      } catch {
        // Fallback
      }
    }

    // Fallback: If DB returned no results or is in fallback mode, compute from SEED_SERVICES
    if (!foundServices || foundServices.length === 0) {
      foundServices = SEED_SERVICES.map((s) => {
        const [sLng, sLat] = s.location.coordinates;
        const distance = calculateDistanceMeters(latitude, longitude, sLat, sLng);
        return {
          ...s,
          distanceMeters: Math.round(distance),
          distanceKm: (distance / 1000).toFixed(1),
        };
      }).filter((s) => s.distanceMeters <= maxDistanceMeters);

      if (matchedTypes) {
        foundServices = foundServices.filter((s) => matchedTypes.includes(s.type));
      }

      if (search) {
        const q = search.toLowerCase();
        foundServices = foundServices.filter((s) =>
          s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
        );
      }

      foundServices.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    return res.status(200).json({
      success: true,
      count: foundServices.length,
      queryCenter: [longitude, latitude],
      radiusMeters: maxDistanceMeters,
      categoryFilter: type || 'All',
      data: foundServices,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get metadata for supported service categories
 * @route   GET /api/services/categories
 * @access  Public
 * @owner   Member 2 (Samindika)
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = [
      {
        key: 'Hospitals',
        label: 'Hospitals',
        canonicalType: 'Hospital & Medical',
        icon: 'Hospital',
        color: 'text-emergency-red',
        badgeBg: 'bg-red-50 text-red-700 border-red-200',
        description: 'Accredited trauma hospitals, surgical emergency rooms, and intensive care centers',
      },
      {
        key: 'Police Stations',
        label: 'Police Stations',
        canonicalType: 'Police Station',
        icon: 'Shield',
        color: 'text-blue-600',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Tourist police divisions, law enforcement outposts, and emergency reporting desks',
      },
      {
        key: 'Embassies',
        label: 'Embassies',
        canonicalType: 'Embassy & Consulate',
        icon: 'Building2',
        color: 'text-purple-600',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        description: 'Foreign diplomatic missions, consular emergency citizen services, and travel document centers',
      },
      {
        key: 'Mechanics',
        label: 'Mechanics',
        canonicalType: 'Mechanic & Repair',
        icon: 'Wrench',
        color: 'text-amber-600',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Certified breakdown mechanics, mobile diagnostic units, and auto garages',
      },
      {
        key: 'Towing Services',
        label: 'Towing Services',
        canonicalType: 'Roadside & Towing',
        icon: 'Truck',
        color: 'text-brand-teal',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
        description: '24/7 hydraulic flatbed recovery trucks, highway winching, and roadside rescue units',
      },
    ];

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single emergency service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbReady()) {
      try {
        const service = await EmergencyService.findById(id).lean();
        if (service) {
          return res.status(200).json({ success: true, data: service });
        }
      } catch {
        // Fallback
      }
    }

    const found = SEED_SERVICES.find((s) => String(s._id) === String(id));
    if (!found) {
      return res.status(404).json({
        success: false,
        message: `Emergency service not found with identifier: ${id}`,
        error: 'NOT_FOUND',
      });
    }

    return res.status(200).json({ success: true, data: found });
  } catch (err) {
    next(err);
  }
};

/**
 * Automatically seeds Emergency Services collection when connected to MongoDB
 */
exports.seedEmergencyServices = async () => {
  try {
    if (!isDbReady()) {
      return;
    }
    const count = await EmergencyService.countDocuments();
    if (count === 0) {
      console.log('[Seed] Seeding EmergencyService directory with initial records...');
      await EmergencyService.insertMany(SEED_SERVICES);
      await EmergencyService.ensureIndexes();
      console.log(`[Seed] Seeded ${SEED_SERVICES.length} emergency services successfully with 2dsphere indexes.`);
    }
  } catch (err) {
    console.warn('[Seed Warning] EmergencyService automatic seeding deferred:', err.message);
  }
};

exports.SEED_SERVICES = SEED_SERVICES;

