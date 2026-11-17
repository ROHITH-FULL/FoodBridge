const ALLOWED_CATEGORIES = [
  'Cooked meals',
  'Rice and other grains',
  'Bread and bakery',
  'Fruits',
  'Vegetables',
  'Packaged food',
  'Dairy and beverages',
  'Other'
];

function validateFoodListing(req, res, next) {
  const {
    title,
    category,
    quantity_kg,
    preparation_time,
    storage_information,
    address,
    city,
    postal_code,
    pickup_deadline,
    contact_person,
    contact_phone,
    safety_declaration
  } = req.body;

  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('Listing title is required (minimum 3 characters).');
  }

  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  const qty = Number(quantity_kg);
  if (isNaN(qty) || qty <= 0) {
    errors.push('Quantity must be a positive number in kilograms (kg).');
  }

  if (!preparation_time) {
    errors.push('Preparation date and time is required.');
  } else {
    const prepDate = new Date(preparation_time);
    if (isNaN(prepDate.getTime())) {
      errors.push('Invalid preparation date and time format.');
    }
  }

  if (!pickup_deadline) {
    errors.push('Pickup deadline is required.');
  } else {
    const deadlineDate = new Date(pickup_deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.push('Invalid pickup deadline format.');
    } else if (deadlineDate.getTime() <= Date.now()) {
      errors.push('Pickup deadline cannot be in the past. Please set a future deadline.');
    }
  }

  if (!storage_information || storage_information.trim().length < 5) {
    errors.push('Storage and handling details are required to ensure food safety.');
  }

  if (!address || address.trim().length < 3) {
    errors.push('Pickup address is required.');
  }

  if (!city || city.trim().length < 2) {
    errors.push('City is required.');
  }

  if (!postal_code || postal_code.trim().length < 2) {
    errors.push('Postal/ZIP code is required.');
  }

  if (!contact_person || contact_person.trim().length < 2) {
    errors.push('Contact person name is required.');
  }

  if (!contact_phone || contact_phone.trim().length < 7) {
    errors.push('Valid contact phone number is required.');
  }

  if (!safety_declaration || safety_declaration === false || safety_declaration === 'false') {
    errors.push('Food safety declaration must be accepted prior to submitting food listing.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors, message: errors[0] });
  }

  // Calculate conservative food safety eligibility
  let eligibilityStatus = 'ELIGIBLE';
  const prepTimeMs = new Date(preparation_time).getTime();
  const elapsedHours = (Date.now() - prepTimeMs) / (1000 * 60 * 60);

  // If cooked meals were prepared more than 4 hours ago, mark as FLAGGED requiring immediate cold/hot chain review
  if (category === 'Cooked meals' && elapsedHours > 4) {
    eligibilityStatus = 'FLAGGED';
  }

  req.calculatedEligibility = eligibilityStatus;

  next();
}

module.exports = {
  validateFoodListing,
  ALLOWED_CATEGORIES,
};
