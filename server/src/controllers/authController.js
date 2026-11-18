
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, transaction } = require('../database/db.postgres');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res) {
  const { full_name, email, mobile, password, role, organization } = req.body;

  try {
    const existingUser = await get(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await transaction(async ({ query, get }) => {
      const userRows = await query(`
        INSERT INTO users (full_name, email, mobile, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        full_name.trim(),
        email.trim().toLowerCase(),
        mobile.trim(),
        passwordHash,
        role
      ]);

      const userId = userRows[0].id;
      let orgData = null;

      if (role === 'NGO') {
        const capacity = organization.collection_capacity_kg
          ? Number(organization.collection_capacity_kg)
          : 50.0;

        const orgRows = await query(`
          INSERT INTO organizations (
            user_id, organization_name, registration_details, address, city,
            postal_code, collection_capacity_kg, availability_information,
            verification_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
          RETURNING id
        `, [
          userId,
          organization.organization_name.trim(),
          organization.registration_details
            ? organization.registration_details.trim()
            : null,
          organization.address.trim(),
          organization.city.trim(),
          organization.postal_code.trim(),
          capacity,
          organization.availability_information || 'Mon-Sun 09:00 - 20:00'
        ]);

        orgData = await get(
          'SELECT * FROM organizations WHERE id = $1',
          [orgRows[0].id]
        );
      }

      const createdUser = await get(`
        SELECT id, full_name, email, mobile, role, created_at
        FROM users
        WHERE id = $1
      `, [userId]);

      return { user: createdUser, organization: orgData };
    });

    const token = generateToken(result.user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: result.user,
      organization: result.organization
    });

  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to complete registration.'
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await get(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    let orgData = null;

    if (user.role === 'NGO') {
      orgData = await get(
        'SELECT * FROM organizations WHERE user_id = $1',
        [user.id]
      );
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        created_at: user.created_at
      },
      organization: orgData
    });

  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      success: false,
      message: 'Login failed.'
    });
  }
}

async function getMe(req, res) {
  try {
    let orgData = null;

    if (req.user.role === 'NGO') {
      orgData = await get(
        'SELECT * FROM organizations WHERE user_id = $1',
        [req.user.id]
      );
    }

    return res.json({
      success: true,
      user: req.user,
      organization: orgData
    });

  } catch (err) {
    console.error('Get profile error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
}

// 1-Click presentation demo login
async function demoLogin(req, res) {
  try {
    const { roleType } = req.body;

    const demoEmailMap = {
      admin: 'admin@foodbridge.org',
      organizer: 'organizer@foodbridge.org',
      catering: 'catering@foodbridge.org',
      ngo_hope: 'ngo.hope@foodbridge.org',
      ngo_shelter: 'ngo.shelter@foodbridge.org',
      ngo_new: 'ngo.new@foodbridge.org'
    };

    const targetEmail = demoEmailMap[roleType] || demoEmailMap.organizer;

    const user = await get(
      'SELECT * FROM users WHERE email = $1',
      [targetEmail]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Demo account not found. Please run seed script.'
      });
    }

    let orgData = null;

    if (user.role === 'NGO') {
      orgData = await get(
        'SELECT * FROM organizations WHERE user_id = $1',
        [user.id]
      );
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Logged in as demo ${roleType} (${user.full_name})`,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        created_at: user.created_at
      },
      organization: orgData
    });

  } catch (err) {
    console.error('Demo login error:', err);

    return res.status(500).json({
      success: false,
      message: 'Demo login failed.'
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  demoLogin
};
