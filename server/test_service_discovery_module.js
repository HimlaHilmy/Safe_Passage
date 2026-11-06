const {
  getServices,
  getNearbyServices,
  getCategories,
  getServiceById,
} = require('./controllers/serviceController');

function mockReq(query = {}, params = {}) {
  let statusCode = 200;
  let responseData = null;

  const req = { query, params };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  const next = (err) => {
    statusCode = 500;
    responseData = { error: err.message };
  };

  return { req, res, next, getResult: () => ({ status: statusCode, body: responseData }) };
}

async function runTests() {
  console.log('========================================================================');
  console.log('  SAFE PASSAGE — MEMBER 2 (SAMINDIKA) SERVICE DISCOVERY TEST SUITE');
  console.log('========================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${testName}`);
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  // 1. Categories
  console.log('[Test Group 1] Service Categories');
  {
    const { req, res, next, getResult } = mockReq();
    await getCategories(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'GET /categories returns 200');
    assert(result.body.success === true, 'Categories response success is true');
    const keys = result.body.data.map((c) => c.key);
    assert(keys.includes('Hospitals'), 'Supports Hospitals category');
    assert(keys.includes('Police Stations'), 'Supports Police Stations category');
    assert(keys.includes('Embassies'), 'Supports Embassies category');
    assert(keys.includes('Mechanics'), 'Supports Mechanics category');
    assert(keys.includes('Towing Services'), 'Supports Towing Services category');
  }

  // 2. Coordinate and Radius Validation
  console.log('\n[Test Group 2] Geospatial Coordinate & Radius Validation');
  {
    const { req, res, next, getResult } = mockReq({ lat: '6.9271' });
    await getNearbyServices(req, res, next);
    assert(getResult().status === 400 && getResult().body.error === 'MISSING_LONGITUDE', 'Missing longitude rejected with 400 MISSING_LONGITUDE');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612' });
    await getNearbyServices(req, res, next);
    assert(getResult().status === 400 && getResult().body.error === 'MISSING_LATITUDE', 'Missing latitude rejected with 400 MISSING_LATITUDE');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '95.5' });
    await getNearbyServices(req, res, next);
    assert(getResult().status === 400 && getResult().body.error === 'INVALID_COORDINATES', 'Latitude > 90 rejected with 400 INVALID_COORDINATES');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '200', lat: '6.9271' });
    await getNearbyServices(req, res, next);
    assert(getResult().status === 400 && getResult().body.error === 'INVALID_COORDINATES', 'Longitude > 180 rejected with 400 INVALID_COORDINATES');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: 'abc' });
    await getNearbyServices(req, res, next);
    assert(getResult().status === 400 && getResult().body.error === 'INVALID_COORDINATES', 'Non-numeric latitude rejected with 400 INVALID_COORDINATES');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '6.9271', radius: '-500' });
    await getNearbyServices(req, res, next);
    assert(getResult().status === 400 && getResult().body.error === 'INVALID_RADIUS', 'Negative radius rejected with 400 INVALID_RADIUS');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '6.9271', radius: '99999999' });
    await getNearbyServices(req, res, next);
    assert(getResult().status === 400 && getResult().body.error === 'INVALID_RADIUS', 'Radius > 500km rejected with 400 INVALID_RADIUS');
  }

  // 3. Nearby Geospatial Discovery Query
  console.log('\n[Test Group 3] Nearby Discovery Query & Radius Filtering');
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '6.9271', radius: '10000' });
    await getNearbyServices(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'GET /nearby returns 200 OK');
    assert(result.body.success === true, 'Response payload success is true');
    assert(result.body.count > 0, `Discovered ${result.body.count} services within 10km`);
    assert(result.body.data.every((s) => s.distanceMeters <= 10000), 'All returned services are within 10,000 meters radius');
    assert(result.body.data[0].distanceMeters <= result.body.data[result.body.data.length - 1].distanceMeters, 'Results sorted by distance ascending');
    assert(!!result.body.data[0].distanceKm, 'Results contain distanceKm formatting');
  }

  // 4. Category Filtering on Geospatial Discovery
  console.log('\n[Test Group 4] Category Filtering on Geospatial Discovery');
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '6.9271', radius: '50000', type: 'Hospitals' });
    await getNearbyServices(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'Hospitals filter returns 200');
    assert(result.body.data.every((s) => s.type === 'Hospital & Medical' || s.type === 'Hospitals'), 'All results match Hospital category');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '6.9271', radius: '50000', type: 'Police Stations' });
    await getNearbyServices(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'Police Stations filter returns 200');
    assert(result.body.data.every((s) => s.type === 'Police Station' || s.type === 'Police Stations'), 'All results match Police category');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '6.9271', radius: '50000', type: 'Embassies' });
    await getNearbyServices(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'Embassies filter returns 200');
    assert(result.body.data.every((s) => s.type === 'Embassy & Consulate' || s.type === 'Embassies'), 'All results match Embassy category');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '6.9271', radius: '50000', type: 'Mechanics' });
    await getNearbyServices(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'Mechanics filter returns 200');
    assert(result.body.data.every((s) => s.type === 'Mechanic & Repair' || s.type === 'Mechanics'), 'All results match Mechanics category');
  }
  {
    const { req, res, next, getResult } = mockReq({ lng: '79.8612', lat: '6.9271', radius: '50000', type: 'Towing Services' });
    await getNearbyServices(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'Towing Services filter returns 200');
    assert(result.body.data.every((s) => s.type === 'Roadside & Towing' || s.type === 'Towing Services'), 'All results match Towing category');
  }

  // 5. Directory Listing & Keyword Search
  console.log('\n[Test Group 5] Directory Listing & Keyword Search');
  {
    const { req, res, next, getResult } = mockReq();
    await getServices(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'GET /services returns 200');
    assert(result.body.count >= 20, `Directory contains comprehensive records (count=${result.body.count})`);
  }
  {
    const { req, res, next, getResult } = mockReq({ search: 'Trauma' });
    await getServices(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'Keyword search returns 200');
    assert(result.body.data.some((s) => s.name.includes('Trauma') || s.servicesOffered?.some((x) => x.includes('Trauma'))), 'Search filters records by name or capability');
  }

  // 6. Get Service by ID
  console.log('\n[Test Group 6] Get Service by ID');
  {
    const { req, res, next, getResult } = mockReq({}, { id: '65s000000000000000000001' });
    await getServiceById(req, res, next);
    const result = getResult();
    assert(result.status === 200, 'GET /services/:id returns 200');
    assert(result.body.data?.name?.includes('National Hospital'), 'Returns correct National Hospital record');
  }
  {
    const { req, res, next, getResult } = mockReq({}, { id: '999999999999999999999999' });
    await getServiceById(req, res, next);
    const result = getResult();
    assert(result.status === 404, 'Unknown ID returns 404 NOT_FOUND');
  }

  console.log('\n========================================================================');
  console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('  ALL GEOLOCATION & SERVICE DISCOVERY TESTS PASSED! 🎯');
  } else {
    console.log(`  ${totalTests - passedTests} TESTS FAILED.`);
  }
  console.log('========================================================================\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

runTests();
