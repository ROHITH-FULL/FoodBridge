const bcrypt = require('bcryptjs');
const { getDb, run, exec, transaction } = require('./db');
const { initDb } = require('./initDb');

function seedData() {
  console.log('Resetting and seeding FoodBridge database with realistic demo data...');
  
  // Re-run schema to ensure clean slate
  initDb();
  
  // Clean existing tables
  exec(`
    DELETE FROM reports;
    DELETE FROM status_history;
    DELETE FROM donation_requests;
    DELETE FROM organization_verifications;
    DELETE FROM food_listings;
    DELETE FROM organizations;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const organizerHash = bcrypt.hashSync('organizer123', salt);
  const cateringHash = bcrypt.hashSync('catering123', salt);
  const ngoHash = bcrypt.hashSync('ngo123', salt);

  // 1. Insert Users
  const userAdmin = run(`
    INSERT INTO users (full_name, email, mobile, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `, ['Platform Administrator', 'admin@foodbridge.org', '+1 555-0100', adminHash, 'ADMIN']);

  const userOrg1 = run(`
    INSERT INTO users (full_name, email, mobile, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `, ['Anita Sharma (Grand Palace Events)', 'organizer@foodbridge.org', '+1 555-0101', organizerHash, 'ORGANIZER']);

  const userOrg2 = run(`
    INSERT INTO users (full_name, email, mobile, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `, ['Marcus Vance (Apex Corporate Catering)', 'catering@foodbridge.org', '+1 555-0102', cateringHash, 'ORGANIZER']);

  const userNgo1 = run(`
    INSERT INTO users (full_name, email, mobile, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `, ['Hope Community Food Bank', 'ngo.hope@foodbridge.org', '+1 555-0201', ngoHash, 'NGO']);

  const userNgo2 = run(`
    INSERT INTO users (full_name, email, mobile, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `, ['Harbor Relief Shelter', 'ngo.shelter@foodbridge.org', '+1 555-0202', ngoHash, 'NGO']);

  const userNgo3 = run(`
    INSERT INTO users (full_name, email, mobile, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `, ['New Dawn Youth Mission', 'ngo.new@foodbridge.org', '+1 555-0203', ngoHash, 'NGO']);

  // 2. Insert Organizations
  const org1 = run(`
    INSERT INTO organizations (user_id, organization_name, registration_details, address, city, postal_code, collection_capacity_kg, availability_information, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userNgo1.lastInsertRowid,
    'Hope Community Food Bank',
    'Certified Food Relief Org #REG-8821. Temperature controlled vans available.',
    '450 Compassion Way',
    'Metro City',
    '10001',
    150.0,
    'Everyday 08:00 - 22:00',
    'VERIFIED'
  ]);

  const org2 = run(`
    INSERT INTO organizations (user_id, organization_name, registration_details, address, city, postal_code, collection_capacity_kg, availability_information, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userNgo2.lastInsertRowid,
    'Harbor Relief Shelter',
    'Emergency Relief License #REG-4120. Cold storage facility on-site.',
    '812 Harbor Boulevard',
    'Metro City',
    '10002',
    80.0,
    'Mon-Sat 09:00 - 21:00',
    'VERIFIED'
  ]);

  const org3 = run(`
    INSERT INTO organizations (user_id, organization_name, registration_details, address, city, postal_code, collection_capacity_kg, availability_information, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userNgo3.lastInsertRowid,
    'New Dawn Youth Mission',
    'Community Welfare Reg #REG-9044. Pending vehicle safety inspection.',
    '230 Sunrise Avenue',
    'Metro City',
    '10005',
    40.0,
    'Mon-Fri 10:00 - 18:00',
    'PENDING'
  ]);

  // Record verifications for verified orgs
  run(`
    INSERT INTO organization_verifications (organization_id, review_status, reviewer_id, review_notes)
    VALUES (?, 'VERIFIED', ?, 'Verified 501(c)(3) documentation and certified food transport capacity.')
  `, [org1.lastInsertRowid, userAdmin.lastInsertRowid]);

  run(`
    INSERT INTO organization_verifications (organization_id, review_status, reviewer_id, review_notes)
    VALUES (?, 'VERIFIED', ?, 'Approved community emergency shelter registration.')
  `, [org2.lastInsertRowid, userAdmin.lastInsertRowid]);

  // Timestamps for realistic listing deadlines
  const now = new Date();
  const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
  const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
  const tomorrowLater = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();

  // 3. Insert Food Listings
  // Listing 1: Available Cooked Meals
  const listing1 = run(`
    INSERT INTO food_listings (
      organizer_id, title, category, description, quantity_kg, estimated_servings,
      preparation_time, dietary_type, storage_information, address, area, city, postal_code,
      pickup_deadline, contact_person, contact_phone, safety_declaration, eligibility_status,
      listing_status, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userOrg1.lastInsertRowid,
    'Wedding Reception Feast - Vegetable Biryani & Rich Paneer Curry',
    'Cooked meals',
    'Surplus untouched vegetarian dishes from wedding reception dinner. Kept in sealed catering chafing dishes above 60°C.',
    35.0,
    70,
    twoHoursAgo,
    'VEGETARIAN',
    'Maintained in commercial insulated hot boxes. Suitable for immediate redistribution.',
    '700 Grand Ballroom Avenue',
    'Downtown Convention Center',
    'Metro City',
    '10001',
    fourHoursLater,
    'Anita Sharma',
    '+1 555-0101',
    1,
    'ELIGIBLE',
    'AVAILABLE',
    1
  ]);

  // Listing 2: Available Bakery Breads
  const listing2 = run(`
    INSERT INTO food_listings (
      organizer_id, title, category, description, quantity_kg, estimated_servings,
      preparation_time, dietary_type, storage_information, address, area, city, postal_code,
      pickup_deadline, contact_person, contact_phone, safety_declaration, eligibility_status,
      listing_status, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userOrg2.lastInsertRowid,
    'Fresh Artisan Multigrain Breads & Dinner Rolls',
    'Bread and bakery',
    'Unopened artisan bread loaves, multigrain rolls, and croissants prepared this morning for corporate summit.',
    18.0,
    55,
    fiveHoursAgo,
    'VEGETARIAN',
    'Packaged in clean bakery food-grade crates at dry room temperature (21°C).',
    '124 Corporate Plaza',
    'Financial District',
    'Metro City',
    '10002',
    twelveHoursLater,
    'Marcus Vance',
    '+1 555-0102',
    1,
    'ELIGIBLE',
    'AVAILABLE',
    1
  ]);

  // Listing 3: Available Fresh Fruits
  const listing3 = run(`
    INSERT INTO food_listings (
      organizer_id, title, category, description, quantity_kg, estimated_servings,
      preparation_time, dietary_type, storage_information, address, area, city, postal_code,
      pickup_deadline, contact_person, contact_phone, safety_declaration, eligibility_status,
      listing_status, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userOrg1.lastInsertRowid,
    'Chilled Fruit Crates - Apples, Oranges & Bananas',
    'Fruits',
    'Surplus whole washed fruit baskets from university athletic festival.',
    42.0,
    85,
    fiveHoursAgo,
    'VEGAN',
    'Stored in clean refrigerated crates at 7°C. All fruits inspected and whole.',
    '88 Campus Drive, Building C',
    'University Heights',
    'Metro City',
    '10001',
    tomorrowLater,
    'Anita Sharma',
    '+1 555-0101',
    1,
    'ELIGIBLE',
    'AVAILABLE',
    1
  ]);

  // Listing 4: Active In-Progress Pickup
  const listing4 = run(`
    INSERT INTO food_listings (
      organizer_id, title, category, description, quantity_kg, estimated_servings,
      preparation_time, dietary_type, storage_information, address, area, city, postal_code,
      pickup_deadline, contact_person, contact_phone, safety_declaration, eligibility_status,
      listing_status, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userOrg2.lastInsertRowid,
    'Executive Luncheon - Steamed Rice & Spiced Lentil Stew (Dal)',
    'Rice and other grains',
    'Piping hot lentil stew and fragrant basmati rice from corporate technology conference.',
    28.0,
    60,
    twoHoursAgo,
    'VEGETARIAN',
    'Insulated thermo-carriers with temperature log above 65°C.',
    '500 Innovation Way',
    'Tech Park North',
    'Metro City',
    '10001',
    fourHoursLater,
    'Marcus Vance',
    '+1 555-0102',
    1,
    'ELIGIBLE',
    'CLAIMED',
    1
  ]);

  // Listing 5: Completed Handover (Historical impact demo)
  const listing5 = run(`
    INSERT INTO food_listings (
      organizer_id, title, category, description, quantity_kg, estimated_servings,
      preparation_time, dietary_type, storage_information, address, area, city, postal_code,
      pickup_deadline, contact_person, contact_phone, safety_declaration, eligibility_status,
      listing_status, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userOrg1.lastInsertRowid,
    'Charity Gala Dinner - Herb-Roasted Potatoes & Seasonal Medley',
    'Cooked meals',
    'High quality buffet surplus cleanly recovered after annual charity banquet.',
    55.0,
    110,
    yesterday,
    'VEGETARIAN',
    'Maintained in temperature controlled commercial refrigeration prior to handover.',
    '700 Grand Ballroom Avenue',
    'Downtown Convention Center',
    'Metro City',
    '10001',
    yesterday,
    'Anita Sharma',
    '+1 555-0101',
    1,
    'ELIGIBLE',
    'COMPLETED',
    1
  ]);

  // 4. Insert Requests & Status Timelines
  // Request for Listing 4 (Active Pickup Scheduled)
  const req4 = run(`
    INSERT INTO donation_requests (
      food_listing_id, organization_id, request_status, requested_at, accepted_at,
      pickup_scheduled_at, scheduled_pickup_time, pickup_confirmation_code, is_demo
    ) VALUES (?, ?, 'PICKUP_SCHEDULED', ?, ?, ?, ?, 'FB-4892', 1)
  `, [
    listing4.lastInsertRowid,
    org1.lastInsertRowid,
    twoHoursAgo,
    twoHoursAgo,
    now.toISOString(),
    new Date(now.getTime() + 45 * 60 * 1000).toISOString()
  ]);

  // Status history for Listing 4
  run(`
    INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
    VALUES (?, 'AVAILABLE', 'REQUESTED', ?, 'NGO requested surplus listing.')
  `, [req4.lastInsertRowid, userNgo1.lastInsertRowid]);

  run(`
    INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
    VALUES (?, 'REQUESTED', 'ACCEPTED', ?, 'Request accepted by organizer.')
  `, [req4.lastInsertRowid, userOrg2.lastInsertRowid]);

  run(`
    INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
    VALUES (?, 'ACCEPTED', 'PICKUP_SCHEDULED', ?, 'Volunteer vehicle assigned for pickup at 45 min mark.')
  `, [req4.lastInsertRowid, userNgo1.lastInsertRowid]);

  // Request for Listing 5 (Completed Handover)
  const req5 = run(`
    INSERT INTO donation_requests (
      food_listing_id, organization_id, request_status, requested_at, accepted_at,
      pickup_scheduled_at, collected_at, handed_over_at, scheduled_pickup_time,
      collected_quantity_kg, handed_over_quantity_kg, pickup_confirmation_code, is_demo
    ) VALUES (?, ?, 'HANDED_OVER', ?, ?, ?, ?, ?, ?, 55.0, 55.0, 'FB-1044', 1)
  `, [
    listing5.lastInsertRowid,
    org2.lastInsertRowid,
    yesterday,
    yesterday,
    yesterday,
    yesterday,
    yesterday,
    yesterday
  ]);

  run(`
    INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
    VALUES (?, 'AVAILABLE', 'REQUESTED', ?, 'Shelter volunteer driver requested listing.')
  `, [req5.lastInsertRowid, userNgo2.lastInsertRowid]);

  run(`
    INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
    VALUES (?, 'REQUESTED', 'ACCEPTED', ?, 'Organizer verified pickup timeline.')
  `, [req5.lastInsertRowid, userOrg1.lastInsertRowid]);

  run(`
    INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
    VALUES (?, 'ACCEPTED', 'PICKUP_SCHEDULED', ?, 'Scheduled refrigerated van #2.')
  `, [req5.lastInsertRowid, userNgo2.lastInsertRowid]);

  run(`
    INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
    VALUES (?, 'PICKUP_SCHEDULED', 'COLLECTED', ?, 'Pickup verified with code FB-1044. 55.0 kg collected.')
  `, [req5.lastInsertRowid, userOrg1.lastInsertRowid]);

  run(`
    INSERT INTO status_history (request_id, previous_status, new_status, changed_by, notes)
    VALUES (?, 'COLLECTED', 'HANDED_OVER', ?, '55.0 kg successfully delivered to Harbor Shelter soup kitchen.')
  `, [req5.lastInsertRowid, userNgo2.lastInsertRowid]);

  // 5. Insert Sample Demo Report
  run(`
    INSERT INTO reports (reporter_id, listing_id, request_id, reason, details, report_status)
    VALUES (?, ?, ?, 'Packaging observation', 'Donor and NGO coordinated additional thermal blanket for transit.', 'RESOLVED')
  `, [userNgo1.lastInsertRowid, listing4.lastInsertRowid, req4.lastInsertRowid]);

  console.log('Seed completed successfully!');
  console.log('Created accounts:');
  console.log(' - Admin: admin@foodbridge.org / admin123');
  console.log(' - Organizer: organizer@foodbridge.org / organizer123');
  console.log(' - Catering Organizer: catering@foodbridge.org / catering123');
  console.log(' - Verified NGO 1: ngo.hope@foodbridge.org / ngo123');
  console.log(' - Verified NGO 2: ngo.shelter@foodbridge.org / ngo123');
  console.log(' - Pending NGO: ngo.new@foodbridge.org / ngo123');
}

if (require.main === module) {
  seedData();
}

module.exports = { seedData };
