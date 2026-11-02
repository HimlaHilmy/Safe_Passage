const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./app');

const JWT_SECRET = process.env.JWT_SECRET || 'safe_passage_dev_secret_university_project_2026';

// Test tokens for different actors
const travelerToken = jwt.sign(
  {
    id: '65e000000000000000000001',
    name: 'Sarah Jenkins',
    email: 'traveler@safepassage.org',
    role: 'traveler',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  {
    id: '65e000000000000000000003',
    name: 'Central Dispatch Admin',
    email: 'admin@safepassage.org',
    role: 'admin',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const providerToken = jwt.sign(
  {
    id: '65e000000000000000000002',
    name: 'Apex Rapid Response Ltd',
    email: 'provider@safepassage.org',
    role: 'provider',
    providerDetails: {
      isAvailable: true,
      verified: true,
      serviceTypes: ['Roadside Towing & Vehicle Repair'],
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
  console.log(`  SAFE PASSAGE: EMERGENCY CASE LIFECYCLE MANAGER      `);
  console.log(`  Member 3 (Jayasundara) Verification Test Suite      `);
  console.log(`  Test Server Port: ${port}                           `);
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
    assert(health.status === 200, 'API health endpoint responds with 200');

    // 2. Incident Retrieval and Functional Requirements Check
    console.log(`\n  --- Functional Requirements & Field Verification ---`);
    const incList = await makeRequest(server, 'GET', '/api/incidents', travelerToken);
    assert(incList.status === 200 && incList.body.success, 'GET /api/incidents returns 200 for traveler');
    assert(incList.body.data && incList.body.data.length > 0, `Incidents returned: ${incList.body.data.length}`);

    const sample = incList.body.data[0];
    assert(Boolean(sample.incidentReference || sample.reference || sample._id), '1. Displays Incident reference');
    assert(Boolean(sample.category), `2. Displays Category (${sample.category})`);
    assert(Boolean(sample.title), `3. Displays Title (${sample.title})`);
    assert(Boolean(sample.description), '4. Displays Description');
    assert(Boolean(sample.severity), `5. Displays Severity (${sample.severity})`);
    assert(Boolean(sample.createdAt), '6. Displays Reported time');
    assert(Boolean(sample.location && sample.location.coordinates), '7. Displays Location coordinates');
    assert(Boolean(sample.location && sample.location.address), '   Displays Location address');
    assert(Boolean(sample.status), `8. Displays Current status (${sample.status})`);
    assert(sample.assignedProviderId !== undefined, '9. Displays Relevant assignment information slot');

    // 3. Single Incident Inspection
    const single = await makeRequest(server, 'GET', `/api/incidents/${sample._id}`, travelerToken);
    assert(single.status === 200 && single.body.success, `GET /api/incidents/${sample._id} returns 200`);

    // 4. Create a fresh test incident to trace through the full lifecycle
    console.log(`\n  --- Finite State Machine: Sequential Lifecycle Progression ---`);
    const newIncRes = await makeRequest(server, 'POST', '/api/incidents', travelerToken, {
      category: 'Medical Emergency',
      title: 'Sprained ankle on jungle trail',
      description: 'Unable to bear weight, trail is slippery, two companions assisting.',
      severity: 'Medium',
      location: {
        type: 'Point',
        coordinates: [80.7000, 7.1500],
        address: 'Knuckles Range Trail Segment 4',
        landmark: 'Near River Crossing 2',
      },
    });
    assert(newIncRes.status === 201 && newIncRes.body.success, 'New emergency reported (Status: Submitted)');
    const testIncId = newIncRes.body.data._id;

    // Transition 1: Submitted -> Under Review (Admin triage)
    const reviewRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${testIncId}/status`,
      adminToken,
      {
        newStatus: 'Under Review',
        notes: 'Coordinates verified with regional ranger station; priority confirmed.',
      }
    );
    assert(reviewRes.status === 200, 'Transition 1: Submitted ➔ Under Review (Admin triage)');
    assert(reviewRes.body.data.status === 'Under Review', 'Status correctly set to Under Review');

    // Transition 2: Under Review -> Assigned (Admin assigns provider)
    const assignRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${testIncId}/status`,
      adminToken,
      {
        newStatus: 'Assigned',
        assignedProviderId: '65e000000000000000000002',
        estimatedArrivalTimeMinutes: 25,
        notes: 'Assigned to Apex Rapid Response mountain team.',
      }
    );
    assert(assignRes.status === 200, 'Transition 2: Under Review ➔ Assigned (Provider Allocated)');
    assert(assignRes.body.data.status === 'Assigned', 'Status correctly set to Assigned');

    // Transition 3: Assigned -> Assistance Dispatched (Provider en route)
    const dispatchRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${testIncId}/status`,
      providerToken,
      {
        newStatus: 'Assistance Dispatched',
        notes: 'Rescue crew en route with 4x4 ambulance. ETA 25 minutes.',
      }
    );
    assert(dispatchRes.status === 200, 'Transition 3: Assigned ➔ Assistance Dispatched (En Route)');
    assert(dispatchRes.body.data.status === 'Assistance Dispatched', 'Status correctly set to Assistance Dispatched');

    // Transition 4: Assistance Dispatched -> In Progress (Provider on scene)
    const progressRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${testIncId}/status`,
      providerToken,
      {
        newStatus: 'In Progress',
        notes: 'On scene. Stabilizing sprain and preparing stretcher extraction.',
      }
    );
    assert(progressRes.status === 200, 'Transition 4: Assistance Dispatched ➔ In Progress (On Scene)');
    assert(progressRes.body.data.status === 'In Progress', 'Status correctly set to In Progress');

    // Transition 5: In Progress -> Resolved (Incident completed)
    const resolveRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${testIncId}/status`,
      providerToken,
      {
        newStatus: 'Resolved',
        notes: 'Patient escorted to trail base clinic. Emergency resolved safely.',
      }
    );
    assert(resolveRes.status === 200, 'Transition 5: In Progress ➔ Resolved (Terminal State)');
    assert(resolveRes.body.data.status === 'Resolved', 'Status correctly set to Resolved');

    // 5. Illegal Transition Protection Tests
    console.log(`\n  --- State Machine Enforcement & Illegal Transition Prevention ---`);
    
    // Attempt to transition out of terminal Resolved state
    const terminalViolationRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${testIncId}/status`,
      adminToken,
      {
        newStatus: 'In Progress',
        notes: 'Illegal attempt to reopen resolved case.',
      }
    );
    assert(
      terminalViolationRes.status === 400 && terminalViolationRes.body.error === 'TERMINAL_STATE',
      'Terminal state enforcement: Cannot transition from Resolved (HTTP 400 TERMINAL_STATE)'
    );

    // Create another incident to test skipping lifecycle states (Submitted -> Resolved)
    const skipIncRes = await makeRequest(server, 'POST', '/api/incidents', travelerToken, {
      category: 'Roadside & Vehicle Breakdown',
      title: 'Flat tire near highway exit',
      description: 'Spare tire available, jack missing.',
      severity: 'Low',
      location: { type: 'Point', coordinates: [79.9, 6.9], address: 'Exit 3' },
    });
    const skipId = skipIncRes.body.data._id;

    const illegalSkipRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${skipId}/status`,
      travelerToken,
      {
        newStatus: 'Resolved',
        notes: 'Attempting to skip straight to resolved.',
      }
    );
    assert(
      illegalSkipRes.status === 400 && illegalSkipRes.body.error === 'ILLEGAL_STATUS_TRANSITION',
      'FSM validation: Illegal jump from Submitted directly to Resolved rejected (HTTP 400 ILLEGAL_STATUS_TRANSITION)'
    );

    // Cancellation Test
    console.log(`\n  --- Emergency Cancellation & Audit Logging ---`);
    const cancelRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${skipId}/status`,
      travelerToken,
      {
        newStatus: 'Cancelled',
        notes: 'Assistance no longer needed; fellow motorist assisted.',
      }
    );
    assert(cancelRes.status === 200, 'Traveler cancels emergency: Submitted ➔ Cancelled');
    assert(cancelRes.body.data.status === 'Cancelled', 'Status correctly updated to Cancelled');

    // Attempt to reactivate cancelled case
    const cancelledReactivationRes = await makeRequest(
      server,
      'PATCH',
      `/api/incidents/${skipId}/status`,
      adminToken,
      {
        newStatus: 'Under Review',
        notes: 'Attempting to reactivate cancelled case.',
      }
    );
    assert(
      cancelledReactivationRes.status === 400 && cancelledReactivationRes.body.error === 'TERMINAL_STATE',
      'Terminal state enforcement: Cancelled incident cannot be reactivated'
    );

    // 6. Chronological Case Audit Trail Integrity
    console.log(`\n  --- Chronological Case Log / Audit History ---`);
    const historyRes = await makeRequest(server, 'GET', `/api/incidents/${testIncId}/history`, travelerToken);
    assert(historyRes.status === 200 && historyRes.body.success, `GET /api/incidents/${testIncId}/history returns 200`);
    assert(historyRes.body.data.length >= 6, `Complete audit logs preserved (${historyRes.body.data.length} entries for 5 transitions + initial report)`);

    const firstLog = historyRes.body.data[0];
    const lastLog = historyRes.body.data[historyRes.body.data.length - 1];
    assert(firstLog.newStatus === 'Submitted', 'Initial audit log correctly marks Submitted');
    assert(lastLog.newStatus === 'Resolved', 'Final audit log correctly marks Resolved');

    // 7. Adding Case Progress Note without changing status
    console.log(`\n  --- Operational Case Notes ---`);
    const noteRes = await makeRequest(
      server,
      'POST',
      `/api/incidents/${testIncId}/notes`,
      travelerToken,
      {
        notes: 'Follow-up check: Patient resting safely at home, no complications.',
      }
    );
    assert(noteRes.status === 201 && noteRes.body.success, 'POST /api/incidents/:id/notes records progress note');

  } catch (err) {
    console.error('Test Suite encountered unhandled error:', err);
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
