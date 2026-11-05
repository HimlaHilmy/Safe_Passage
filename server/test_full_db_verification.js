const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');

const User = require('./models/User');
const { Incident, INCIDENT_STATUS } = require('./models/Incident');
const AssistanceRequest = require('./models/AssistanceRequest');
const CaseLog = require('./models/CaseLog');
const EmergencyService = require('./models/EmergencyService');
const AuditLog = require('./models/AuditLog');
const { connectDB, getDBStatus, isDbConnected } = require('./config/db');

async function runVerification() {
  console.log('===============================================================');
  console.log('   SAFE PASSAGE - MONGODB CONNECTION & DATA STORAGE TEST       ');
  console.log('===============================================================');

  // Step 1: Connect to Database
  console.log('\n[TEST 1] Testing MongoDB Connection...');
  const conn = await connectDB();
  if (!conn || !isDbConnected()) {
    console.error('❌ Connection Failed! MongoDB is not connected.');
    process.exit(1);
  }
  console.log('✅ Connection Succeeded!');

  // Step 2: Verify Database Name
  console.log('\n[TEST 2] Verifying Database Name...');
  const dbName = mongoose.connection.name;
  console.log(`  Active Database Name: "${dbName}"`);
  if (dbName === 'safe_passage') {
    console.log('✅ Correct Database Name: "safe_passage" is in use.');
  } else {
    console.error(`❌ Unexpected Database Name: "${dbName}" (expected "safe_passage")`);
    process.exit(1);
  }

  // Step 3: Verify All Models Share the Same Connection
  console.log('\n[TEST 3] Verifying All Mongoose Models Use Same Connection...');
  const models = [
    { name: 'User', model: User },
    { name: 'Incident', model: Incident },
    { name: 'AssistanceRequest', model: AssistanceRequest },
    { name: 'CaseLog', model: CaseLog },
    { name: 'EmergencyService', model: EmergencyService },
    { name: 'AuditLog', model: AuditLog },
  ];

  for (const { name, model } of models) {
    const modelDbName = model.db.name;
    const isSame = model.db === mongoose.connection;
    console.log(`  - Model [${name}]: db="${modelDbName}", matches default connection: ${isSame}`);
    if (!isSame || modelDbName !== 'safe_passage') {
      console.error(`❌ Model ${name} is NOT using the verified safe_passage connection!`);
      process.exit(1);
    }
  }
  console.log('✅ All 6 Models verified on the same MongoDB connection.');

  // Step 4: Ensure Test User exists
  console.log('\n[TEST 4] Ensuring Test User exists in safe_passage DB...');
  let testUser = await User.findOne({ email: 'test_traveler_verification@safepassage.org' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Verification Traveler',
      email: 'test_traveler_verification@safepassage.org',
      passwordHash: 'Password123!',
      role: 'traveler',
      phone: '+1 555-0199',
    });
  }
  console.log(`  User Created/Found with ID: ${testUser._id}`);

  // Step 5: Create and Retrieve Test Incident in MongoDB
  console.log('\n[TEST 5] Testing Incident Creation & Retrieval in MongoDB...');
  const testIncidentRef = `TEST-REF-${Date.now()}`;
  const testIncident = await Incident.create({
    incidentReference: testIncidentRef,
    travelerId: testUser._id,
    category: 'Vehicle Breakdown',
    title: 'Verification Engine Stall Test',
    description: 'Vehicle radiator overheating during verification testing pipeline.',
    severity: 'High',
    location: {
      type: 'Point',
      coordinates: [79.8612, 6.9271],
      address: 'Galle Face Green, Colombo',
    },
    status: INCIDENT_STATUS.SUBMITTED,
  });
  console.log(`  Incident Document Created! ID: ${testIncident._id}`);

  // Query back from MongoDB
  const retrievedIncident = await Incident.findById(testIncident._id).populate('travelerId', 'name email');
  if (!retrievedIncident || retrievedIncident.incidentReference !== testIncidentRef) {
    console.error('❌ Failed to retrieve incident document from MongoDB!');
    process.exit(1);
  }
  console.log(`  Retrieved Incident Ref: "${retrievedIncident.incidentReference}"`);
  console.log(`  Populated Traveler: "${retrievedIncident.travelerId?.name}" (${retrievedIncident.travelerId?.email})`);
  console.log('✅ Incident Document successfully created and retrieved in MongoDB!');

  // Step 6: Create and Retrieve Test Assistance Request in MongoDB
  console.log('\n[TEST 6] Testing AssistanceRequest Creation & Retrieval in MongoDB...');
  const testRequest = await AssistanceRequest.create({
    incidentId: testIncident._id,
    travelerId: testUser._id,
    serviceType: 'Roadside Towing & Vehicle Repair',
    location: {
      type: 'Point',
      coordinates: [79.8612, 6.9271],
      address: 'Galle Face Green, Colombo',
    },
    status: 'Pending',
    dispatchNotes: 'Automated verification test dispatch request.',
    timeline: [
      {
        status: 'Pending',
        timestamp: new Date(),
        notes: 'Verification test generated dispatch.',
        updatedBy: testUser._id,
      },
    ],
  });
  console.log(`  AssistanceRequest Document Created! ID: ${testRequest._id}`);

  const retrievedRequest = await AssistanceRequest.findById(testRequest._id)
    .populate('incidentId', 'title category severity status')
    .populate('travelerId', 'name email');

  if (!retrievedRequest || String(retrievedRequest.incidentId?._id) !== String(testIncident._id)) {
    console.error('❌ Failed to retrieve assistance request from MongoDB!');
    process.exit(1);
  }
  console.log(`  Retrieved Request linked to Incident: "${retrievedRequest.incidentId?.title}"`);
  console.log(`  Populated Traveler: "${retrievedRequest.travelerId?.name}"`);
  console.log('✅ AssistanceRequest Document successfully created and retrieved in MongoDB!');

  // Step 7: Test Mongoose Validation Error Handling (Meaningful Errors)
  console.log('\n[TEST 7] Testing Meaningful Validation Errors on Invalid Incident...');
  let validationCaught = false;
  try {
    // Missing required fields: title, description, category
    await Incident.create({
      status: INCIDENT_STATUS.SUBMITTED,
    });
  } catch (err) {
    validationCaught = true;
    console.log(`  Validation Error Caught: "${err.message}"`);
  }
  if (!validationCaught) {
    console.error('❌ Mongoose did not catch validation error on invalid document!');
    process.exit(1);
  }
  console.log('✅ Meaningful validation error successfully caught and verified.');

  // Step 8: Clean up test documents
  console.log('\n[TEST 8] Cleaning up test documents...');
  await AssistanceRequest.findByIdAndDelete(testRequest._id);
  await Incident.findByIdAndDelete(testIncident._id);
  await User.findByIdAndDelete(testUser._id);
  console.log('✅ Test documents cleaned up cleanly.');

  console.log('\n===============================================================');
  console.log('   ALL DATABASE TESTS PASSED SUCCESSFULLY!                    ');
  console.log('===============================================================');

  await mongoose.disconnect();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});

