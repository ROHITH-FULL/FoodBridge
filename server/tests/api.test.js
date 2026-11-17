const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const { seedData } = require('../src/database/seedData');
const { scoreMatch } = require('../src/controllers/matchingController');

let server;
let baseUrl;

before(async () => {
  // Re-seed database before test run
  seedData();
  
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('1. Health and Authentication API', () => {
  test('GET /api/health should return ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
  });

  test('POST /api/auth/login with valid credentials should return JWT token', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'organizer@foodbridge.org',
        password: 'organizer123'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.role, 'ORGANIZER');
  });

  test('POST /api/auth/login with invalid password should fail (401)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'organizer@foodbridge.org',
        password: 'wrong_password'
      })
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('POST /api/auth/register should create new user with hashed password', async () => {
    const testEmail = `neworganizer_${Date.now()}@test.org`;
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test Organizer User',
        email: testEmail,
        mobile: '+1 555-9988',
        password: 'password123',
        role: 'ORGANIZER'
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.email, testEmail);
  });

  test('POST /api/auth/register with duplicate email should be rejected (409)', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Duplicate Organizer',
        email: 'organizer@foodbridge.org',
        mobile: '+1 555-9988',
        password: 'password123',
        role: 'ORGANIZER'
      })
    });
    assert.equal(res.status, 409);
  });

  test('POST /api/auth/demo-login should log in as predefined demo account', async () => {
    const res = await fetch(`${baseUrl}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleType: 'admin' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.role, 'ADMIN');
  });
});

describe('2. Food Listing Creation and Validation', () => {
  let organizerToken;

  before(async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@foodbridge.org', password: 'organizer123' })
    });
    const data = await res.json();
    organizerToken = data.token;
  });

  test('Creating listing with past deadline should be rejected (400)', async () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    const res = await fetch(`${baseUrl}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${organizerToken}`
      },
      body: JSON.stringify({
        title: 'Past Food Listing',
        category: 'Cooked meals',
        quantity_kg: 10,
        preparation_time: pastTime,
        storage_information: 'Hot held',
        address: '100 Main St',
        city: 'Metro City',
        postal_code: '10001',
        pickup_deadline: pastTime, // Past deadline!
        contact_person: 'Anita',
        contact_phone: '+1 555-0101',
        safety_declaration: true
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /past/i);
  });

  test('Creating listing without safety declaration should be rejected (400)', async () => {
    const futureTime = new Date(Date.now() + 3600000 * 5).toISOString();
    const res = await fetch(`${baseUrl}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${organizerToken}`
      },
      body: JSON.stringify({
        title: 'Unchecked Safety Listing',
        category: 'Cooked meals',
        quantity_kg: 15,
        preparation_time: new Date().toISOString(),
        storage_information: 'Insulated container',
        address: '100 Main St',
        city: 'Metro City',
        postal_code: '10001',
        pickup_deadline: futureTime,
        contact_person: 'Anita',
        contact_phone: '+1 555-0101',
        safety_declaration: false // Not accepted!
      })
    });
    assert.equal(res.status, 400);
  });

  test('Creating valid food listing should succeed with ELIGIBLE status', async () => {
    const futureTime = new Date(Date.now() + 3600000 * 6).toISOString();
    const res = await fetch(`${baseUrl}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${organizerToken}`
      },
      body: JSON.stringify({
        title: 'Fresh Corporate Buffet Sandwiches',
        category: 'Bread and bakery',
        description: 'Assorted vegetarian wraps and sandwiches',
        quantity_kg: 20.0,
        estimated_servings: 40,
        preparation_time: new Date(Date.now() - 3600000).toISOString(),
        dietary_type: 'VEGETARIAN',
        storage_information: 'Kept chilled at 4°C in clean catering trays',
        address: '250 Enterprise Road',
        area: 'Business District',
        city: 'Metro City',
        postal_code: '10001',
        pickup_deadline: futureTime,
        contact_person: 'Anita Sharma',
        contact_phone: '+1 555-0101',
        safety_declaration: true
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.listing.eligibility_status, 'ELIGIBLE');
    assert.equal(data.listing.listing_status, 'AVAILABLE');
  });
});

describe('3. Rule-Based Smart Matching Logic', () => {
  test('scoreMatch should grant points for verification, capacity, and proximity', () => {
    const listing = {
      quantity_kg: 25.0,
      city: 'Metro City',
      postal_code: '10001',
      pickup_deadline: new Date(Date.now() + 3600000 * 6).toISOString()
    };

    const verifiedOrg = {
      verification_status: 'VERIFIED',
      collection_capacity_kg: 100.0,
      city: 'Metro City',
      postal_code: '10001',
      availability_information: '08:00 - 20:00'
    };

    const result = scoreMatch(listing, verifiedOrg);
    assert.ok(result.score >= 80, 'Score should be high for verified near org with surplus capacity');
    assert.equal(result.matchTier, 'High Match');
    assert.ok(result.factors.some(f => f.factor === 'Organization Verification' && f.status === 'MATCH'));
  });

  test('scoreMatch should score lower for unverified pending organization', () => {
    const listing = {
      quantity_kg: 50.0,
      city: 'Metro City',
      postal_code: '10001',
      pickup_deadline: new Date(Date.now() + 3600000 * 6).toISOString()
    };

    const pendingOrg = {
      verification_status: 'PENDING',
      collection_capacity_kg: 20.0,
      city: 'Other City',
      postal_code: '99999',
    };

    const result = scoreMatch(listing, pendingOrg);
    assert.ok(result.score < 50, 'Score should be low for unverified org with low capacity in another city');
    assert.equal(result.matchTier, 'Low Match');
  });
});

describe('4. Donation Request Workflow, Pickup Code, and Handover', () => {
  let verifiedNgoToken;
  let unverifiedNgoToken;
  let listingIdToClaim;

  before(async () => {
    // Get verified NGO token
    const resVerified = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ngo.hope@foodbridge.org', password: 'ngo123' })
    });
    const dataVerified = await resVerified.json();
    verifiedNgoToken = dataVerified.token;

    // Get unverified NGO token
    const resPending = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ngo.new@foodbridge.org', password: 'ngo123' })
    });
    const dataPending = await resPending.json();
    unverifiedNgoToken = dataPending.token;

    // Get an available listing id (listing 1 from seed)
    const resListings = await fetch(`${baseUrl}/food`);
    const dataListings = await resListings.json();
    const available = dataListings.listings.find(l => l.listing_status === 'AVAILABLE');
    assert.ok(available, 'At least one listing should be available from seed');
    listingIdToClaim = available.id;
  });

  test('Unverified NGO cannot claim listing (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/requests/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${unverifiedNgoToken}`
      },
      body: JSON.stringify({ listing_id: listingIdToClaim })
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.message, /verified/i);
  });

  let claimRequestId;
  let generatedPickupCode;

  test('Verified NGO claims listing successfully with generated pickup confirmation code', async () => {
    const res = await fetch(`${baseUrl}/requests/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifiedNgoToken}`
      },
      body: JSON.stringify({ listing_id: listingIdToClaim })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.request_id);
    assert.ok(data.pickup_code);
    claimRequestId = data.request_id;
    generatedPickupCode = data.pickup_code;
  });

  test('Concurrent attempt to claim the same listing fails (duplicate prevention / race condition test)', async () => {
    const res = await fetch(`${baseUrl}/requests/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifiedNgoToken}`
      },
      body: JSON.stringify({ listing_id: listingIdToClaim })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /no longer available/i);
  });

  test('Schedule pickup updates status to PICKUP_SCHEDULED', async () => {
    const pickupTime = new Date(Date.now() + 3600000).toISOString();
    const res = await fetch(`${baseUrl}/requests/${claimRequestId}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifiedNgoToken}`
      },
      body: JSON.stringify({
        scheduled_pickup_time: pickupTime,
        notes: 'Arriving in vehicle #1'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
  });

  test('Confirming pickup with wrong code fails (400)', async () => {
    const res = await fetch(`${baseUrl}/requests/${claimRequestId}/confirm-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifiedNgoToken}`
      },
      body: JSON.stringify({
        pickup_code: 'WRONG-CODE',
        collected_quantity_kg: 35.0
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /invalid pickup/i);
  });

  test('Confirming pickup with valid code updates status to COLLECTED and records weight', async () => {
    const res = await fetch(`${baseUrl}/requests/${claimRequestId}/confirm-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifiedNgoToken}`
      },
      body: JSON.stringify({
        pickup_code: generatedPickupCode,
        collected_quantity_kg: 34.5,
        notes: 'Verified and weighed on site.'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.collected_quantity_kg, 34.5);
  });

  test('Complete handover transitions to HANDED_OVER and marks listing COMPLETED', async () => {
    const res = await fetch(`${baseUrl}/requests/${claimRequestId}/complete-handover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifiedNgoToken}`
      },
      body: JSON.stringify({
        handed_over_quantity_kg: 34.5,
        notes: 'Distributed to community shelter dining hall.'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.handed_over_quantity_kg, 34.5);
  });
});

describe('5. Admin Verification and Impact Analytics', () => {
  let adminToken;
  let organizerToken;

  before(async () => {
    const resAdmin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@foodbridge.org', password: 'admin123' })
    });
    const dataAdmin = await resAdmin.json();
    adminToken = dataAdmin.token;

    const resOrg = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@foodbridge.org', password: 'organizer123' })
    });
    const dataOrg = await resOrg.json();
    organizerToken = dataOrg.token;
  });

  test('Non-admin user cannot access admin dashboard (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/dashboard/admin`, {
      headers: { 'Authorization': `Bearer ${organizerToken}` }
    });
    assert.equal(res.status, 403);
  });

  test('Admin can view admin dashboard metrics and pending organizations', async () => {
    const res = await fetch(`${baseUrl}/dashboard/admin`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.users.total_users > 0);
    assert.ok(data.organizations.total_organizations > 0);
  });

  test('Admin can approve pending NGO verification', async () => {
    // Dynamically retrieve pending organization
    const orgsRes = await fetch(`${baseUrl}/organizations?status=PENDING`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const orgsData = await orgsRes.json();
    assert.ok(orgsData.organizations.length > 0, 'Should find at least 1 pending organization');
    const targetOrgId = orgsData.organizations[0].id;

    const res = await fetch(`${baseUrl}/organizations/${targetOrgId}/verification`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        review_status: 'VERIFIED',
        review_notes: 'Approved after telephone verification and license check.'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.verification_status, 'VERIFIED');
  });

  test('GET /api/dashboard/impact reports honest metrics and demo flag', async () => {
    const res = await fetch(`${baseUrl}/dashboard/impact`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.metrics.total_kg_listed > 0);
    assert.ok(data.metrics.total_kg_handed_over > 0);
    assert.ok(data.is_sample_data, 'Demo data flag should be honest');
    assert.match(data.disclaimer, /demonstration data/i);
  });

  test('GET /api/dashboard/impact/export-csv returns valid CSV format', async () => {
    const res = await fetch(`${baseUrl}/dashboard/impact/export-csv`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.match(text, /Listing ID,Title,Category/);
  });
});
