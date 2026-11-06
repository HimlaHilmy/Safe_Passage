const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./app');
const { connectDB } = require('./config/db');

async function testHttpEndpoints() {
  console.log('================================================================');
  console.log('  SAFE PASSAGE: HTTP ENDPOINTS & API INTEGRATION VERIFICATION    ');
  console.log('================================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://127.0.0.1:5099/api';

  const tokenAlice = jwt.sign(
    { id: '65e000000000000000000001', name: 'Sarah Jenkins', role: 'traveler' },
    process.env.JWT_SECRET || 'safe_passage_dev_secret_university_project_2026'
  );

  const tokenBob = jwt.sign(
    { id: '65e000000000000000000099', name: 'Bob Smith', role: 'traveler' },
    process.env.JWT_SECRET || 'safe_passage_dev_secret_university_project_2026'
  );

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

  // 1. Health Endpoint
  const healthRes = await fetch(`${baseUrl}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.status === 'healthy', 'GET /api/health returned healthy status');

  // 2. POST /api/incidents - Create incident as Alice
  const postRes = await fetch(`${baseUrl}/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenAlice}`,
    },
    body: JSON.stringify({
      category: 'Theft or Security Incident',
      title: 'Mugging attempt near bus terminal',
      description: 'Two individuals attempted to snatch purse near terminal exit. Security officers intervened.',
      severity: 'Critical',
      incidentDate: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [79.8612, 6.9271],
        address: 'Pettah Inter-City Bus Terminal Gate 3',
        landmark: 'Near clock tower',
      },
      media: [],
    }),
  });

  const postData = await postRes.json();
  assert(postRes.status === 201, `POST /api/incidents returned 201 Created`);
  assert(postData.success === true, 'Response envelope has success: true');
  assert(/^INC-\d{8}-\d{4}$/.test(postData.data.incidentReference), `Incident reference returned: ${postData.data.incidentReference}`);
  const createdId = postData.data._id;

  // 3. GET /api/incidents as Alice
  const getAliceRes = await fetch(`${baseUrl}/incidents`, {
    headers: { Authorization: `Bearer ${tokenAlice}` },
  });
  const getAliceData = await getAliceRes.json();
  assert(getAliceRes.status === 200, 'GET /api/incidents returned 200 OK');
  assert(getAliceData.data.some((i) => i._id === createdId), "Alice's incident appears in her incidents list");

  // 4. GET /api/incidents/:id as Alice (Owner)
  const getDetailRes = await fetch(`${baseUrl}/incidents/${createdId}`, {
    headers: { Authorization: `Bearer ${tokenAlice}` },
  });
  const getDetailData = await getDetailRes.json();
  assert(getDetailRes.status === 200 && getDetailData.data._id === createdId, 'Alice successfully fetched her incident by ID');

  // 5. GET /api/incidents/:id as Bob (Unauthorized other traveler) -> Must be 403 Forbidden!
  const getBobRes = await fetch(`${baseUrl}/incidents/${createdId}`, {
    headers: { Authorization: `Bearer ${tokenBob}` },
  });
  assert(getBobRes.status === 403, `Bob accessing Alice's incident correctly returns 403 Forbidden`);

  // 6. Test Invalid Report (Missing coordinates)
  const invalidRes = await fetch(`${baseUrl}/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenAlice}`,
    },
    body: JSON.stringify({
      category: 'Medical Emergency',
      title: 'Incomplete Report',
      description: 'Description without valid location coordinates.',
      location: {},
    }),
  });
  assert(invalidRes.status === 400, 'Invalid incident without coordinates correctly rejected with 400 Bad Request');

  server.close();
  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(`  HTTP API TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

testHttpEndpoints().catch((e) => {
  console.error(e);
  process.exit(1);
});

