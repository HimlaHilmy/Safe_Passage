const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./app');

const JWT_SECRET = process.env.JWT_SECRET || 'safe_passage_dev_secret_university_project_2026';

// 1. Create Test Tokens
const adminToken = jwt.sign(
  {
    id: '65e000000000000000000003',
    name: 'Himla (Admin Lead)',
    email: 'admin@safepassage.org',
    role: 'admin',
    accountStatus: 'active',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const travelerToken = jwt.sign(
  {
    id: '65e000000000000000000001',
    name: 'Sarah Jenkins',
    email: 'traveler@safepassage.org',
    role: 'traveler',
    accountStatus: 'active',
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
    accountStatus: 'active',
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
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
          } else {
            resolve({ status: res.statusCode, headers: res.headers, raw: data });
          }
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

async function runAdminModuleTests() {
  console.log('===========================================================');
  console.log('  SAFE PASSAGE: MEMBER 5 (HIRUNIKA) ADMIN SUITE VERIFICATION');
  console.log('===========================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

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
    // TEST 1: Role Security / Access Control - Unauthorized Access Rejected
    console.log('  --- 1. Security & RBAC Enforcement ---');
    const noTokenRes = await makeRequest(server, 'GET', '/api/admin/analytics', null);
    assert(noTokenRes.status === 401, 'Request without token returns 401 Unauthorized');

    const travelerRes = await makeRequest(server, 'GET', '/api/admin/analytics', travelerToken);
    assert(travelerRes.status === 403, 'Traveler attempting admin access returns 403 Forbidden');

    const providerRes = await makeRequest(server, 'GET', '/api/admin/analytics', providerToken);
    assert(providerRes.status === 403, 'Provider attempting admin access returns 403 Forbidden');

    const adminAuthRes = await makeRequest(server, 'GET', '/api/admin/analytics', adminToken);
    assert(adminAuthRes.status === 200, 'Authorized Admin receives 200 OK');

    // TEST 2: Executive Analytics & Calculations
    console.log('\n  --- 2. Executive Analytics & Metric Calculations ---');
    const analytics = adminAuthRes.body;
    assert(analytics.success === true, 'Analytics endpoint returns success: true');
    assert(typeof analytics.data.summary.totalIncidents === 'number', 'Summary has numeric totalIncidents');
    assert(typeof analytics.data.summary.activeIncidents === 'number', 'Summary has numeric activeIncidents');
    assert(typeof analytics.data.summary.pendingAssignments === 'number', 'Summary has numeric pendingAssignments');
    assert(typeof analytics.data.summary.resolvedIncidents === 'number', 'Summary has numeric resolvedIncidents');
    assert(typeof analytics.data.summary.meanResponseMinutes === 'number', 'Summary calculates meanResponseMinutes');
    assert(Array.isArray(analytics.data.incidentsByCategory), 'Incidents by category is returned as array');
    assert(Array.isArray(analytics.data.incidentsByStatus), 'Incidents by status is returned as array');
    assert(Array.isArray(analytics.data.hourlyTrends), 'Hourly influx trends returned as array');
    assert(analytics.dataSource !== undefined, 'Response transparently states data source');
    assert(analytics.timestampCalculationMethod !== undefined, 'Response defines timestamp calculation formula');

    // TEST 3: Incident Management & Filtering
    console.log('\n  --- 3. Incident Management & Query Filters ---');
    const incRes = await makeRequest(server, 'GET', '/api/admin/incidents?page=1&limit=10', adminToken);
    assert(incRes.status === 200, 'List incidents returns 200 OK');
    assert(Array.isArray(incRes.body.data), 'Incidents returned in data array');
    assert(incRes.body.pagination !== undefined, 'Pagination object included in response');

    // Test search filter
    const searchRes = await makeRequest(server, 'GET', '/api/admin/incidents?search=overheating', adminToken);
    assert(searchRes.status === 200, 'Search filter returns 200 OK');
    assert(searchRes.body.data.length >= 1, 'Search finds matching incidents');

    // TEST 4: Single Incident Detail & Override
    console.log('\n  --- 4. Incident Detail & Administrative Override ---');
    const singleIncRes = await makeRequest(server, 'GET', '/api/admin/incidents/65f000000000000000000010', adminToken);
    assert(singleIncRes.status === 200, 'Incident detail returns 200 OK');
    assert(singleIncRes.body.data._id === '65f000000000000000000010', 'Correct incident ID returned');
    assert(Array.isArray(singleIncRes.body.data.caseLogs), 'Related case logs are populated');

    // Test administrative status mutation & audit logging
    const patchIncRes = await makeRequest(
      server,
      'PATCH',
      '/api/admin/incidents/65f000000000000000000010',
      adminToken,
      {
        status: 'Assistance Dispatched',
        estimatedArrivalTimeMinutes: 15,
        notes: 'Priority dispatch confirmed by Admin Hirunika.',
      }
    );
    assert(patchIncRes.status === 200, 'Admin incident update returns 200 OK');

    // TEST 5: User Management
    console.log('\n  --- 5. User Directory & Account Status Updates ---');
    const usersRes = await makeRequest(server, 'GET', '/api/admin/users', adminToken);
    assert(usersRes.status === 200, 'List users returns 200 OK');
    assert(Array.isArray(usersRes.body.data), 'Users list returned as array');
    assert(usersRes.body.summaryCounts !== undefined, 'User directory summary counts included');

    const patchUserRes = await makeRequest(
      server,
      'PATCH',
      '/api/admin/users/65e000000000000000000004/status',
      adminToken,
      { accountStatus: 'active', reason: 'Identity verified' }
    );
    assert(patchUserRes.status === 200, 'User status update returns 200 OK');

    // TEST 6: Provider Fleet & Verification
    console.log('\n  --- 6. Provider Approvals & Fleet Review ---');
    const provRes = await makeRequest(server, 'GET', '/api/admin/providers', adminToken);
    assert(provRes.status === 200, 'List providers returns 200 OK');
    assert(Array.isArray(provRes.body.data), 'Providers list returned as array');

    const verifyRes = await makeRequest(
      server,
      'PATCH',
      '/api/admin/providers/65e000000000000000000021/verify',
      adminToken,
      { verified: true, notes: 'Accreditation certified' }
    );
    assert(verifyRes.status === 200, 'Provider verification returns 200 OK');

    // TEST 7: Emergency Services Directory CRUD
    console.log('\n  --- 7. Emergency Services Directory CRUD ---');
    const servicesRes = await makeRequest(server, 'GET', '/api/admin/services', adminToken);
    assert(servicesRes.status === 200, 'Get emergency services returns 200 OK');
    assert(servicesRes.body.summaryCounts !== undefined, 'Emergency services summary counts included');

    const createServiceRes = await makeRequest(
      server,
      'POST',
      '/api/admin/services',
      adminToken,
      {
        name: 'Galle International Maritime & Coast Rescue',
        type: 'Coast Guard & Marine',
        address: 'Harbour Approach Road, Galle',
        coordinates: [80.221, 6.035],
        contactInfo: { phone: '+94 91 223 9999', emergencyHotline: '119' },
        servicesOffered: ['Marine Search & Rescue', 'Diver Response'],
      }
    );
    assert(createServiceRes.status === 201, 'Create emergency service returns 201 Created');
    const createdId = createServiceRes.body.data._id;

    const patchServiceRes = await makeRequest(
      server,
      'PATCH',
      `/api/admin/services/${createdId}`,
      adminToken,
      { rating: 5.0 }
    );
    assert(patchServiceRes.status === 200, 'Update emergency service returns 200 OK');

    const deleteServiceRes = await makeRequest(
      server,
      'DELETE',
      `/api/admin/services/${createdId}`,
      adminToken
    );
    assert(deleteServiceRes.status === 200, 'Delete emergency service returns 200 OK');

    // TEST 8: System Audit Logs Viewer
    console.log('\n  --- 8. System Audit Log Records ---');
    const auditRes = await makeRequest(server, 'GET', '/api/admin/audit-logs', adminToken);
    assert(auditRes.status === 200, 'Audit log endpoint returns 200 OK');
    assert(Array.isArray(auditRes.body.data), 'Audit logs returned as array');
    assert(auditRes.body.data.length >= 1, 'Audit log has recorded admin operations');

    // TEST 9: CSV Report Export
    console.log('\n  --- 9. Operations CSV Report Export ---');
    const csvRes = await makeRequest(server, 'GET', '/api/admin/export/csv', adminToken);
    assert(csvRes.status === 200, 'CSV export returns 200 OK');
    assert(csvRes.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');
    assert(csvRes.raw.includes('Incident ID,Title,Category,Severity'), 'CSV contains correct header columns');

    console.log('\n===========================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAdminModuleTests();
