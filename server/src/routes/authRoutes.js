const express = require('express');
const router = express.Router();
const { register, login, getMe, demoLogin } = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../validators/authValidator');
const { authenticate } = require('../middleware/auth');

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/demo-login', demoLogin);
router.get('/me', authenticate, getMe);

module.exports = router;
