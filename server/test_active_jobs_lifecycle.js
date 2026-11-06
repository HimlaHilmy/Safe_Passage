const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const { Incident, INCIDENT_STATUS } = require('./models/Incident');
const AssistanceRequest = require('./models/AssistanceRequest');
const CaseLog = require('./models/CaseLog');
const assistanceController = require('./controllers/assistanceController');
const adminController = require('./controllers/adminController');
const incidentController = require('./controllers/incidentController');

// Helper to mock express req/res with Socket.IO capturing
function mockReqRes(reqData = {}) {
  const emittedEvents = [];

  const req = {
    user: reqData.user || {},
    query: reqData.query || {},
    params: reqData.params || {},
    body: reqData.body || {},
    app: {
      get: (key) => {
        if (key === 'io') {
          return {
            to: (room) => ({
              emit: (event, payload) => {
                emittedEvents.push({ room, event, payload });
              },
            }),
            emit: (event, payload) => {
              emittedEvents.push({ room: 'broadcast', event, payload });
            },
          };
        }
        return null;
      },
    },
  };

  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, next, emittedEvents };
}

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE: Complete Active Jobs Lifecycle in MongoDB');
  console.log('================================================================');

  await connectDB();

  // Find real accounts
  const traveler = await User.findOne({ role: 'traveler' });
  const admin = await User.findOne({ role: 'admin' });
  const provider = await User.findOne({ role: 'provider' });

  if (!traveler || !admin || !provider) {
    throw new Error('Required test accounts (traveler, admin, provider) not found!');
  }

  console.log('[Users Verified]');
  console.log(`- Traveler: ${traveler.name} (${traveler._id})`);
  console.log(`- Admin:    ${admin.name} (${admin._id})`);
  console.log(`- Provider: ${provider.name} (${provider._id})`);

  let testIncident = null;
  let testAssistReq = null;

  try {
    // ------------------------------------------------------------------------
    // SETUP: Create Incident & Assign Provider
    // ------------------------------------------------------------------------
    console.log('\n--- Setup: Traveler Submits Emergency & Admin Assigns Provider ---');
    const incRef = `SP-LIFE-${Math.floor(100000 + Math.random() * 900000)}`;
    testIncident = await Incident.create({
      incidentReference: incRef,
      travelerId: traveler._id,
      title: 'Engine Breakdown on Coastal Road',
      description: 'Vehicle radiator exploded, steam pouring out.',
      category: 'Roadside & Vehicle Breakdown',
      severity: 'High',
      location: {
        type: 'Point',
        coordinates: [79.8612, 6.9271],
        address: 'Galle Face Green, Colombo 03',
      },
      status: INCIDENT_STATUS.SUBMITTED,
    });
    console.log(`✓ Incident Created: ${testIncident.incidentReference} (_id: ${testIncident._id})`);

    // Admin Assigns Provider
    const { req: assignReq, res: assignRes } = mockReqRes({
      user: { id: admin._id, _id: admin._id, role: 'admin', name: admin.name },
      params: { id: testIncident._id.toString() },
      body: {
        status: INCIDENT_STATUS.ASSIGNED,
        assignedProviderId: provider._id.toString(),
        notes: 'Assigned to Apex Rapid Response.',
      },
    });
    await adminController.updateAdminIncident(assignReq, assignRes, (e) => { throw e; });
    if (assignRes.statusCode !== 200) throw new Error('Admin assignment failed!');

    testAssistReq = await AssistanceRequest.findOne({ incidentId: testIncident._id });
    if (!testAssistReq) throw new Error('AssistanceRequest not found!');
    console.log(`✓ Admin Assignment Complete. AssistanceRequest ID: ${testAssistReq._id}`);

    // ========================================================================
    // STAGE 1: ACCEPTED
    // ========================================================================
    console.log('\n================================================================');
    console.log('STAGE 1: ACCEPTED');
    console.log('================================================================');
    const { req: acceptReq, res: acceptRes, emittedEvents: acceptEvents } = mockReqRes({
      user: {
        id: provider._id,
        _id: provider._id,
        role: 'provider',
        name: provider.name,
        providerDetails: provider.providerDetails,
      },
      params: { id: testAssistReq._id.toString() },
      body: { action: 'accept', notes: 'Emergency response unit dispatched.' },
    });
    await assistanceController.respondToRequest(acceptReq, acceptRes, (e) => { throw e; });
    if (acceptRes.statusCode !== 200) throw new Error('Stage 1 accept failed!');

    // Verify in MongoDB:
    const assistStage1 = await AssistanceRequest.findById(testAssistReq._id);
    const incidentStage1 = await Incident.findById(testIncident._id);
    console.log(`✓ AssistanceRequest Status: "${assistStage1.status}"`);
    console.log(`✓ acceptedAt Timestamp: ${assistStage1.acceptedAt}`);
    console.log(`✓ Incident Status: "${incidentStage1.status}"`);
    if (assistStage1.status !== 'Accepted') throw new Error('Stage 1 status not Accepted!');
    if (!assistStage1.acceptedAt) throw new Error('Stage 1 acceptedAt timestamp missing!');
    if (incidentStage1.status !== INCIDENT_STATUS.ASSISTANCE_DISPATCHED) throw new Error('Incident status not Assistance Dispatched!');

    // Check Active Jobs Page Query
    const { req: activeReq1, res: activeRes1 } = mockReqRes({
      user: { id: provider._id, _id: provider._id, role: 'provider' },
      query: { filter: 'active' },
    });
    await assistanceController.getRequests(activeReq1, activeRes1, (e) => { throw e; });
    const inActive1 = activeRes1.data.data.find((r) => String(r._id) === String(testAssistReq._id));
    if (!inActive1) throw new Error('Accepted job not displayed in Active Jobs page!');
    console.log('✓ Stage 1 PASSED: Job is live in Active Jobs page.');

    // ========================================================================
    // STAGE 2: EN ROUTE
    // ========================================================================
    console.log('\n================================================================');
    console.log('STAGE 2: EN ROUTE');
    console.log('================================================================');
    const enRouteNotes = 'Unit 7 en route with heavy tow rig. ETA 8 minutes.';
    const { req: enRouteReq, res: enRouteRes, emittedEvents: enRouteEvents } = mockReqRes({
      user: { id: provider._id, _id: provider._id, role: 'provider', name: provider.name },
      params: { id: testAssistReq._id.toString() },
      body: { status: 'En Route', notes: enRouteNotes },
    });
    await assistanceController.updateJobStatus(enRouteReq, enRouteRes, (e) => { throw e; });
    if (enRouteRes.statusCode !== 200) throw new Error(`Stage 2 update failed: ${JSON.stringify(enRouteRes.data)}`);

    // Verify in MongoDB:
    const assistStage2 = await AssistanceRequest.findById(testAssistReq._id);
    console.log(`✓ AssistanceRequest Status: "${assistStage2.status}"`);
    console.log(`✓ enRouteAt Timestamp: ${assistStage2.enRouteAt}`);
    console.log(`✓ dispatchNotes: "${assistStage2.dispatchNotes}"`);
    if (assistStage2.status !== 'En Route') throw new Error('Stage 2 status not En Route!');
    if (!assistStage2.enRouteAt) throw new Error('Stage 2 enRouteAt timestamp missing!');
    if (assistStage2.dispatchNotes !== enRouteNotes) throw new Error('Stage 2 notes not saved!');

    // Verify CaseLog in MongoDB:
    const caseLogStage2 = await CaseLog.findOne({
      incidentId: testIncident._id,
      notes: enRouteNotes,
    });
    if (!caseLogStage2) throw new Error('Stage 2 CaseLog entry not saved in MongoDB!');
    console.log(`✓ CaseLog Created: "${caseLogStage2.notes}" (updater: ${caseLogStage2.updaterRole})`);

    // Verify Socket.IO:
    const enRouteTravelerSocket = enRouteEvents.find((e) => e.room === `user_${traveler._id}`);
    const enRouteAdminSocket = enRouteEvents.find((e) => e.room === 'role_admin');
    if (!enRouteTravelerSocket || !enRouteAdminSocket) throw new Error('Stage 2 Socket.IO notifications missing!');
    console.log('✓ Stage 2 PASSED: En Route persisted with timestamp, notes, CaseLog, and Socket notifications.');

    // ========================================================================
    // STAGE 3: ARRIVED ON SCENE
    // ========================================================================
    console.log('\n================================================================');
    console.log('STAGE 3: ARRIVED ON SCENE');
    console.log('================================================================');
    const arrivedNotes = 'Unit arrived at Galle Face. Hazard cones placed.';
    const { req: arrivedReq, res: arrivedRes, emittedEvents: arrivedEvents } = mockReqRes({
      user: { id: provider._id, _id: provider._id, role: 'provider', name: provider.name },
      params: { id: testAssistReq._id.toString() },
      body: { status: 'Arrived', notes: arrivedNotes },
    });
    await assistanceController.updateJobStatus(arrivedReq, arrivedRes, (e) => { throw e; });
    if (arrivedRes.statusCode !== 200) throw new Error(`Stage 3 update failed: ${JSON.stringify(arrivedRes.data)}`);

    // Verify in MongoDB:
    const assistStage3 = await AssistanceRequest.findById(testAssistReq._id);
    const incidentStage3 = await Incident.findById(testIncident._id);
    console.log(`✓ AssistanceRequest Status: "${assistStage3.status}"`);
    console.log(`✓ arrivedAt Timestamp: ${assistStage3.arrivedAt}`);
    console.log(`✓ Incident Status Synchronized: "${incidentStage3.status}"`);
    if (assistStage3.status !== 'Arrived') throw new Error('Stage 3 status not Arrived!');
    if (!assistStage3.arrivedAt) throw new Error('Stage 3 arrivedAt timestamp missing!');
    if (incidentStage3.status !== INCIDENT_STATUS.IN_PROGRESS) throw new Error('Incident status not In Progress!');

    // Verify CaseLog:
    const caseLogStage3 = await CaseLog.findOne({
      incidentId: testIncident._id,
      notes: arrivedNotes,
    });
    if (!caseLogStage3) throw new Error('Stage 3 CaseLog entry not saved in MongoDB!');
    console.log(`✓ CaseLog Created: "${caseLogStage3.notes}"`);
    console.log('✓ Stage 3 PASSED: Arrived status persisted, Incident moved to In Progress, CaseLog recorded.');

    // ========================================================================
    // STAGE 4: ASSISTANCE IN PROGRESS
    // ========================================================================
    console.log('\n================================================================');
    console.log('STAGE 4: ASSISTANCE IN PROGRESS');
    console.log('================================================================');
    const inProgressNotes = 'Replacing broken coolant hose and recharging battery.';
    const { req: progReq, res: progRes, emittedEvents: progEvents } = mockReqRes({
      user: { id: provider._id, _id: provider._id, role: 'provider', name: provider.name },
      params: { id: testAssistReq._id.toString() },
      body: { status: 'Assistance in Progress', notes: inProgressNotes },
    });
    await assistanceController.updateJobStatus(progReq, progRes, (e) => { throw e; });
    if (progRes.statusCode !== 200) throw new Error(`Stage 4 update failed: ${JSON.stringify(progRes.data)}`);

    // Verify in MongoDB:
    const assistStage4 = await AssistanceRequest.findById(testAssistReq._id);
    const incidentStage4 = await Incident.findById(testIncident._id);
    console.log(`✓ AssistanceRequest Status: "${assistStage4.status}"`);
    console.log(`✓ inProgressAt Timestamp: ${assistStage4.inProgressAt}`);
    console.log(`✓ Incident Status: "${incidentStage4.status}"`);
    if (assistStage4.status !== 'In Progress') throw new Error('Stage 4 status not In Progress!');
    if (!assistStage4.inProgressAt) throw new Error('Stage 4 inProgressAt timestamp missing!');
    if (incidentStage4.status !== INCIDENT_STATUS.IN_PROGRESS) throw new Error('Incident status not In Progress!');

    // Verify CaseLog:
    const caseLogStage4 = await CaseLog.findOne({
      incidentId: testIncident._id,
      notes: inProgressNotes,
    });
    if (!caseLogStage4) throw new Error('Stage 4 CaseLog entry not saved in MongoDB!');
    console.log(`✓ CaseLog Created: "${caseLogStage4.notes}"`);
    console.log('✓ Stage 4 PASSED: In Progress milestone persisted with timestamp and CaseLog.');

    // Check that Traveler endpoint returns latest progress:
    console.log('\n--- Checking Traveler Progress Visibility ---');
    const { req: travIncReq, res: travIncRes } = mockReqRes({
      user: { id: traveler._id, _id: traveler._id, role: 'traveler' },
      params: { id: testIncident._id.toString() },
    });
    await incidentController.getIncidentById(travIncReq, travIncRes, (e) => { throw e; });
    console.log(`  - Traveler sees Incident status: "${travIncRes.data.data.status}"`);
    if (travIncRes.data.data.status !== 'In Progress') throw new Error('Traveler cannot see latest Incident status!');

    const { req: travHistReq, res: travHistRes } = mockReqRes({
      user: { id: traveler._id, _id: traveler._id, role: 'traveler' },
      params: { id: testIncident._id.toString() },
    });
    await incidentController.getIncidentHistory(travHistReq, travHistRes, (e) => { throw e; });
    console.log(`  - Traveler sees CaseLog count: ${travHistRes.data.data.length} audit entries`);
    if (travHistRes.data.data.length < 4) throw new Error('Traveler history missing milestone logs!');
    console.log('✓ Traveler visibility verified: Traveler sees latest progress and full audit trail.');

    // ========================================================================
    // STAGE 5: COMPLETED
    // ========================================================================
    console.log('\n================================================================');
    console.log('STAGE 5: COMPLETED');
    console.log('================================================================');
    const completeNotes = 'Vehicle tested, coolant refilled, traveler safely resuming journey.';
    const { req: compReq, res: compRes, emittedEvents: compEvents } = mockReqRes({
      user: { id: provider._id, _id: provider._id, role: 'provider', name: provider.name },
      params: { id: testAssistReq._id.toString() },
      body: { status: 'Completed', notes: completeNotes },
    });
    await assistanceController.updateJobStatus(compReq, compRes, (e) => { throw e; });
    if (compRes.statusCode !== 200) throw new Error(`Stage 5 update failed: ${JSON.stringify(compRes.data)}`);

    // Verify in MongoDB:
    const assistStage5 = await AssistanceRequest.findById(testAssistReq._id);
    const incidentStage5 = await Incident.findById(testIncident._id);
    console.log(`✓ AssistanceRequest Status: "${assistStage5.status}"`);
    console.log(`✓ completedAt Timestamp: ${assistStage5.completedAt}`);
    console.log(`✓ Incident Status Synchronized: "${incidentStage5.status}"`);
    if (assistStage5.status !== 'Completed') throw new Error('Stage 5 status not Completed!');
    if (!assistStage5.completedAt) throw new Error('Stage 5 completedAt timestamp missing!');
    if (incidentStage5.status !== INCIDENT_STATUS.RESOLVED) throw new Error('Incident status not Resolved!');

    // Verify Final CaseLog in MongoDB:
    const caseLogStage5 = await CaseLog.findOne({
      incidentId: testIncident._id,
      notes: completeNotes,
    });
    if (!caseLogStage5) throw new Error('Stage 5 CaseLog entry not saved in MongoDB!');
    console.log(`✓ Final CaseLog Created: "${caseLogStage5.notes}"`);

    // Check Active Jobs Page Query: Should NO LONGER appear in Active Jobs!
    console.log('\n--- Checking Active Jobs vs Job History Isolation ---');
    const { req: activeReqFinal, res: activeResFinal } = mockReqRes({
      user: { id: provider._id, _id: provider._id, role: 'provider' },
      query: { filter: 'active' },
    });
    await assistanceController.getRequests(activeReqFinal, activeResFinal, (e) => { throw e; });
    const inActiveFinal = activeResFinal.data.data.find((r) => String(r._id) === String(testAssistReq._id));
    if (inActiveFinal) throw new Error('Completed job should NOT appear in Active Jobs pool!');
    console.log('✓ Completed job is removed from Active Jobs page.');

    // Check Job History Page Query (filter=history): MUST appear in Job History!
    const { req: histReq, res: histRes } = mockReqRes({
      user: { id: provider._id, _id: provider._id, role: 'provider' },
      query: { filter: 'history' },
    });
    await assistanceController.getRequests(histReq, histRes, (e) => { throw e; });
    const inHistory = histRes.data.data.find((r) => String(r._id) === String(testAssistReq._id));
    if (!inHistory) throw new Error('Completed job MUST appear in Job History page (filter=history)!');
    console.log(`✓ Completed job is present in Job History page: "${inHistory.serviceType}" (Status: ${inHistory.status})`);
    console.log('✓ Stage 5 PASSED: Completed status saved, Incident Resolved, and job moved to Job History.');

    console.log('\n================================================================');
    console.log('ALL ACTIVE JOBS LIFECYCLE REQUIREMENTS SUCCESSFULLY PASSED!');
    console.log('================================================================\n');
  } finally {
    console.log('[Cleanup] Cleaning up test records from MongoDB...');
    if (testIncident) {
      await Incident.deleteOne({ _id: testIncident._id });
      await CaseLog.deleteMany({ incidentId: testIncident._id });
    }
    if (testAssistReq) {
      await AssistanceRequest.deleteOne({ _id: testAssistReq._id });
    }
    console.log('[Cleanup] Done.');
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});

