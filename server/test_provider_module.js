const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./app');

const JWT_SECRET = process.env.JWT_SECRET || 'safe_passage_dev_secret_university_project_2026';

// Create test tokens
const provider1Token = jwt.sign(
  {
    id: '65e000000000000000000002',
    name: 'Apex Rapid Response Ltd',
    email: 'provider@safepassage.org',
    role: 'provider',
    accountStatus: 'active',
    providerDetails: {
      isAvailable: true,
      verified: true,
      serviceTypes: ['Roadside Towing & Vehicle Repair', 'Emergency Paramedic Escort'],
      currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
    },
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const provider2Token = jwt.sign(
  {
    id: '65e000000000000000000020',
    name: 'Highland Mountain Rescue Unit',
    email: 'highland@rescue.org',
    role: 'provider',
    accountStatus: 'active',
    providerDetails: {
      isAvailable: true,
      verified: true,
      serviceTypes: ['Search & Mountain Extrication'],
      currentLocation: { type: 'Point', coordinates: [80.6350, 7.2880] },
    },
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function makeRequest(server, method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`\n======================================================`);
  console.log(`  SAFE PASSAGE: ASSISTANCE DISPATCH & PROVIDER PORTAL `);
  console.log(`  Verification Test Suite (Port: ${port})             `);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest(server, 'GET', '/api/health');
    assert(health.status === 200, 'Health endpoint responds with 200');

    // 2. Provider Stats Summary
    const stats = await makeRequest(server, 'GET', '/api/assistance-requests/stats/summary', provider1Token);
    assert(stats.status === 200 && stats.body.success, 'GET /api/assistance-requests/stats/summary returns 200');
    assert(stats.body.data.newRequestsCount >= 0, 'Stats includes newRequestsCount');
    assert(stats.body.data.activeJobsCount >= 0, 'Stats includes activeJobsCount');

    // 3. Pending Requests & Privacy Check
    const pending = await makeRequest(server, 'GET', '/api/assistance-requests?status=Pending', provider1Token);
    assert(pending.status === 200 && pending.body.success, 'GET /api/assistance-requests?status=Pending returns 200');
    assert(pending.body.count > 0, `Pending assistance requests found in queue: ${pending.body.count}`);

    const targetReq = pending.body.data[0];
    assert(targetReq.status === 'Pending', 'Target request status is Pending');
    assert(
      targetReq.travelerId.name.includes('Confidential') || targetReq.travelerId.isProtected,
      'Traveler personal identity is masked on unaccepted pending requests (Privacy Protection)'
    );
    assert(
      targetReq.travelerId.phone.includes('***'),
      'Traveler phone number is masked on unaccepted pending requests'
    );

    // 4. Provider 1 Claims Request (Accept)
    console.log(`\n  --- Testing Concurrency & Duplicate Claim Prevention ---`);
    const acceptRes = await makeRequest(
      server,
      'PATCH',
      `/api/assistance-requests/${targetReq._id}/respond`,
      provider1Token,
      { action: 'accept' }
    );
    assert(acceptRes.status === 200 && acceptRes.body.success, `Provider 1 accepts request #${targetReq._id}`);
    assert(acceptRes.body.data.status === 'Accepted', 'Request status transitioned to Accepted');
    assert(
      acceptRes.body.data.providerId === '65e000000000000000000002',
      'Assigned providerId is recorded correctly'
    );

    // 5. Concurrency Test: Provider 2 attempts to claim the ALREADY CLAIMED request
    const duplicateRes = await makeRequest(
      server,
      'PATCH',
      `/api/assistance-requests/${targetReq._id}/respond`,
      provider2Token,
      { action: 'accept' }
    );
    assert(
      duplicateRes.status === 409,
      'Duplicate claim rejected with HTTP 409 Conflict (Concurrency Lock)'
    );
    assert(
      duplicateRes.body.error === 'ALREADY_CLAIMED',
      'Error code specifies ALREADY_CLAIMED to prevent duplicate dispatches'
    );

    // 6. Milestone Transitions: En Route -> Arrived -> In Progress -> Completed
    console.log(`\n  --- Testing Milestone Lifecycle Transitions ---`);
    const enRouteRes = await makeRequest(
      server,
      'PATCH',
      `/api/assistance-requests/${targetReq._id}/status`,
      provider1Token,
      { status: 'En Route', notes: 'Vehicle en route with ETA 12 mins.' }
    );
    assert(enRouteRes.status === 200, 'Status updated to En Route');
    assert(enRouteRes.body.data.enRouteAt !== null, 'enRouteAt timestamp recorded');

    const arrivedRes = await makeRequest(
      server,
      'PATCH',
      `/api/assistance-requests/${targetReq._id}/status`,
      provider1Token,
      { status: 'Arrived', notes: 'Arrived on scene with emergency equipment.' }
    );
    assert(arrivedRes.status === 200, 'Status updated to Arrived');
    assert(arrivedRes.body.data.arrivedAt !== null, 'arrivedAt timestamp recorded');

    const inProgressRes = await makeRequest(
      server,
      'PATCH',
      `/api/assistance-requests/${targetReq._id}/status`,
      provider1Token,
      { status: 'In Progress', notes: 'Commenced repair and inspection.' }
    );
    assert(inProgressRes.status === 200, 'Status updated to In Progress');
    assert(inProgressRes.body.data.inProgressAt !== null, 'inProgressAt timestamp recorded');

    const completedRes = await makeRequest(
      server,
      'PATCH',
      `/api/assistance-requests/${targetReq._id}/status`,
      provider1Token,
      { status: 'Completed', notes: 'Emergency resolved successfully.' }
    );
    assert(completedRes.status === 200, 'Status updated to Completed');
    assert(completedRes.body.data.completedAt !== null, 'completedAt timestamp recorded');
    assert(
      completedRes.body.data.timeline.length >= 4,
      `Timeline entries preserved across all milestones (${completedRes.body.data.timeline.length} entries)`
    );

    // 7. Provider Profile & Duty Toggle
    console.log(`\n  --- Testing Provider Profile & Duty Settings ---`);
    const profileRes = await makeRequest(server, 'GET', '/api/providers/me', provider1Token);
    assert(profileRes.status === 200, 'GET /api/providers/me returns 200');

    const updateProfileRes = await makeRequest(
      server,
      'PATCH',
      '/api/providers/me',
      provider1Token,
      { isAvailable: true, coordinates: [79.8700, 6.9300] }
    );
    assert(updateProfileRes.status === 200, 'PATCH /api/providers/me updates duty status and coordinates');

  } catch (err) {
    console.error('Test Suite encountered error:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n======================================================`);
    console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`======================================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
