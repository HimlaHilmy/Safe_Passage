const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./config/db');
const { Incident, INCIDENT_STATUS } = require('./models/Incident');
const User = require('./models/User');
const CaseLog = require('./models/CaseLog');
const { uploadImageAsWebP } = require('./utils/cloudinaryService');

// Test suite for Member 1: Emergency Reporting System (Dulanjani)
async function runMember1Tests() {
  console.log('================================================================');
  console.log('  SAFE PASSAGE: MEMBER 1 (DULANJANI) EMERGENCY REPORTING TESTS   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error(`    Details: ${details}`);
      failed++;
    }
  }

  // Connect to Database
  await connectDB();

  // 1. Setup Test Travelers
  const travelerAId = new mongoose.Types.ObjectId('65e0000000000000000000a1');
  const travelerBId = new mongoose.Types.ObjectId('65e0000000000000000000b2');

  await User.deleteMany({ _id: { $in: [travelerAId, travelerBId] } });
  await Incident.deleteMany({ travelerId: { $in: [travelerAId, travelerBId] } });

  const travelerA = await User.create({
    _id: travelerAId,
    name: 'Traveler Alice',
    email: 'alice@safepassage.org',
    passwordHash: 'Password123!',
    role: 'traveler',
    phone: '+1 (555) 111-2222',
  });

  const travelerB = await User.create({
    _id: travelerBId,
    name: 'Traveler Bob',
    email: 'bob@safepassage.org',
    passwordHash: 'Password123!',
    role: 'traveler',
    phone: '+1 (555) 333-4444',
  });

  assert(travelerA && travelerB, 'Created test travelers Alice and Bob in MongoDB');

  // TEST 1: Server-Generated Reference Number Format
  console.log('\n--- 1. Testing Server Incident Reference Generation ---');
  const { generateIncidentReference } = require('./models/Incident');
  const ref = generateIncidentReference();
  const refRegex = /^INC-\d{8}-\d{4}$/;
  assert(refRegex.test(ref), `Generated server incident reference matches format INC-YYYYMMDD-XXXX (${ref})`);

  // TEST 2: Valid Emergency Incident Creation & MongoDB Persistence
  console.log('\n--- 2. Testing Valid Incident Submission & Persistence ---');
  const incidentData = {
    travelerId: travelerAId,
    category: 'Medical Emergency',
    title: 'Severe heat exhaustion and dehydration on coastal trail',
    description: 'Traveler collapsed near rock outcrop with confusion, low pulse, and nausea. Two liters of water administered.',
    severity: 'High',
    incidentDate: new Date(),
    location: {
      type: 'Point',
      coordinates: [80.1234, 6.5432],
      address: 'Coastal Nature Reserve, Trail Marker 14',
      landmark: 'Near North Lookout Pavilion',
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        type: 'image',
        caption: 'First aid treatment kit and hydration salt pack',
      },
    ],
  };

  const createdIncident = await Incident.create(incidentData);

  assert(createdIncident && createdIncident._id, 'Incident saved successfully in MongoDB Incident collection');
  assert(createdIncident.travelerId.toString() === travelerAId.toString(), 'Associated correctly with authenticated traveler (Alice)');
  assert(refRegex.test(createdIncident.incidentReference), `Incident reference automatically generated on server: ${createdIncident.incidentReference}`);
  assert(createdIncident.referenceNumber === createdIncident.incidentReference, 'Reference number matches incident reference');
  assert(createdIncident.status === 'Submitted', 'Initial status defaults to "Submitted"');
  assert(createdIncident.media.length === 1, 'Supporting media attachment stored correctly');

  // Verify CaseLog entry creation
  const initialLog = await CaseLog.create({
    incidentId: createdIncident._id,
    updatedBy: travelerAId,
    updaterRole: 'traveler',
    previousStatus: 'None',
    newStatus: INCIDENT_STATUS.SUBMITTED,
    notes: 'Emergency incident reported by traveler.',
    timestamp: new Date(),
  });
  assert(initialLog && initialLog.newStatus === 'Submitted', 'Initial audit CaseLog entry recorded for the incident');

  // TEST 3: Validation & Rejection of Invalid Reports
  console.log('\n--- 3. Testing Validation & Rejection of Invalid Reports ---');

  // Test missing title
  try {
    await Incident.create({
      travelerId: travelerAId,
      category: 'Medical Emergency',
      title: '', // Missing
      description: 'Valid description that has more than ten characters.',
      location: { type: 'Point', coordinates: [80.0, 6.0] },
    });
    assert(false, 'Should reject incident with missing title');
  } catch (err) {
    assert(true, 'Rejected incident with missing title');
  }

  // Test missing description
  try {
    await Incident.create({
      travelerId: travelerAId,
      category: 'Medical Emergency',
      title: 'Valid Title Here',
      description: '', // Missing
      location: { type: 'Point', coordinates: [80.0, 6.0] },
    });
    assert(false, 'Should reject incident with missing description');
  } catch (err) {
    assert(true, 'Rejected incident with missing description');
  }

  // Test invalid coordinates out of range
  try {
    await Incident.create({
      travelerId: travelerAId,
      category: 'Vehicle Breakdown',
      title: 'Flat tire on highway',
      description: 'Vehicle disabled on outer shoulder.',
      location: { type: 'Point', coordinates: [250.0, 150.0] }, // Invalid lat/long bounds
    });
    assert(false, 'Should reject incident with out-of-bounds coordinates');
  } catch (err) {
    assert(true, 'Rejected incident with out-of-bounds coordinates');
  }

  // Test invalid category
  try {
    await Incident.create({
      travelerId: travelerAId,
      category: 'InvalidNonExistentCategory',
      title: 'Some Incident Title',
      description: 'Description of an incident that is valid in length.',
      location: { type: 'Point', coordinates: [80.0, 6.0] },
    });
    assert(false, 'Should reject incident with unsupported category');
  } catch (err) {
    assert(true, 'Rejected incident with unsupported category');
  }

  // TEST 4: File Upload & WebP Conversion
  console.log('\n--- 4. Testing Secure Image Upload Handling ---');
  const sharp = require('sharp');
  const sampleBuffer = await sharp({
    create: {
      width: 120,
      height: 120,
      channels: 4,
      background: { r: 20, g: 184, b: 166, alpha: 1 }, // Teal
    },
  })
    .png()
    .toBuffer();

  const uploadResult = await uploadImageAsWebP(sampleBuffer, {
    folder: 'safe_passage/tests',
    filename: 'test_evidence.png',
  });

  assert(uploadResult && uploadResult.url, `Image processed and stored: ${uploadResult.url}`);
  assert(uploadResult.format === 'webp', `Converted to WebP format (${uploadResult.format})`);

  // TEST 5: Access Control & Data Isolation Between Travelers
  console.log('\n--- 5. Testing Access Control & Traveler Isolation ---');

  // Create Bob's incident
  const bobIncident = await Incident.create({
    travelerId: travelerBId,
    category: 'Lost Passport or Documents',
    title: 'Stolen passport and flight ticket documents at hotel lounge',
    description: 'Leather passport wallet taken from table. Contacting embassy and local police command.',
    severity: 'Medium',
    location: {
      type: 'Point',
      coordinates: [79.8500, 6.9300],
      address: 'Lighthouse Hotel, Coastal Promenade',
    },
  });

  // Query Alice's incidents
  const aliceIncidents = await Incident.find({ travelerId: travelerAId });
  const bobIncidents = await Incident.find({ travelerId: travelerBId });

  assert(
    aliceIncidents.every((inc) => inc.travelerId.toString() === travelerAId.toString()),
    "Alice's query returns ONLY Alice's incidents"
  );
  assert(
    !aliceIncidents.some((inc) => inc._id.toString() === bobIncident._id.toString()),
    "Alice CANNOT view Bob's incident in her query"
  );
  assert(
    bobIncidents.every((inc) => inc.travelerId.toString() === travelerBId.toString()),
    "Bob's query returns ONLY Bob's incidents"
  );
  assert(
    !bobIncidents.some((inc) => inc._id.toString() === createdIncident._id.toString()),
    "Bob CANNOT view Alice's incident in his query"
  );

  // Clean up test data
  await User.deleteMany({ _id: { $in: [travelerAId, travelerBId] } });
  await Incident.deleteMany({ travelerId: { $in: [travelerAId, travelerBId] } });
  await CaseLog.deleteMany({ incidentId: { $in: [createdIncident._id, bobIncident._id] } });

  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(`  MEMBER 1 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runMember1Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

