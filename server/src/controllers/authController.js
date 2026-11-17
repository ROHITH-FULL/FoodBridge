const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run, transaction } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function register(req, res) {
  const { full_name, email, mobile, password, role, organization } = req.body;

  // Check if user already exists
  const existingUser = get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  try {
    const result = transaction(({ run, get }) => {
      const userRes = run(`
        INSERT INTO users (full_name, email, mobile, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `, [full_name.trim(), email.trim().toLowerCase(), mobile.trim(), passwordHash, role]);

      const userId = userRes.lastInsertRowid;
      let orgData = null;

      if (role === 'NGO') {
        const capacity = organization.collection_capacity_kg ? Number(organization.collection_capacity_kg) : 50.0;
        const orgRes = run(`
          INSERT INTO organizations (
            user_id, organization_name, registration_details, address, city, postal_code,
            collection_capacity_kg, availability_information, verification_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `, [
          userId,
          organization.organization_name.trim(),
          organization.registration_details ? organization.registration_details.trim() : null,
          organization.address.trim(),
          organization.city.trim(),
          organization.postal_code.trim(),
          capacity,
          organization.availability_information || 'Mon-Sun 09:00 - 20:00'
        ]);

        orgData = get('SELECT * FROM organizations WHERE id = ?', [orgRes.lastInsertRowid]);
      }

      const createdUser = get('SELECT id, full_name, email, mobile, role, created_at FROM users WHERE id = ?', [userId]);
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
    return res.status(500).json({ success: false, message: 'Failed to complete registration.' });
  }
}

function login(req, res) {
  const { email, password } = req.body;

  const user = get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  let orgData = null;
  if (user.role === 'NGO') {
    orgData = get('SELECT * FROM organizations WHERE user_id = ?', [user.id]);
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
}

function getMe(req, res) {
  let orgData = null;
  if (req.user.role === 'NGO') {
    orgData = get('SELECT * FROM organizations WHERE user_id = ?', [req.user.id]);
  }

  return res.json({
    success: true,
    user: req.user,
    organization: orgData
  });
}

// 1-Click presentation demo login
function demoLogin(req, res) {
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
  const user = get('SELECT * FROM users WHERE email = ?', [targetEmail]);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Demo account not found. Please run seed script.' });
  }

  let orgData = null;
  if (user.role === 'NGO') {
    orgData = get('SELECT * FROM organizations WHERE user_id = ?', [user.id]);
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
}

module.exports = {
  register,
  login,
  getMe,
  demoLogin,
};
