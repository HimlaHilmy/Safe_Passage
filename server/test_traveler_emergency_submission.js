const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { connectDB, isDbConnected } = require('./config/db');
const User = require('./models/User');
const { Incident, INCIDENT_STATUS } = require('./models/Incident');
const CaseLog = require('./models/CaseLog');
const incidentController = require('./controllers/incidentController');

async function testTravelerSubmission() {
  console.log('===============================================================');
  console.log('   TRAVELER EMERGENCY SUBMISSION FUNCTIONALITY TEST           ');
  console.log('===============================================================');

  // Step 1: Connect to MongoDB
  console.log('\n[STEP 1] Connecting to MongoDB...');
  await connectDB();
  if (!isDbConnected()) {
    console.error('❌ Database connection failed!');
    process.exit(1);
  }
  console.log(`✅ Connected to Database: "${mongoose.connection.name}"`);

  // Step 2: Ensure actual traveler account exists in MongoDB
  console.log('\n[STEP 2] Verifying Actual Traveler Account in MongoDB...');
  let traveler = await User.findOne({ email: 'traveler@safepassage.org' });
  if (!traveler) {
    traveler = await User.create({
      _id: new mongoose.Types.ObjectId('65e000000000000000000001'),
      name: 'Sarah Jenkins',
      email: 'traveler@safepassage.org',
      passwordHash: 'Password123!',
      role: 'traveler',
      phone: '+1 (555) 234-5678',
      accountStatus: 'active',
    });
    console.log('  Created Traveler Account in MongoDB.');
  }
  console.log(`✅ Verified Traveler: "${traveler.name}" (${traveler.email}), ID: ${traveler._id}`);

  // Step 3: Mock Express Request, Response, and App IO
  const emittedEvents = [];
  const mockIo = {
    to: (room) => ({
      emit: (event, payload) => {
        emittedEvents.push({ room, event, payload });
      },
    }),
    emit: (event, payload) => {
      emittedEvents.push({ room: 'broadcast', event, payload });
    },
  };

  const createMockReqRes = (body, user) => {
    let statusCode = 200;
    let jsonResponse = null;

    const req = {
      body,
      user,
      app: {
        get: (key) => (key === 'io' ? mockIo : null),
      },
    };

    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        jsonResponse = data;
        return res;
      },
    };

    return { req, res, getResult: () => ({ statusCode, jsonResponse }) };
  };

  // Step 4: Test Field Validation (Missing title/description/invalid category)
  console.log('\n[STEP 4] Testing Field Validation Error Handling...');
  const { req: invalidReq, res: invalidRes, getResult: getInvalidResult } = createMockReqRes(
    {
      category: 'InvalidCategory',
      title: 'No',
      description: 'Too short',
    },
    traveler
  );

  await incidentController.createIncident(invalidReq, invalidRes, (err) => console.error(err));
  const invalidResult = getInvalidResult();
  console.log(`  Invalid Submission Response Status: ${invalidResult.statusCode}`);
  console.log(`  Error Message: "${invalidResult.jsonResponse?.message}"`);

  if (invalidResult.statusCode !== 400 || invalidResult.jsonResponse?.success !== false) {
    console.error('❌ Field validation failed to reject invalid payload!');
    process.exit(1);
  }
  console.log('✅ Field validation successfully rejected invalid emergency submission with HTTP 400.');

  // Step 5: Test Successful Traveler Emergency Submission
  console.log('\n[STEP 5] Submitting Valid Emergency Incident by Traveler...');
  const validPayload = {
    category: 'Vehicle Breakdown',
    title: 'Severe Radiator Leak on Mountain Pass',
    description: 'Vehicle engine overheated with white steam near Ella mountain curve. Passengers stranded.',
    severity: 'High',
    incidentDate: new Date().toISOString(),
    location: {
      type: 'Point',
      coordinates: [81.0466, 6.8667],
      address: 'Ella-Wellawaya Road, Badulla District',
      landmark: 'Near Ravana Waterfall curve',
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
        type: 'image',
        caption: 'Overheating engine and steam',
        uploadedAt: new Date(),
      },
    ],
  };

  const { req: validReq, res: validRes, getResult: getValidResult } = createMockReqRes(validPayload, traveler);

  await incidentController.createIncident(validReq, validRes, (err) => console.error(err));
  const validResult = getValidResult();

  console.log(`  Submission Status Code: ${validResult.statusCode}`);
  console.log(`  Success Flag: ${validResult.jsonResponse?.success}`);
  console.log(`  Incident Reference: "${validResult.jsonResponse?.data?.incidentReference}"`);
  console.log(`  Assigned Incident ID: "${validResult.jsonResponse?.data?._id}"`);

  if (validResult.statusCode !== 201 || !validResult.jsonResponse?.data?._id) {
    console.error('❌ Incident creation did not return 201 with saved document!');
    process.exit(1);
  }

  const createdIncidentId = validResult.jsonResponse.data._id;
  const createdRef = validResult.jsonResponse.data.incidentReference;
  console.log('✅ Emergency incident returned successfully to frontend with HTTP 201.');

  // Step 6: Verify Persistence in MongoDB
  console.log('\n[STEP 6] Verifying Saved Incident in MongoDB Database...');
  const dbIncident = await Incident.findById(createdIncidentId).populate('travelerId', 'name email role');

  if (!dbIncident) {
    console.error('❌ Incident was NOT found in MongoDB!');
    process.exit(1);
  }

  console.log(`  Found in DB ID: ${dbIncident._id}`);
  console.log(`  DB Reference: ${dbIncident.incidentReference}`);
  console.log(`  DB Status: ${dbIncident.status}`);
  console.log(`  DB Traveler: ${dbIncident.travelerId?.name} (${dbIncident.travelerId?.email})`);
  console.log(`  DB Coordinates: [${dbIncident.location?.coordinates.join(', ')}]`);
  console.log(`  DB Address: ${dbIncident.location?.address}`);
  console.log(`  DB Media attached: ${dbIncident.media?.length} item(s)`);

  if (dbIncident.status !== INCIDENT_STATUS.SUBMITTED) {
    console.error(`❌ Unexpected status in DB: ${dbIncident.status} (expected Submitted)`);
    process.exit(1);
  }

  if (dbIncident.incidentReference !== createdRef) {
    console.error(`❌ Reference mismatch in DB!`);
    process.exit(1);
  }

  if (!dbIncident.media || dbIncident.media.length === 0 || !dbIncident.media[0].url) {
    console.error(`❌ Uploaded image references were not stored!`);
    process.exit(1);
  }
  console.log('✅ Incident properly verified in MongoDB with all required fields & images.');

  // Step 7: Verify Incident History Log (CaseLog) in MongoDB
  console.log('\n[STEP 7] Verifying Initial CaseLog (Incident History) in MongoDB...');
  const caseLogs = await CaseLog.find({ incidentId: createdIncidentId });
  console.log(`  CaseLogs found for Incident: ${caseLogs.length}`);

  if (caseLogs.length === 0) {
    console.error('❌ No CaseLog was created for this incident in MongoDB!');
    process.exit(1);
  }

  const initialLog = caseLogs[0];
  console.log(`  Log ID: ${initialLog._id}`);
  console.log(`  Log Action/Status: ${initialLog.previousStatus} -> ${initialLog.newStatus}`);
  console.log(`  Log Updater Role: ${initialLog.updaterRole}`);
  console.log(`  Log Notes: "${initialLog.notes}"`);

  if (initialLog.newStatus !== 'Submitted') {
    console.error(`❌ Unexpected CaseLog newStatus: ${initialLog.newStatus}`);
    process.exit(1);
  }
  console.log('✅ CaseLog history entry verified in MongoDB.');

  // Step 8: Verify Admin Notification via Socket.io
  console.log('\n[STEP 8] Verifying Admin Dashboard Socket Notification...');
  const adminEvents = emittedEvents.filter(
    (e) => (e.room === 'role_admin' || e.room === 'broadcast') && e.event === 'new_incident_alert'
  );
  console.log(`  Admin Notification Events Emitted: ${adminEvents.length}`);

  if (adminEvents.length === 0) {
    console.error('❌ No new_incident_alert socket event emitted to admin!');
    process.exit(1);
  }
  console.log('✅ Admin Dashboard real-time socket notification verified.');

  // Step 9: Clean up test documents
  console.log('\n[STEP 9] Cleaning up test incident...');
  await CaseLog.deleteMany({ incidentId: createdIncidentId });
  await Incident.findByIdAndDelete(createdIncidentId);
  console.log('✅ Test incident and its logs cleaned up.');

  console.log('\n===============================================================');
  console.log('   ALL TRAVELER SUBMISSION REQUIREMENTS VERIFIED & PASSED!    ');
  console.log('===============================================================');

  await mongoose.disconnect();
  process.exit(0);
}

testTravelerSubmission().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});

