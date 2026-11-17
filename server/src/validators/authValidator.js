function validateRegistration(req, res, next) {
  const { full_name, email, mobile, password, role, organization } = req.body;
  const errors = [];

  if (!full_name || full_name.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!mobile || mobile.trim().length < 7) {
    errors.push('A valid contact mobile number is required.');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (!['ORGANIZER', 'NGO'].includes(role)) {
    errors.push('Role must be either "ORGANIZER" (Event Host/Caterer) or "NGO" (Receiving Relief Org).');
  }

  if (role === 'NGO') {
    if (!organization || !organization.organization_name || organization.organization_name.trim().length < 2) {
      errors.push('Organization name is required for NGO accounts.');
    }
    if (!organization || !organization.address || organization.address.trim().length < 3) {
      errors.push('Physical operating address is required for NGO accounts.');
    }
    if (!organization || !organization.city || organization.city.trim().length < 2) {
      errors.push('City is required for NGO accounts.');
    }
    if (!organization || !organization.postal_code || organization.postal_code.trim().length < 2) {
      errors.push('Postal/ZIP code is required for NGO accounts.');
    }
    if (organization && organization.collection_capacity_kg && (isNaN(Number(organization.collection_capacity_kg)) || Number(organization.collection_capacity_kg) <= 0)) {
      errors.push('Collection capacity must be a positive number in kilograms.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors[0] });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  next();
}

module.exports = {
  validateRegistration,
  validateLogin,
};
