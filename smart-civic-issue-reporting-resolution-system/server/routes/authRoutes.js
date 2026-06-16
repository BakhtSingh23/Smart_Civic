const express = require('express');
const rateLimit = require('express-rate-limit');
const {
	registerCitizen,
	registerStaff,
	login,
	getMe,
	changePassword,
} = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: 'Too many requests, please try again later.' },
});

router.post('/register', authLimiter, registerCitizen);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/register-staff', protect, authorizeRoles('admin'), registerStaff);

module.exports = router;
