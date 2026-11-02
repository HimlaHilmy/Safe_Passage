const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const { Incident, INCIDENT_STATUS } = require('../models/Incident');
const CaseLog = require('../models/CaseLog');
const EmergencyService = require('../models/EmergencyService');
const AssistanceRequest = require('../models/AssistanceRequest');
const AuditLog = require('../models/AuditLog');

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safe_passage';
  console.log(`[Seed Script] Connecting to database: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('[Seed Script] Connected successfully.');

    // Clear existing collections if desired
    console.log('[Seed Script] Cleaning existing data...');
    await User.deleteMany({});
    await Incident.deleteMany({});
    await CaseLog.deleteMany({});
    await EmergencyService.deleteMany({});
    await AssistanceRequest.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('[Seed Script] Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

    const users = await User.create([
      {
        _id: new mongoose.Types.ObjectId('65e000000000000000000001'),
        name: 'Sarah Jenkins',
        email: 'traveler@safepassage.org',
        passwordHash: defaultPasswordHash,
        role: 'traveler',
        phone: '+1 (555) 234-5678',
        accountStatus: 'active',
      },
      {
        _id: new mongoose.Types.ObjectId('65e000000000000000000002'),
        name: 'Apex Rapid Response Ltd',
        email: 'provider@safepassage.org',
        passwordHash: defaultPasswordHash,
        role: 'provider',
        phone: '+1 (555) 987-6543',
        accountStatus: 'active',
        providerDetails: {
          serviceTypes: ['Roadside Towing & Vehicle Repair', 'Emergency Paramedic Escort'],
          licenseNumber: 'SRI-EMERG-2024-88',
          verified: true,
          isAvailable: true,
          currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        },
      },
      {
        _id: new mongoose.Types.ObjectId('65e000000000000000000003'),
        name: 'Himla (Admin Lead)',
        email: 'admin@safepassage.org',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        phone: '+1 (555) 000-1122',
        accountStatus: 'active',
      },
      {
        _id: new mongoose.Types.ObjectId('65e000000000000000000004'),
        name: 'Marcus Vance',
        email: 'marcus.vance@gmail.com',
        passwordHash: defaultPasswordHash,
        role: 'traveler',
        phone: '+44 7700 900123',
        accountStatus: 'active',
      },
      {
        _id: new mongoose.Types.ObjectId('65e000000000000000000020'),
        name: 'Highland Mountain Rescue Unit',
        email: 'highland@rescue.org',
        passwordHash: defaultPasswordHash,
        role: 'provider',
        phone: '+94 81 223 9900',
        accountStatus: 'active',
        providerDetails: {
          serviceTypes: ['Search & Mountain Extrication', 'Lost & Stranded Rescue'],
          licenseNumber: 'SRI-RESC-2023-14',
          verified: true,
          isAvailable: true,
          currentLocation: { type: 'Point', coordinates: [80.635, 7.288] },
        },
      },
      {
        _id: new mongoose.Types.ObjectId('65e000000000000000000021'),
        name: 'Southern Coastal Towing & Salvage',
        email: 'towing@coastalsalvage.lk',
        passwordHash: defaultPasswordHash,
        role: 'provider',
        phone: '+94 91 224 8811',
        accountStatus: 'pending',
        providerDetails: {
          serviceTypes: ['Roadside Towing & Vehicle Repair'],
          licenseNumber: 'PENDING-VERIFICATION-2026',
          verified: false,
          isAvailable: false,
          currentLocation: { type: 'Point', coordinates: [80.217, 6.0535] },
        },
      },
      {
        _id: new mongoose.Types.ObjectId('65e000000000000000000022'),
        name: 'Hirunika (Operations Director)',
        email: 'hirunika@safepassage.org',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        phone: '+94 77 123 4567',
        accountStatus: 'active',
      },
    ]);
    console.log(`[Seed Script] Seeded ${users.length} users.`);

    console.log('[Seed Script] Seeding emergency services...');
    const services = await EmergencyService.create([
      {
        _id: new mongoose.Types.ObjectId('65s000000000000000000001'),
        name: 'National Hospital Emergency Trauma Unit',
        type: 'Hospital & Medical',
        address: 'Regent Street, Colombo 10',
        location: { type: 'Point', coordinates: [79.8653, 6.9189] },
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
        _id: new mongoose.Types.ObjectId('65s000000000000000000002'),
        name: 'Central Tourist Police Division',
        type: 'Police Station',
        address: 'Chatham Street, Fort, Colombo 01',
        location: { type: 'Point', coordinates: [79.8436, 6.9344] },
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
        _id: new mongoose.Types.ObjectId('65s000000000000000000003'),
        name: 'Metropolitan Fire & Rescue Command',
        type: 'Fire & Rescue',
        address: 'T.B. Jayah Mawatha, Colombo 10',
        location: { type: 'Point', coordinates: [79.8631, 6.9242] },
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
        _id: new mongoose.Types.ObjectId('65s000000000000000000004'),
        name: 'Kandy General Teaching Hospital',
        type: 'Hospital & Medical',
        address: 'William Gopallawa Mawatha, Kandy',
        location: { type: 'Point', coordinates: [80.627, 7.286] },
        contactInfo: {
          phone: '+94 81 222 2261',
          emergencyHotline: '1990',
          email: 'emergency@kandyhospital.org',
          operatingHours: '24/7',
        },
        servicesOffered: ['Emergency Room', 'ICU', 'Helipad', 'Snakebite Envenomation Center'],
        verificationStatus: 'verified',
        rating: 4.8,
      },
      {
        _id: new mongoose.Types.ObjectId('65s000000000000000000005'),
        name: 'Southern Highway Emergency Towing Base',
        type: 'Roadside & Towing',
        address: 'Pinnaduwa Interchange, Southern Expressway',
        location: { type: 'Point', coordinates: [80.252, 6.069] },
        contactInfo: {
          phone: '+94 91 223 4455',
          emergencyHotline: '1969',
          email: 'expressway.towing@rda.gov.lk',
          operatingHours: '24/7 Expressway Patrol',
        },
        servicesOffered: ['Heavy Towing', 'Flat Tire Service', 'Fuel Delivery', 'Battery Jumpstart'],
        verificationStatus: 'verified',
        rating: 4.9,
      },
    ]);
    console.log(`[Seed Script] Seeded ${services.length} emergency services.`);

    console.log('[Seed Script] Seeding incidents & case history...');
    const now = Date.now();

    const incident1 = await Incident.create({
      _id: new mongoose.Types.ObjectId('65f000000000000000000010'),
      travelerId: users[0]._id,
      category: 'Roadside & Vehicle Breakdown',
      title: 'Engine overheating on Mountain Pass A4',
      description: 'Vehicle radiator steam observed, unable to proceed. Two passengers on board with limited water.',
      severity: 'High',
      location: {
        type: 'Point',
        coordinates: [80.6337, 7.2906],
        address: 'Route A4, Mile Marker 42, Central Province',
        landmark: 'Near Viewpoint Cafe',
      },
      media: [
        {
          url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
          type: 'image',
          caption: 'Radiator steam and warning light on dashboard',
          uploadedAt: new Date(now - 7200000),
        },
      ],
      status: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
      assignedProviderId: users[1]._id,
      estimatedArrivalTimeMinutes: 18,
      createdAt: new Date(now - 7200000), // 2 hours ago
      updatedAt: new Date(now - 1800000),
    });

    const incident2 = await Incident.create({
      _id: new mongoose.Types.ObjectId('65f000000000000000000011'),
      travelerId: users[0]._id,
      category: 'Medical Emergency',
      title: 'Severe allergic reaction to food ingredient',
      description: 'Difficulty breathing, facial swelling. Antihistamine administered but condition worsening.',
      severity: 'Critical',
      location: {
        type: 'Point',
        coordinates: [79.8612, 6.9271],
        address: 'Galle Face Terrace, Coastal Road',
        landmark: 'Opposite Lighthouse Hotel',
      },
      media: [],
      status: INCIDENT_STATUS.IN_PROGRESS,
      assignedProviderId: users[1]._id,
      estimatedArrivalTimeMinutes: 5,
      createdAt: new Date(now - 14400000), // 4 hours ago
      updatedAt: new Date(now - 900000),
    });

    const incident3 = await Incident.create({
      _id: new mongoose.Types.ObjectId('65f000000000000000000012'),
      travelerId: users[3]._id,
      category: 'Lost & Stranded',
      title: 'Missed trail marker in dense fog',
      description: 'Hiker disoriented off marked path. Battery at 25%, flashlight operational, safe from precipice.',
      severity: 'Medium',
      location: {
        type: 'Point',
        coordinates: [80.7891, 6.8096],
        address: 'Horton Plains National Park trail 3',
        landmark: 'Between Chimney Pond and Mini Worlds End',
      },
      media: [],
      status: INCIDENT_STATUS.UNDER_REVIEW,
      assignedProviderId: null,
      estimatedArrivalTimeMinutes: null,
      createdAt: new Date(now - 21600000), // 6 hours ago
      updatedAt: new Date(now - 7200000),
    });

    const incident4 = await Incident.create({
      _id: new mongoose.Types.ObjectId('65f000000000000000000013'),
      travelerId: users[3]._id,
      category: 'Natural Hazard & Weather',
      title: 'Minor mudslide blocking pass roadway',
      description: 'Flash rains triggered rockfall blocking lane. Vehicle stopped safely before debris.',
      severity: 'High',
      location: {
        type: 'Point',
        coordinates: [80.512, 7.021],
        address: 'Kandy-Nuwara Eliya Mountain Road KM 58',
        landmark: 'Near Ramboda Falls Bridge',
      },
      media: [],
      status: INCIDENT_STATUS.RESOLVED,
      assignedProviderId: users[4]._id,
      estimatedArrivalTimeMinutes: 0,
      createdAt: new Date(now - 86400000 * 2), // 2 days ago
      updatedAt: new Date(now - 86400000 * 2 + 3600000 * 2), // Resolved in 2 hours
    });

    const incident5 = await Incident.create({
      _id: new mongoose.Types.ObjectId('65f000000000000000000014'),
      travelerId: users[0]._id,
      category: 'Crime & Theft',
      title: 'Stolen backpack with passport and medications',
      description: 'Bag grabbed while seated at outdoor railway cafeteria. Police notified.',
      severity: 'Medium',
      location: {
        type: 'Point',
        coordinates: [80.217, 6.0535],
        address: 'Galle Fort Rampart Street',
        landmark: 'Near Old Gate',
      },
      media: [],
      status: INCIDENT_STATUS.RESOLVED,
      assignedProviderId: null,
      estimatedArrivalTimeMinutes: 0,
      createdAt: new Date(now - 86400000 * 3), // 3 days ago
      updatedAt: new Date(now - 86400000 * 3 + 3600000 * 1.5),
    });

    console.log('[Seed Script] Seeded 5 incidents.');

    // Seed CaseLogs
    await CaseLog.create([
      {
        incidentId: incident1._id,
        updatedBy: users[0]._id,
        updaterRole: 'traveler',
        previousStatus: 'None',
        newStatus: INCIDENT_STATUS.SUBMITTED,
        notes: 'Emergency reported via mobile application wizard.',
        timestamp: new Date(now - 7200000),
      },
      {
        incidentId: incident1._id,
        updatedBy: users[2]._id,
        updaterRole: 'admin',
        previousStatus: INCIDENT_STATUS.SUBMITTED,
        newStatus: INCIDENT_STATUS.UNDER_REVIEW,
        notes: 'Verified GPS location and assessed severity as High.',
        timestamp: new Date(now - 5400000),
      },
      {
        incidentId: incident1._id,
        updatedBy: users[2]._id,
        updaterRole: 'admin',
        previousStatus: INCIDENT_STATUS.UNDER_REVIEW,
        newStatus: INCIDENT_STATUS.ASSIGNED,
        notes: 'Assigned to Apex Rapid Response Ltd.',
        timestamp: new Date(now - 3600000),
      },
      {
        incidentId: incident1._id,
        updatedBy: users[1]._id,
        updaterRole: 'provider',
        previousStatus: INCIDENT_STATUS.ASSIGNED,
        newStatus: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
        notes: 'Tow truck and coolant unit deployed. ETA 18 minutes.',
        timestamp: new Date(now - 1800000),
      },
      {
        incidentId: incident2._id,
        updatedBy: users[0]._id,
        updaterRole: 'traveler',
        previousStatus: 'None',
        newStatus: INCIDENT_STATUS.SUBMITTED,
        notes: 'Immediate medical distress call triggered.',
        timestamp: new Date(now - 14400000),
      },
      {
        incidentId: incident2._id,
        updatedBy: users[2]._id,
        updaterRole: 'admin',
        previousStatus: INCIDENT_STATUS.SUBMITTED,
        newStatus: INCIDENT_STATUS.ASSIGNED,
        notes: 'Fast-tracked triage to Critical and assigned nearest paramedic unit.',
        timestamp: new Date(now - 13800000), // Dispatched in 10 minutes
      },
      {
        incidentId: incident2._id,
        updatedBy: users[1]._id,
        updaterRole: 'provider',
        previousStatus: INCIDENT_STATUS.ASSIGNED,
        newStatus: INCIDENT_STATUS.IN_PROGRESS,
        notes: 'Paramedic vehicle arrived on scene; administering nebulizer.',
        timestamp: new Date(now - 900000),
      },
    ]);
    console.log('[Seed Script] Seeded case logs.');

    // Seed AssistanceRequests
    await AssistanceRequest.create([
      {
        incidentId: incident1._id,
        travelerId: users[0]._id,
        providerId: users[1]._id,
        serviceType: 'Roadside Towing & Vehicle Repair',
        location: incident1.location,
        status: 'En Route',
        dispatchNotes: 'Vehicle radiator overheated, mile marker 42.',
        acceptedAt: new Date(now - 3600000),
        enRouteAt: new Date(now - 1800000),
        createdAt: new Date(now - 5400000),
      },
      {
        incidentId: incident2._id,
        travelerId: users[0]._id,
        providerId: users[1]._id,
        serviceType: 'Emergency Paramedic Escort',
        location: incident2.location,
        status: 'On Scene',
        dispatchNotes: 'Critical anaphylaxis treatment.',
        acceptedAt: new Date(now - 13800000),
        enRouteAt: new Date(now - 12000000),
        arrivedAt: new Date(now - 900000),
        createdAt: new Date(now - 14400000),
      },
    ]);
    console.log('[Seed Script] Seeded assistance requests.');

    // Seed AuditLogs (Member 5)
    await AuditLog.create([
      {
        action: 'ADMIN_LOGIN',
        performedBy: users[2]._id,
        performedByName: 'Himla (Admin Lead)',
        performedByRole: 'admin',
        targetType: 'System',
        targetTitle: 'Administrative Console Session',
        details: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' },
        notes: 'Secure session authenticated.',
        timestamp: new Date(now - 86400000),
      },
      {
        action: 'PROVIDER_VERIFIED',
        performedBy: users[2]._id,
        performedByName: 'Himla (Admin Lead)',
        performedByRole: 'admin',
        targetType: 'Provider',
        targetId: String(users[1]._id),
        targetTitle: 'Apex Rapid Response Ltd',
        details: { licenseNumber: 'SRI-EMERG-2024-88', verified: true },
        notes: 'Accreditation certified after emergency service background check.',
        timestamp: new Date(now - 86400000 * 10),
      },
      {
        action: 'INCIDENT_ASSIGNMENT',
        performedBy: users[2]._id,
        performedByName: 'Himla (Admin Lead)',
        performedByRole: 'admin',
        targetType: 'Incident',
        targetId: String(incident1._id),
        targetTitle: 'Engine overheating on Mountain Pass A4',
        details: { assignedProviderId: String(users[1]._id), priority: 'High' },
        notes: 'Manual dispatcher override: assigned nearest accredited tow truck.',
        timestamp: new Date(now - 3600000),
      },
      {
        action: 'SERVICE_CREATED',
        performedBy: users[2]._id,
        performedByName: 'Himla (Admin Lead)',
        performedByRole: 'admin',
        targetType: 'EmergencyService',
        targetId: String(services[4]._id),
        targetTitle: 'Southern Highway Emergency Towing Base',
        details: { type: 'Roadside & Towing', phone: '+94 91 223 4455' },
        notes: 'Added new expressway rapid roadside response post.',
        timestamp: new Date(now - 86400000 * 5),
      },
    ]);
    console.log('[Seed Script] Seeded audit logs.');

    console.log('[Seed Script] Seeding complete! Database ready.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Script Error]:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

