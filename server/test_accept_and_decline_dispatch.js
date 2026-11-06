const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const { Incident, INCIDENT_STATUS } = require('./models/Incident');
const AssistanceRequest = require('./models/AssistanceRequest');
const CaseLog = require('./models/CaseLog');
const assistanceController = require('./controllers/assistanceController');
const adminController = require('./controllers/adminController');

// Helper to mock express req/res with Socket.IO capture
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
  console.log('TEST SUITE: Accept & Dispatch and Decline Functionality');
  console.log('================================================================');

  await connectDB();

  // Find real accounts
  const traveler = await User.findOne({ role: 'traveler' });
  const admin = await User.findOne({ role: 'admin' });
  const providers = await User.find({ role: 'provider' }).limit(2);

  if (!traveler || !admin || providers.length < 2) {
    throw new Error('Required test accounts (traveler, admin, 2 providers) not found!');
  }

  const provider1 = providers[0];
  const provider2 = providers[1];

  console.log('[Users Verified]');
  console.log(`- Traveler: ${traveler.name} (${traveler._id}) Phone: ${traveler.phone}`);
  console.log(`- Admin:    ${admin.name} (${admin._id})`);
  console.log(`- Provider 1: ${provider1.name} (${provider1._id})`);
  console.log(`- Provider 2: ${provider2.name} (${provider2._id})`);

  const createdIncidentIds = [];
  const createdAssistIds = [];

  try {
    // ========================================================================
    // SCENARIO 1: ACCEPT & DISPATCH WORKFLOW
    // ========================================================================
    console.log('\n================================================================');
    console.log('SCENARIO 1: ACCEPT & DISPATCH WORKFLOW');
    console.log('================================================================');

    // Step 1.1: Traveler submits an incident
    const incRef1 = `SP-ACC-${Math.floor(100000 + Math.random() * 900000)}`;
    const incident1 = await Incident.create({
      incidentReference: incRef1,
      travelerId: traveler._id,
      title: 'Flat Tire on Southern Expressway Exit 4',
      description: 'Rear right tire blown out, stranded safely on shoulder.',
      category: 'Roadside & Vehicle Breakdown',
      severity: 'Medium',
      location: {
        type: 'Point',
        coordinates: [79.9123, 6.8211],
        address: 'Southern Expressway, Kottawa Interchange',
      },
      status: INCIDENT_STATUS.SUBMITTED,
    });
    createdIncidentIds.push(incident1._id);
    console.log(`✓ Incident 1 created: ${incRef1} (_id: ${incident1._id})`);

    // Step 1.2: Admin assigns Provider 1 to Incident 1
    const { req: assignReq1, res: assignRes1 } = mockReqRes({
      user: { id: admin._id, _id: admin._id, role: 'admin', name: admin.name },
      params: { id: incident1._id.toString() },
      body: {
        status: INCIDENT_STATUS.ASSIGNED,
        assignedProviderId: provider1._id.toString(),
        notes: 'Admin dispatched Apex Rapid Response for tire replacement.',
      },
    });
    await adminController.updateAdminIncident(assignReq1, assignRes1, (e) => { throw e; });
    if (assignRes1.statusCode !== 200) {
      throw new Error(`Admin assignment failed: ${JSON.stringify(assignRes1.data)}`);
    }

    const assistReq1 = await AssistanceRequest.findOne({ incidentId: incident1._id });
    if (!assistReq1) throw new Error('AssistanceRequest 1 not found in MongoDB!');
    createdAssistIds.push(assistReq1._id);
    console.log(`✓ Admin assigned Provider 1. AssistanceRequest ID: ${assistReq1._id}, status: ${assistReq1.status}`);

    // Requirement 1: Verify request belongs to authenticated provider
    console.log('\n--- Requirement 1: Verify Ownership (Negative Check) ---');
    const { req: unauthAcceptReq, res: unauthAcceptRes } = mockReqRes({
      user: { id: provider2._id, _id: provider2._id, role: 'provider', name: provider2.name },
      params: { id: assistReq1._id.toString() },
      body: { action: 'accept' },
    });
    await assistanceController.respondToRequest(unauthAcceptReq, unauthAcceptRes, (e) => { throw e; });
    console.log(`  - Provider 2 accept attempt status: ${unauthAcceptRes.statusCode} (${unauthAcceptRes.data.error})`);
    if (unauthAcceptRes.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden for wrong provider, got ${unauthAcceptRes.statusCode}`);
    }
    console.log('✓ Requirement 1 PASSED: Unassigned/unauthorized provider cannot accept another provider\'s request.');

    // Requirement 2, 3, 4, 5, 6, 7, 8, 9: Provider 1 Accepts Dispatch
    console.log('\n--- Requirements 2-9: Provider 1 Accepts Dispatch ---');
    const { req: acceptReq, res: acceptRes, emittedEvents: acceptEvents } = mockReqRes({
      user: {
        id: provider1._id,
        _id: provider1._id,
        role: 'provider',
        name: provider1.name,
        phone: provider1.phone,
        providerDetails: provider1.providerDetails,
      },
      params: { id: assistReq1._id.toString() },
      body: { action: 'accept', notes: 'Tow truck deployed, ETA 12 minutes.' },
    });
    await assistanceController.respondToRequest(acceptReq, acceptRes, (e) => { throw e; });
    console.log(`  - Provider 1 accept response status: ${acceptRes.statusCode}`);
    if (acceptRes.statusCode !== 200 || !acceptRes.data.success) {
      throw new Error(`Accept failed: ${JSON.stringify(acceptRes.data)}`);
    }

    const acceptedData = acceptRes.data.data;
    // Requirement 4: Update AssistanceRequest status to Accepted
    console.log(`  - AssistanceRequest status: "${acceptedData.status}"`);
    if (acceptedData.status !== 'Accepted') throw new Error(`Expected status 'Accepted', got ${acceptedData.status}`);
    console.log('✓ Requirement 4 PASSED: AssistanceRequest status updated to Accepted.');

    // Requirement 5: Save acceptedAt timestamp
    console.log(`  - acceptedAt timestamp: ${acceptedData.acceptedAt}`);
    if (!acceptedData.acceptedAt) throw new Error('acceptedAt timestamp is missing!');
    console.log('✓ Requirement 5 PASSED: acceptedAt timestamp saved.');

    // Requirement 6: Update corresponding Incident status to Assistance Dispatched
    const syncedIncident1 = await Incident.findById(incident1._id);
    console.log(`  - Synchronized Incident status: "${syncedIncident1.status}"`);
    if (syncedIncident1.status !== INCIDENT_STATUS.ASSISTANCE_DISPATCHED) {
      throw new Error(`Expected Incident status 'Assistance Dispatched', got ${syncedIncident1.status}`);
    }
    console.log('✓ Requirement 6 PASSED: Corresponding Incident status updated to Assistance Dispatched.');

    // Requirement 7: Unlock authorized traveler contact information
    console.log(`  - Unlocked traveler name:  "${acceptedData.travelerId?.name}"`);
    console.log(`  - Unlocked traveler phone: "${acceptedData.travelerId?.phone}"`);
    if (acceptedData.travelerId?.phone !== traveler.phone) {
      throw new Error(`Traveler phone not unlocked! Expected ${traveler.phone}, got ${acceptedData.travelerId?.phone}`);
    }
    console.log('✓ Requirement 7 PASSED: Full traveler contact information unlocked.');

    // Requirement 8: Create an incident history log
    const caseLog1 = await CaseLog.findOne({
      incidentId: incident1._id,
      newStatus: INCIDENT_STATUS.ASSISTANCE_DISPATCHED,
    });
    if (!caseLog1) throw new Error('CaseLog audit record not found!');
    console.log(`  - CaseLog entry notes: "${caseLog1.notes}"`);
    console.log('✓ Requirement 8 PASSED: Incident history log (CaseLog) created.');

    // Requirement 9: Notify traveler and admin through Socket.IO
    console.log(`  - Total Socket.IO events emitted: ${acceptEvents.length}`);
    const travelerSocket = acceptEvents.find((e) => e.room === `user_${traveler._id}`);
    const adminSocket = acceptEvents.find((e) => e.room === 'role_admin');
    const incidentSocket = acceptEvents.find((e) => e.room === `incident_${incident1._id}`);
    if (!travelerSocket) throw new Error('Missing Socket.IO notification to traveler channel!');
    if (!adminSocket) throw new Error('Missing Socket.IO notification to admin channel!');
    if (!incidentSocket) throw new Error('Missing Socket.IO notification to incident channel!');
    console.log('✓ Requirement 9 PASSED: Real-time notifications emitted to traveler, admin, and incident channels.');

    // Requirement 3: Prevent multiple providers from accepting same request (Concurrency / Not Pending)
    console.log('\n--- Requirement 3: Prevent Multiple Claims ---');
    const { req: duplicateAcceptReq, res: duplicateAcceptRes } = mockReqRes({
      user: { id: provider1._id, _id: provider1._id, role: 'provider', name: provider1.name },
      params: { id: assistReq1._id.toString() },
      body: { action: 'accept' },
    });
    await assistanceController.respondToRequest(duplicateAcceptReq, duplicateAcceptRes, (e) => { throw e; });
    console.log(`  - Second accept attempt status: ${duplicateAcceptRes.statusCode} (${duplicateAcceptRes.data.error})`);
    if (duplicateAcceptRes.statusCode !== 409) {
      throw new Error(`Expected 409 Conflict for already accepted request, got ${duplicateAcceptRes.statusCode}`);
    }
    console.log('✓ Requirement 3 PASSED: Multiple claims prevented with 409 Conflict.');

    // Requirement 10: Move the request from Incoming Requests to Active Jobs
    console.log('\n--- Requirement 10: Moved from Incoming to Active Jobs ---');
    // Check incoming requests pool (status=Pending)
    const { req: incomingReq, res: incomingRes } = mockReqRes({
      user: { id: provider1._id, _id: provider1._id, role: 'provider', name: provider1.name },
      query: { status: 'Pending' },
    });
    await assistanceController.getRequests(incomingReq, incomingRes, (e) => { throw e; });
    const inIncoming = incomingRes.data.data.find((r) => String(r._id) === String(assistReq1._id));
    if (inIncoming) throw new Error('Accepted job should NOT appear in Incoming Requests (status=Pending)!');

    // Check active jobs pool (filter=active)
    const { req: activeReq, res: activeRes } = mockReqRes({
      user: { id: provider1._id, _id: provider1._id, role: 'provider', name: provider1.name },
      query: { filter: 'active' },
    });
    await assistanceController.getRequests(activeReq, activeRes, (e) => { throw e; });
    const inActive = activeRes.data.data.find((r) => String(r._id) === String(assistReq1._id));
    if (!inActive) throw new Error('Accepted job must appear in Active Jobs (filter=active)!');
    console.log('✓ Requirement 10 PASSED: Request removed from Incoming Requests and now in Active Jobs.');

    // ========================================================================
    // SCENARIO 2: DECLINE WORKFLOW
    // ========================================================================
    console.log('\n================================================================');
    console.log('SCENARIO 2: DECLINE WORKFLOW');
    console.log('================================================================');

    // Step 2.1: Traveler submits second incident
    const incRef2 = `SP-DEC-${Math.floor(100000 + Math.random() * 900000)}`;
    const incident2 = await Incident.create({
      incidentReference: incRef2,
      travelerId: traveler._id,
      title: 'Engine Stalled in Remote Forest Track',
      description: 'Vehicle engine overheated and will not restart on unpaved road near Sinharaja.',
      category: 'Roadside & Vehicle Breakdown',
      severity: 'High',
      location: {
        type: 'Point',
        coordinates: [80.4501, 6.4167],
        address: 'Sinharaja Forest Reserve North Gate',
      },
      status: INCIDENT_STATUS.SUBMITTED,
    });
    createdIncidentIds.push(incident2._id);
    console.log(`✓ Incident 2 created: ${incRef2} (_id: ${incident2._id})`);

    // Step 2.2: Admin assigns Provider 1 to Incident 2
    const { req: assignReq2, res: assignRes2 } = mockReqRes({
      user: { id: admin._id, _id: admin._id, role: 'admin', name: admin.name },
      params: { id: incident2._id.toString() },
      body: {
        status: INCIDENT_STATUS.ASSIGNED,
        assignedProviderId: provider1._id.toString(),
        notes: 'Assigned to Provider 1 for heavy extraction.',
      },
    });
    await adminController.updateAdminIncident(assignReq2, assignRes2, (e) => { throw e; });
    const assistReq2 = await AssistanceRequest.findOne({ incidentId: incident2._id });
    if (!assistReq2) throw new Error('AssistanceRequest 2 not found in MongoDB!');
    createdAssistIds.push(assistReq2._id);
    console.log(`✓ Admin assigned Provider 1 to Incident 2. AssistanceRequest ID: ${assistReq2._id}`);

    // Requirements 1, 2, 3, 4: Provider 1 Declines the Request
    console.log('\n--- Requirements 1-4: Provider 1 Declines Request ---');
    const declineReasonText = 'Outside current response zone: 4x4 recovery truck in maintenance';
    const { req: declineReq, res: declineRes, emittedEvents: declineEvents } = mockReqRes({
      user: {
        id: provider1._id,
        _id: provider1._id,
        role: 'provider',
        name: provider1.name,
      },
      params: { id: assistReq2._id.toString() },
      body: {
        action: 'decline',
        reason: declineReasonText,
      },
    });
    await assistanceController.respondToRequest(declineReq, declineRes, (e) => { throw e; });
    console.log(`  - Decline response status: ${declineRes.statusCode}`);
    if (declineRes.statusCode !== 200 || !declineRes.data.success) {
      throw new Error(`Decline failed: ${JSON.stringify(declineRes.data)}`);
    }

    // Verify AssistanceRequest in MongoDB
    const declinedAssist = await AssistanceRequest.findById(assistReq2._id);
    console.log(`  - AssistanceRequest status: "${declinedAssist.status}"`);
    console.log(`  - AssistanceRequest declineReason: "${declinedAssist.declineReason}"`);
    console.log(`  - AssistanceRequest declinedAt: ${declinedAssist.declinedAt}`);
    console.log(`  - AssistanceRequest declinedProviders: [${declinedAssist.declinedProviders}]`);

    if (declinedAssist.status !== 'Declined') throw new Error(`Expected status 'Declined', got ${declinedAssist.status}`);
    if (declinedAssist.declineReason !== declineReasonText) throw new Error('Decline reason mismatch!');
    if (!declinedAssist.declinedProviders.some((p) => String(p) === String(provider1._id))) {
      throw new Error('Provider 1 not in declinedProviders array!');
    }
    console.log('✓ Decline Requirements 1 & 2 PASSED: Status updated to Declined, reason and timestamp recorded.');

    // Requirement 3: Record the action in incident history
    const declineCaseLog = await CaseLog.findOne({
      incidentId: incident2._id,
      notes: new RegExp('declined dispatch request', 'i'),
    });
    if (!declineCaseLog) throw new Error('CaseLog not found for decline action!');
    console.log(`  - CaseLog decline note: "${declineCaseLog.notes}"`);
    console.log('✓ Decline Requirement 3 PASSED: Decline action recorded in incident history.');

    // Requirement 4: Notify the admin
    const adminDeclineNotice = declineEvents.find(
      (e) => e.room === 'role_admin' && e.event === 'provider_declined_request'
    );
    if (!adminDeclineNotice) throw new Error('Missing provider_declined_request notification to role_admin!');
    console.log(`  - Admin notice event payload reason: "${adminDeclineNotice.payload.reason}"`);
    console.log('✓ Decline Requirement 4 PASSED: Admin notified through Socket.IO with decline reason.');

    // Requirement 6: Prevent the declined provider from continuing the request
    console.log('\n--- Requirement 6: Prevent Declined Provider From Continuing ---');
    // Try to accept after declining
    const { req: reAcceptReq, res: reAcceptRes } = mockReqRes({
      user: { id: provider1._id, _id: provider1._id, role: 'provider', name: provider1.name },
      params: { id: assistReq2._id.toString() },
      body: { action: 'accept' },
    });
    await assistanceController.respondToRequest(reAcceptReq, reAcceptRes, (e) => { throw e; });
    console.log(`  - Declined provider re-accept attempt status: ${reAcceptRes.statusCode} (${reAcceptRes.data.error})`);
    if (reAcceptRes.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden for declined provider, got ${reAcceptRes.statusCode}`);
    }

    // Try to update job status after declining
    const { req: updateStatusReq, res: updateStatusRes } = mockReqRes({
      user: { id: provider1._id, _id: provider1._id, role: 'provider', name: provider1.name },
      params: { id: assistReq2._id.toString() },
      body: { status: 'En Route' },
    });
    await assistanceController.updateJobStatus(updateStatusReq, updateStatusRes, (e) => { throw e; });
    console.log(`  - Declined provider update job status: ${updateStatusRes.statusCode} (${updateStatusRes.data.error})`);
    if (updateStatusRes.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden when updating declined job, got ${updateStatusRes.statusCode}`);
    }

    // Check that declined request does not appear in Provider 1's pending pool
    const { req: p1CheckPoolReq, res: p1CheckPoolRes } = mockReqRes({
      user: { id: provider1._id, _id: provider1._id, role: 'provider', name: provider1.name },
      query: { status: 'Pending' },
    });
    await assistanceController.getRequests(p1CheckPoolReq, p1CheckPoolRes, (e) => { throw e; });
    const inP1Pool = p1CheckPoolRes.data.data.find((r) => String(r._id) === String(assistReq2._id));
    if (inP1Pool) throw new Error('Declined request should not appear in Provider 1 pending pool!');
    console.log('✓ Decline Requirement 6 PASSED: Declined provider cannot accept, update, or view the declined request.');

    // Requirement 5: Allow the admin to assign another provider
    console.log('\n--- Requirement 5: Allow Admin to Re-assign Another Provider ---');
    // Verify Incident status reverted to 'Under Review' and assignedProviderId was cleared
    const revertedIncident2 = await Incident.findById(incident2._id);
    console.log(`  - Incident 2 status after decline: "${revertedIncident2.status}"`);
    console.log(`  - Incident 2 assignedProviderId: ${revertedIncident2.assignedProviderId}`);
    if (revertedIncident2.status !== INCIDENT_STATUS.UNDER_REVIEW) {
      throw new Error(`Expected incident status 'Under Review', got ${revertedIncident2.status}`);
    }
    if (revertedIncident2.assignedProviderId !== null) {
      throw new Error(`Expected assignedProviderId null, got ${revertedIncident2.assignedProviderId}`);
    }

    // Admin re-assigns Incident 2 to Provider 2 (Highland Mountain Rescue Unit)
    console.log('  - Admin assigns Provider 2 to Incident 2...');
    const { req: reassignReq, res: reassignRes } = mockReqRes({
      user: { id: admin._id, _id: admin._id, role: 'admin', name: admin.name },
      params: { id: incident2._id.toString() },
      body: {
        status: INCIDENT_STATUS.ASSIGNED,
        assignedProviderId: provider2._id.toString(),
        notes: 'Reassigned to Highland Mountain Rescue after Provider 1 declined.',
      },
    });
    await adminController.updateAdminIncident(reassignReq, reassignRes, (e) => { throw e; });
    if (reassignRes.statusCode !== 200) {
      throw new Error(`Re-assignment failed: ${JSON.stringify(reassignRes.data)}`);
    }

    // Verify AssistanceRequest 2 is now assigned to Provider 2 with status 'Pending'
    const reassignedAssist = await AssistanceRequest.findById(assistReq2._id);
    console.log(`  - Reassigned AssistanceRequest providerId: ${reassignedAssist.providerId}`);
    console.log(`  - Reassigned AssistanceRequest status: "${reassignedAssist.status}"`);
    if (String(reassignedAssist.providerId) !== String(provider2._id)) {
      throw new Error(`Expected providerId ${provider2._id}, got ${reassignedAssist.providerId}`);
    }
    if (reassignedAssist.status !== 'Pending') {
      throw new Error(`Expected status 'Pending', got ${reassignedAssist.status}`);
    }

    // Provider 2 accepts the newly reassigned dispatch
    console.log('  - Provider 2 claims and accepts the reassigned dispatch...');
    const { req: p2AcceptReq, res: p2AcceptRes } = mockReqRes({
      user: {
        id: provider2._id,
        _id: provider2._id,
        role: 'provider',
        name: provider2.name,
        providerDetails: provider2.providerDetails,
      },
      params: { id: assistReq2._id.toString() },
      body: { action: 'accept', notes: 'Highland Unit responding with 4x4.' },
    });
    await assistanceController.respondToRequest(p2AcceptReq, p2AcceptRes, (e) => { throw e; });
    console.log(`  - Provider 2 accept response status: ${p2AcceptRes.statusCode}`);
    if (p2AcceptRes.statusCode !== 200) {
      throw new Error(`Provider 2 accept failed: ${JSON.stringify(p2AcceptRes.data)}`);
    }

    const finalIncident2 = await Incident.findById(incident2._id);
    console.log(`  - Final Incident status: "${finalIncident2.status}" (Assigned to Provider 2: ${finalIncident2.assignedProviderId})`);
    if (finalIncident2.status !== INCIDENT_STATUS.ASSISTANCE_DISPATCHED) {
      throw new Error(`Expected Incident status 'Assistance Dispatched', got ${finalIncident2.status}`);
    }
    console.log('✓ Decline Requirement 5 PASSED: Admin successfully reassigned another provider, who accepted the job!');

    console.log('\n================================================================');
    console.log('ALL ACCEPT & DISPATCH AND DECLINE REQUIREMENTS FULLY VERIFIED!');
    console.log('================================================================\n');
  } finally {
    console.log('[Cleanup] Cleaning up test records from MongoDB...');
    for (const incId of createdIncidentIds) {
      await Incident.deleteOne({ _id: incId });
      await CaseLog.deleteMany({ incidentId: incId });
    }
    for (const reqId of createdAssistIds) {
      await AssistanceRequest.deleteOne({ _id: reqId });
    }
    console.log('[Cleanup] Complete.');
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});

