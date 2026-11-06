const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const { Incident, INCIDENT_STATUS } = require('./models/Incident');
const AssistanceRequest = require('./models/AssistanceRequest');
const CaseLog = require('./models/CaseLog');
const assistanceController = require('./controllers/assistanceController');
const adminController = require('./controllers/adminController');

// Helper to mock express req/res
function mockReqRes(reqData = {}) {
  const req = {
    user: reqData.user || {},
    query: reqData.query || {},
    params: reqData.params || {},
    body: reqData.body || {},
    app: {
      get: (key) => {
        if (key === 'io') {
          return {
            to: () => ({ emit: () => {} }),
            emit: () => {},
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

  return { req, res, next };
}

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE: Service Provider Incoming Requests & Privacy Shield');
  console.log('================================================================');

  await connectDB();

  // Find or create test users
  let traveler = await User.findOne({ role: 'traveler' });
  let admin = await User.findOne({ role: 'admin' });
  let providers = await User.find({ role: 'provider' }).limit(2);

  const dummyHash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.I.hQz2Z2y0mPq0Gqf4bY7/q6bZ3P3G';

  if (!traveler || !admin || providers.length < 2) {
    console.log('[Setup] Seeding missing test users...');
    if (!traveler) {
      traveler = await User.create({
        name: 'Sarah Jenkins',
        email: 'traveler_test@safepassage.org',
        passwordHash: dummyHash,
        phone: '+1 (555) 234-5678',
        role: 'traveler',
      });
    }
    if (!admin) {
      admin = await User.create({
        name: 'Himla (Admin Lead)',
        email: 'admin_test@safepassage.org',
        passwordHash: dummyHash,
        role: 'admin',
      });
    }
    if (providers.length < 1) {
      const p1 = await User.create({
        name: 'Apex Rapid Response Ltd',
        email: 'apex_test@safepassage.org',
        passwordHash: dummyHash,
        phone: '+94 11 234 5678',
        role: 'provider',
        providerDetails: {
          organizationName: 'Apex Rapid Response Ltd',
          serviceCategories: ['Roadside & Towing', 'Medical Assistance'],
          isAvailable: true,
          currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
        },
      });
      providers.push(p1);
    }
    if (providers.length < 2) {
      const p2 = await User.create({
        name: 'Highland Mountain Rescue Unit',
        email: 'highland_test@safepassage.org',
        passwordHash: dummyHash,
        phone: '+94 81 222 3344',
        role: 'provider',
        providerDetails: {
          organizationName: 'Highland Mountain Rescue Unit',
          serviceCategories: ['Search & Rescue'],
          isAvailable: true,
          currentLocation: { type: 'Point', coordinates: [80.6337, 7.2906] },
        },
      });
      providers.push(p2);
    }
  }

  const provider1 = providers[0];
  const provider2 = providers[1];

  console.log(`[Users Verified]`);
  console.log(`- Traveler: ${traveler.name} (${traveler._id}) - Phone: ${traveler.phone}`);
  console.log(`- Admin:    ${admin.name} (${admin._id})`);
  console.log(`- Provider 1 (Assigned): ${provider1.name} (${provider1._id})`);
  console.log(`- Provider 2 (Other):    ${provider2.name} (${provider2._id})`);

  let testIncident = null;
  let testAssistanceRequest = null;

  try {
    // ------------------------------------------------------------------------
    // Step 1: Create an Emergency Incident
    // ------------------------------------------------------------------------
    console.log('\n--- Step 1: Traveler Submits Emergency Incident in MongoDB ---');
    const incidentRef = `SP-TEST-${Math.floor(100000 + Math.random() * 900000)}`;
    testIncident = await Incident.create({
      incidentReference: incidentRef,
      travelerId: traveler._id,
      title: 'Vehicle Engine Fire on Marine Drive',
      description: 'Vehicle started smoking near Kollupitiya station on Marine Drive.',
      category: 'Roadside & Vehicle Breakdown',
      severity: 'Critical',
      location: {
        type: 'Point',
        coordinates: [79.8495, 6.9042],
        address: 'Marine Drive, Kollupitiya, Colombo 03',
      },
      status: INCIDENT_STATUS.SUBMITTED,
    });
    console.log(`✓ Incident Created: ${testIncident.incidentReference} (_id: ${testIncident._id})`);

    // ------------------------------------------------------------------------
    // Step 2: Admin Assigns Incident to Provider 1
    // ------------------------------------------------------------------------
    console.log('\n--- Step 2: Admin Dashboard Assigns Provider 1 ---');
    const { req: assignReq, res: assignRes } = mockReqRes({
      user: { id: admin._id, _id: admin._id, role: 'admin', name: admin.name },
      params: { id: testIncident._id.toString() },
      body: {
        status: INCIDENT_STATUS.ASSIGNED,
        assignedProviderId: provider1._id.toString(),
        notes: 'Assigned to Apex Rapid Response for emergency vehicle suppression.',
      },
    });

    await adminController.updateAdminIncident(assignReq, assignRes, (e) => { throw e; });
    console.log(`✓ Admin assignment response status: ${assignRes.statusCode}`);
    if (assignRes.statusCode !== 200 || !assignRes.data.success) {
      throw new Error(`Assignment failed: ${JSON.stringify(assignRes.data)}`);
    }

    // Verify AssistanceRequest was created in MongoDB
    testAssistanceRequest = await AssistanceRequest.findOne({ incidentId: testIncident._id });
    if (!testAssistanceRequest) {
      throw new Error('AssistanceRequest document not found in MongoDB!');
    }
    console.log(`✓ AssistanceRequest created: ${testAssistanceRequest._id}`);
    console.log(`  - Status: ${testAssistanceRequest.status}`);
    console.log(`  - Assigned Provider: ${testAssistanceRequest.providerId}`);
    if (String(testAssistanceRequest.providerId) !== String(provider1._id)) {
      throw new Error(`Provider ID mismatch! Expected ${provider1._id}, got ${testAssistanceRequest.providerId}`);
    }

    // ------------------------------------------------------------------------
    // Step 3: Provider 1 Fetches Incoming Requests (GET /api/assistance-requests?status=Pending)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 3: Provider 1 Fetches Incoming Requests ---');
    const { req: p1Req, res: p1Res } = mockReqRes({
      user: {
        id: provider1._id,
        _id: provider1._id,
        role: 'provider',
        name: provider1.name,
        providerDetails: provider1.providerDetails,
      },
      query: { status: 'Pending' },
    });

    await assistanceController.getRequests(p1Req, p1Res, (e) => { throw e; });
    console.log(`✓ Provider 1 getRequests status: ${p1Res.statusCode}, count: ${p1Res.data.count}`);

    const p1Job = p1Res.data.data.find(
      (r) => String(r._id) === String(testAssistanceRequest._id)
    );

    if (!p1Job) {
      throw new Error(`Provider 1 could NOT see their assigned pending request!`);
    }
    console.log(`✓ Request found in Provider 1's pending incoming pool!`);
    console.log(`  - Incident Ref: ${p1Job.incidentId?.incidentReference}`);
    console.log(`  - Category: ${p1Job.incidentId?.category}`);
    console.log(`  - Severity: ${p1Job.incidentId?.severity}`);
    console.log(`  - Location: ${p1Job.location?.address}`);
    console.log(`  - Distance: ${p1Job.distanceKm} km`);
    console.log(`  - Description: ${p1Job.incidentId?.description}`);

    // Verify privacy shield on Pending request:
    console.log('\n--- Checking Privacy Shield on Pending Request ---');
    console.log(`  - Traveler name returned:  "${p1Job.travelerId?.name}"`);
    console.log(`  - Traveler phone returned: "${p1Job.travelerId?.phone}"`);
    console.log(`  - Traveler isProtected:     ${p1Job.travelerId?.isProtected}`);

    if (p1Job.travelerId?.phone !== '+***-***-****' || !p1Job.travelerId?.isProtected) {
      throw new Error(`Privacy Shield FAILED! Traveler phone was not masked: ${p1Job.travelerId?.phone}`);
    }
    console.log(`✓ Privacy Shield verified: Traveler phone is masked while Pending.`);

    // ------------------------------------------------------------------------
    // Step 4: Provider 2 Fetches Incoming Requests (Negative Isolation Check)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 4: Provider 2 (Different Unit) Fetches Incoming Requests ---');
    const { req: p2Req, res: p2Res } = mockReqRes({
      user: {
        id: provider2._id,
        _id: provider2._id,
        role: 'provider',
        name: provider2.name,
        providerDetails: provider2.providerDetails,
      },
      query: { status: 'Pending' },
    });

    await assistanceController.getRequests(p2Req, p2Res, (e) => { throw e; });
    const p2Job = p2Res.data.data.find(
      (r) => String(r._id) === String(testAssistanceRequest._id)
    );

    if (p2Job) {
      throw new Error(`ISOLATION FAILURE: Provider 2 can see a request assigned to Provider 1!`);
    }
    console.log(`✓ Isolation verified: Provider 2 CANNOT see Provider 1's assigned request.`);

    // ------------------------------------------------------------------------
    // Step 5: Provider 1 Inspects Request By ID (GET /api/assistance-requests/:id)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 5: Provider 1 Inspects Request By ID ---');
    const { req: inspectReq, res: inspectRes } = mockReqRes({
      user: {
        id: provider1._id,
        _id: provider1._id,
        role: 'provider',
        name: provider1.name,
        providerDetails: provider1.providerDetails,
      },
      params: { id: testAssistanceRequest._id.toString() },
    });

    await assistanceController.getRequestById(inspectReq, inspectRes, (e) => { throw e; });
    console.log(`✓ Provider 1 inspect status: ${inspectRes.statusCode}`);
    if (inspectRes.data.data.travelerId?.phone !== '+***-***-****') {
      throw new Error(`Privacy Shield failed on getRequestById: phone was ${inspectRes.data.data.travelerId?.phone}`);
    }
    console.log(`✓ getRequestById preserves Privacy Shield while Pending.`);

    // ------------------------------------------------------------------------
    // Step 6: Provider 1 Accepts Dispatch (PATCH /api/assistance-requests/:id/respond)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 6: Provider 1 Accepts Dispatch Assignment ---');
    const { req: acceptReq, res: acceptRes } = mockReqRes({
      user: {
        id: provider1._id,
        _id: provider1._id,
        role: 'provider',
        name: provider1.name,
        providerDetails: provider1.providerDetails,
      },
      params: { id: testAssistanceRequest._id.toString() },
      body: { action: 'accept', notes: 'Unit 4 dispatched. ETA 7 mins.' },
    });

    await assistanceController.respondToRequest(acceptReq, acceptRes, (e) => { throw e; });
    console.log(`✓ Accept response status: ${acceptRes.statusCode}`);
    if (acceptRes.statusCode !== 200 || !acceptRes.data.success) {
      throw new Error(`Failed to accept request: ${JSON.stringify(acceptRes.data)}`);
    }

    const acceptedDoc = acceptRes.data.data;
    console.log(`✓ Request status updated to: ${acceptedDoc.status}`);
    console.log(`  - Unlocked Traveler Name:  ${acceptedDoc.travelerId?.name}`);
    console.log(`  - Unlocked Traveler Phone: ${acceptedDoc.travelerId?.phone}`);

    if (acceptedDoc.travelerId?.phone !== traveler.phone) {
      throw new Error(`Traveler phone not unlocked! Expected ${traveler.phone}, got ${acceptedDoc.travelerId?.phone}`);
    }
    console.log(`✓ Direct traveler contact information successfully unlocked upon acceptance!`);

    // Verify Incident status updated to ASSISTANCE_DISPATCHED
    const updatedIncident = await Incident.findById(testIncident._id);
    console.log(`✓ Incident status synchronized: ${updatedIncident.status}`);
    if (updatedIncident.status !== INCIDENT_STATUS.ASSISTANCE_DISPATCHED) {
      throw new Error(`Incident status mismatch! Expected ${INCIDENT_STATUS.ASSISTANCE_DISPATCHED}, got ${updatedIncident.status}`);
    }

    console.log('\n================================================================');
    console.log('ALL SERVICE PROVIDER INCOMING REQUEST REQUIREMENTS PASSED!');
    console.log('================================================================\n');
  } finally {
    // Cleanup test records
    console.log('[Cleanup] Removing test records from MongoDB...');
    if (testIncident) {
      await Incident.deleteOne({ _id: testIncident._id });
      await CaseLog.deleteMany({ incidentId: testIncident._id });
    }
    if (testAssistanceRequest) {
      await AssistanceRequest.deleteOne({ _id: testAssistanceRequest._id });
    }
    console.log('[Cleanup] Done.');
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test run failed with error:', err);
  process.exit(1);
});
