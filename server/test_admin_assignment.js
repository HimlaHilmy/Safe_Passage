const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');

const { connectDB, isDbConnected } = require('./config/db');
const User = require('./models/User');
const { Incident, INCIDENT_STATUS } = require('./models/Incident');
const AssistanceRequest = require('./models/AssistanceRequest');
const CaseLog = require('./models/CaseLog');
const adminController = require('./controllers/adminController');

async function testAdminAssignment() {
  console.log('===============================================================');
  console.log('   ADMIN INCIDENT MANAGEMENT & PROVIDER ASSIGNMENT TEST        ');
  console.log('===============================================================');

  // Step 1: Connect to MongoDB
  console.log('\n[STEP 1] Connecting to MongoDB...');
  await connectDB();
  if (!isDbConnected()) {
    console.error('❌ Database connection failed!');
    process.exit(1);
  }
  console.log(`✅ Connected to Database: "${mongoose.connection.name}"`);

  // Step 2: Ensure Admin, Traveler, and Provider accounts exist in MongoDB
  console.log('\n[STEP 2] Verifying Admin, Traveler, and Provider Accounts in MongoDB...');
  let adminUser = await User.findOne({ email: 'admin@safepassage.org' });
  if (!adminUser) {
    adminUser = await User.create({
      _id: new mongoose.Types.ObjectId('65e000000000000000000003'),
      name: 'Himla (Admin Lead)',
      email: 'admin@safepassage.org',
      passwordHash: 'Password123!',
      role: 'admin',
      phone: '+1 (555) 000-1122',
      accountStatus: 'active',
    });
  }

  let travelerUser = await User.findOne({ email: 'traveler@safepassage.org' });
  if (!travelerUser) {
    travelerUser = await User.create({
      _id: new mongoose.Types.ObjectId('65e000000000000000000001'),
      name: 'Sarah Jenkins',
      email: 'traveler@safepassage.org',
      passwordHash: 'Password123!',
      role: 'traveler',
      phone: '+1 (555) 234-5678',
      accountStatus: 'active',
    });
  }

  let providerUser = await User.findOne({ email: 'provider@safepassage.org' });
  if (!providerUser) {
    providerUser = await User.create({
      _id: new mongoose.Types.ObjectId('65e000000000000000000002'),
      name: 'Apex Rapid Response Ltd',
      email: 'provider@safepassage.org',
      passwordHash: 'Password123!',
      role: 'provider',
      phone: '+1 (555) 987-6543',
      accountStatus: 'active',
      providerDetails: {
        serviceTypes: ['Roadside & Towing', 'Medical First Response'],
        licenseNumber: 'SRI-EMERG-2024-88',
        verified: true,
        isAvailable: true,
        currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
      },
    });
  }
  console.log(`✅ Admin: "${adminUser.name}" (${adminUser._id})`);
  console.log(`✅ Traveler: "${travelerUser.name}" (${travelerUser._id})`);
  console.log(`✅ Provider: "${providerUser.name}" (${providerUser._id})`);

  // Step 3: Mock Express Request, Response, and Socket.io
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

  const createMockReqRes = (params = {}, body = {}, query = {}, user = adminUser) => {
    let statusCode = 200;
    let jsonResponse = null;

    const req = {
      params,
      body,
      query,
      user,
      ip: '127.0.0.1',
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

  // Step 4: Create a newly submitted emergency incident in MongoDB
  console.log('\n[STEP 4] Creating Newly Submitted Emergency Incident in MongoDB...');
  const testIncidentRef = `SP-REF-TEST-${Date.now().toString().slice(-4)}`;
  const testIncident = await Incident.create({
    incidentReference: testIncidentRef,
    referenceNumber: testIncidentRef,
    travelerId: travelerUser._id,
    category: 'Roadside & Vehicle Breakdown',
    title: 'Severe Transmission Failure on Coastal Highway',
    description: 'Vehicle transmission locked on highway shoulder. Immediate tow dispatch required.',
    severity: 'High',
    incidentDate: new Date(),
    location: {
      type: 'Point',
      coordinates: [79.8653, 6.9189],
      address: 'Marine Drive Mile Marker 12, Colombo',
      landmark: 'Near Lighthouse Restaurant',
    },
    status: INCIDENT_STATUS.SUBMITTED,
  });
  console.log(`✅ Incident Created in MongoDB! ID: ${testIncident._id}, Status: ${testIncident.status}`);

  // Step 5: Admin retrieves all real incidents from MongoDB
  console.log('\n[STEP 5] Testing Admin Incident Retrieval from MongoDB (getAdminIncidents)...');
  const { req: getIncReq, res: getIncRes, getResult: getIncResult } = createMockReqRes({}, {}, { status: 'Submitted' });
  await adminController.getAdminIncidents(getIncReq, getIncRes, (err) => console.error(err));
  const incListResult = getIncResult();

  console.log(`  Response Status Code: ${incListResult.statusCode}`);
  console.log(`  Total Incidents Found: ${incListResult.jsonResponse?.count}`);

  const foundInList = incListResult.jsonResponse?.data?.find(
    (i) => String(i._id) === String(testIncident._id)
  );
  if (!foundInList) {
    console.error('❌ Created incident was not returned in admin incidents list!');
    process.exit(1);
  }
  console.log(`✅ Newly submitted incident found in MongoDB list: "${foundInList.title}"`);

  // Step 6: Admin inspects incident details
  console.log('\n[STEP 6] Testing Admin Incident Inspection (getAdminIncidentById)...');
  const { req: inspReq, res: inspRes, getResult: getInspResult } = createMockReqRes({ id: testIncident._id.toString() });
  await adminController.getAdminIncidentById(inspReq, inspRes, (err) => console.error(err));
  const inspResult = getInspResult();

  if (inspResult.statusCode !== 200 || !inspResult.jsonResponse?.data) {
    console.error('❌ Failed to inspect incident details!');
    process.exit(1);
  }
  console.log(`✅ Admin Inspected Incident Details: Ref="${inspResult.jsonResponse.data.incidentReference}", Traveler="${inspResult.jsonResponse.data.travelerId?.name}"`);

  // Step 7: Admin changes status to "Under Review"
  console.log('\n[STEP 7] Testing Admin Status Transition to "Under Review"...');
  const { req: reviewReq, res: reviewRes, getResult: getReviewResult } = createMockReqRes(
    { id: testIncident._id.toString() },
    { status: 'Under Review', notes: 'Incident triaged and placed under active review by dispatch team.' }
  );
  await adminController.updateAdminIncident(reviewReq, reviewRes, (err) => console.error(err));
  const reviewResult = getReviewResult();

  console.log(`  Response Status: ${reviewResult.statusCode}`);
  console.log(`  New Incident Status: "${reviewResult.jsonResponse?.data?.status}"`);

  if (reviewResult.jsonResponse?.data?.status !== 'Under Review') {
    console.error('❌ Status was not updated to "Under Review"!');
    process.exit(1);
  }
  console.log('✅ Incident status successfully transitioned to "Under Review" in MongoDB.');

  // Step 8: Admin retrieves available service providers from MongoDB
  console.log('\n[STEP 8] Testing Available Service Providers Retrieval (getAdminProviders)...');
  const { req: provReq, res: provRes, getResult: getProvResult } = createMockReqRes();
  await adminController.getAdminProviders(provReq, provRes, (err) => console.error(err));
  const provResult = getProvResult();

  console.log(`  Available Providers Found: ${provResult.jsonResponse?.count}`);
  const foundProvider = provResult.jsonResponse?.data?.find(
    (p) => String(p._id) === String(providerUser._id)
  );
  if (!foundProvider) {
    console.error('❌ Provider was not found in available providers list!');
    process.exit(1);
  }
  console.log(`✅ Verified Provider in MongoDB: "${foundProvider.name}" (Services: ${foundProvider.providerDetails?.serviceTypes?.join(', ')})`);

  // Step 9: Admin Assigns Provider to Incident
  console.log('\n[STEP 9] Testing Admin Service Provider Assignment...');
  const { req: assignReq, res: assignRes, getResult: getAssignResult } = createMockReqRes(
    { id: testIncident._id.toString() },
    {
      assignedProviderId: providerUser._id.toString(),
      estimatedArrivalTimeMinutes: 15,
      notes: 'Dispatched Apex Rapid Response unit with flatbed tow truck.',
    }
  );
  await adminController.updateAdminIncident(assignReq, assignRes, (err) => console.error(err));
  const assignResult = getAssignResult();

  console.log(`  Assignment Response Status: ${assignResult.statusCode}`);
  console.log(`  Success Message: "${assignResult.jsonResponse?.message}"`);
  console.log(`  Incident Status: "${assignResult.jsonResponse?.data?.status}"`);
  console.log(`  Assigned Provider: "${assignResult.jsonResponse?.data?.assignedProviderId?.name}"`);

  if (assignResult.statusCode !== 200 || assignResult.jsonResponse?.data?.status !== 'Assigned') {
    console.error('❌ Incident status was not updated to "Assigned"!');
    process.exit(1);
  }
  console.log('✅ Incident updated to "Assigned" with provider ID.');

  // Step 10: Verify Incident Document in MongoDB
  console.log('\n[STEP 10] Verifying Incident Document in MongoDB...');
  const updatedIncidentDb = await Incident.findById(testIncident._id);
  console.log(`  DB Incident Status: ${updatedIncidentDb.status}`);
  console.log(`  DB Assigned Provider ID: ${updatedIncidentDb.assignedProviderId}`);
  console.log(`  DB ETA Minutes: ${updatedIncidentDb.estimatedArrivalTimeMinutes}`);

  if (
    updatedIncidentDb.status !== 'Assigned' ||
    String(updatedIncidentDb.assignedProviderId) !== String(providerUser._id)
  ) {
    console.error('❌ Incident document in MongoDB does not reflect provider assignment!');
    process.exit(1);
  }
  console.log('✅ Incident document correctly verified in MongoDB.');

  // Step 11: Verify AssistanceRequest Document in MongoDB (Connected Collection)
  console.log('\n[STEP 11] Verifying AssistanceRequest Document in MongoDB...');
  const assistReqDb = await AssistanceRequest.findOne({ incidentId: testIncident._id });

  if (!assistReqDb) {
    console.error('❌ No AssistanceRequest document was created in MongoDB!');
    process.exit(1);
  }

  console.log(`  AssistanceRequest ID: ${assistReqDb._id}`);
  console.log(`  Linked Incident ID: ${assistReqDb.incidentId}`);
  console.log(`  Traveler ID: ${assistReqDb.travelerId}`);
  console.log(`  Provider ID: ${assistReqDb.providerId}`);
  console.log(`  Service Type: "${assistReqDb.serviceType}"`);
  console.log(`  Location Coordinates: [${assistReqDb.location?.coordinates.join(', ')}]`);
  console.log(`  Status: "${assistReqDb.status}"`);
  console.log(`  Timeline Entries: ${assistReqDb.timeline?.length}`);

  if (
    String(assistReqDb.incidentId) !== String(testIncident._id) ||
    String(assistReqDb.travelerId) !== String(travelerUser._id) ||
    String(assistReqDb.providerId) !== String(providerUser._id) ||
    assistReqDb.status !== 'Pending'
  ) {
    console.error('❌ AssistanceRequest fields do not match assignment requirements!');
    process.exit(1);
  }
  console.log('✅ AssistanceRequest document verified in MongoDB with all linked fields.');

  // Step 12: Verify Incident History Log (CaseLog) in MongoDB
  console.log('\n[STEP 12] Verifying Incident History Log (CaseLog) in MongoDB...');
  const caseLogs = await CaseLog.find({ incidentId: testIncident._id }).sort({ timestamp: 1 });
  console.log(`  CaseLogs recorded: ${caseLogs.length}`);

  const assignmentLog = caseLogs.find((l) => l.newStatus === 'Assigned');
  if (!assignmentLog) {
    console.error('❌ No CaseLog entry found for assignment transition!');
    process.exit(1);
  }
  console.log(`  Assignment Log ID: ${assignmentLog._id}`);
  console.log(`  Transition: ${assignmentLog.previousStatus} -> ${assignmentLog.newStatus}`);
  console.log(`  Notes: "${assignmentLog.notes}"`);
  console.log('✅ Incident history log verified in MongoDB.');

  // Step 13: Verify Real-Time Socket Notifications (Provider & Traveler)
  console.log('\n[STEP 13] Verifying Socket Notifications to Provider & Traveler...');
  const providerNotifications = emittedEvents.filter(
    (e) => (e.room === `user_${providerUser._id}` || e.room === 'role_provider') && e.event === 'new_assistance_request'
  );
  const travelerNotifications = emittedEvents.filter(
    (e) => (e.room === `user_${travelerUser._id}` || e.room === `incident_${testIncident._id}`) && e.event === 'incident_updated'
  );

  console.log(`  Provider Notifications Emitted: ${providerNotifications.length}`);
  console.log(`  Traveler Notifications Emitted: ${travelerNotifications.length}`);

  if (providerNotifications.length === 0) {
    console.error('❌ Selected provider was not notified via Socket.io!');
    process.exit(1);
  }
  if (travelerNotifications.length === 0) {
    console.error('❌ Traveler was not notified via Socket.io!');
    process.exit(1);
  }
  console.log('✅ Both Provider and Traveler real-time notifications verified.');

  // Step 14: Test Idempotency / Prevent Duplicate Requests
  console.log('\n[STEP 14] Testing Prevention of Duplicate AssistanceRequests for Same Incident...');
  const { req: reassignReq, res: reassignRes, getResult: getReassignResult } = createMockReqRes(
    { id: testIncident._id.toString() },
    {
      assignedProviderId: providerUser._id.toString(),
      estimatedArrivalTimeMinutes: 10,
      notes: 'Updated dispatch notes: provider confirmed vehicle en-route ETA 10m.',
    }
  );
  await adminController.updateAdminIncident(reassignReq, reassignRes, (err) => console.error(err));
  const reassignResult = getReassignResult();

  const totalRequestsForIncident = await AssistanceRequest.countDocuments({ incidentId: testIncident._id });
  console.log(`  Total AssistanceRequest documents for this incident: ${totalRequestsForIncident}`);

  if (totalRequestsForIncident !== 1) {
    console.error(`❌ Duplicate AssistanceRequest detected! Count is ${totalRequestsForIncident} (expected 1)`);
    process.exit(1);
  }
  console.log('✅ Idempotency verified: Exactly 1 AssistanceRequest exists for the incident.');

  // Step 15: Clean up test documents
  console.log('\n[STEP 15] Cleaning up test documents...');
  await AssistanceRequest.deleteMany({ incidentId: testIncident._id });
  await CaseLog.deleteMany({ incidentId: testIncident._id });
  await Incident.findByIdAndDelete(testIncident._id);
  console.log('✅ Test documents cleaned up cleanly.');

  console.log('\n===============================================================');
  console.log('   ALL ADMIN MANAGEMENT & ASSIGNMENT TESTS PASSED!             ');
  console.log('===============================================================');

  await mongoose.disconnect();
  process.exit(0);
}

testAdminAssignment().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});

