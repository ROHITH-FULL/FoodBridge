
const bcrypt = require('bcryptjs');
const { transaction, closePool } = require('./db.postgres');

async function seedPostgres() {
  const passwordHashes = {
    admin: bcrypt.hashSync('admin123', 10),
    organizer: bcrypt.hashSync('organizer123', 10),
    catering: bcrypt.hashSync('catering123', 10),
    ngo: bcrypt.hashSync('ngo123', 10)
  };

  await transaction(async (tx) => {
    async function createUser(name, email, mobile, passwordHash, role) {
      return tx.get(
        `INSERT INTO users
          (full_name, email, mobile, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          mobile = EXCLUDED.mobile,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role
         RETURNING id`,
        [name, email, mobile, passwordHash, role]
      );
    }

    async function createNgo(userId, name, address, postalCode, capacity, status) {
      await tx.query(
        `INSERT INTO organizations
          (user_id, organization_name, registration_details,
           address, city, postal_code, collection_capacity_kg,
           availability_information, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET
          organization_name = EXCLUDED.organization_name,
          registration_details = EXCLUDED.registration_details,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          postal_code = EXCLUDED.postal_code,
          collection_capacity_kg = EXCLUDED.collection_capacity_kg,
          availability_information = EXCLUDED.availability_information,
          verification_status = EXCLUDED.verification_status`,
        [
          userId, name, 'FoodBridge demo organization',
          address, 'Metro City', postalCode, capacity,
          'Mon-Sun 08:00 - 22:00', status
        ]
      );
    }

    await createUser(
      'Platform Administrator',
      'admin@foodbridge.org',
      '+1 555-0100',
      passwordHashes.admin,
      'ADMIN'
    );

    await createUser(
      'Anita Sharma (Grand Palace Events)',
      'organizer@foodbridge.org',
      '+1 555-0101',
      passwordHashes.organizer,
      'ORGANIZER'
    );

    await createUser(
      'Marcus Vance (Apex Corporate Catering)',
      'catering@foodbridge.org',
      '+1 555-0102',
      passwordHashes.catering,
      'ORGANIZER'
    );

    const ngo1 = await createUser(
      'Hope Community Food Bank',
      'ngo.hope@foodbridge.org',
      '+1 555-0201',
      passwordHashes.ngo,
      'NGO'
    );

    const ngo2 = await createUser(
      'Harbor Relief Shelter',
      'ngo.shelter@foodbridge.org',
      '+1 555-0202',
      passwordHashes.ngo,
      'NGO'
    );

    const ngo3 = await createUser(
      'New Dawn Youth Mission',
      'ngo.new@foodbridge.org',
      '+1 555-0203',
      passwordHashes.ngo,
      'NGO'
    );

    await createNgo(
      ngo1.id, 'Hope Community Food Bank',
      '450 Compassion Way', '10001', 150, 'VERIFIED'
    );

    await createNgo(
      ngo2.id, 'Harbor Relief Shelter',
      '812 Harbor Boulevard', '10002', 80, 'VERIFIED'
    );

    await createNgo(
      ngo3.id, 'New Dawn Youth Mission',
      '230 Sunrise Avenue', '10005', 40, 'PENDING'
    );
  });

  console.log('PostgreSQL demo accounts created successfully.');
}

seedPostgres()
  .catch((error) => {
    console.error('Demo seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
