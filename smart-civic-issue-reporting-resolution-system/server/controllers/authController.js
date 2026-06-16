const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hashHelper');
const { sendRegistrationEmail } = require('../utils/emailService');

const signToken = (user) =>
	jwt.sign(
		{ id: user._id, role: user.role, department: user.department },
		process.env.JWT_SECRET,
		{ expiresIn: '7d' }
	);

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

const sendError = (res, status, message) =>
	res.status(status).json({ success: false, message, data: {} });

async function registerCitizen(req, res) {
	try {
		const { name, email, password, phone } = req.body;
		if (!name || !email || !password || !phone) {
			return sendError(res, 400, 'Missing required fields');
		}

		const normalizedEmail = normalizeEmail(email);
		const exists = await User.findOne({ email: normalizedEmail });
		if (exists) {
			return sendError(res, 400, 'Email already exists');
		}

		const hashed = await hashPassword(password);
		const user = await User.create({
			name: String(name).trim(),
			email: normalizedEmail,
			password: hashed,
			phone: String(phone).trim(),
			role: 'citizen',
		});

		let token;
		try {
			token = signToken(user);
		} catch (tokenErr) {
			await User.deleteOne({ _id: user._id });
			return sendError(res, 500, 'Failed to generate authentication token. Please try again.');
		}

		const userPayload = {
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		};

		// Fire welcome email — do not await so it never blocks the response
		sendRegistrationEmail(user).catch(() => {});

		return res.status(201).json({
			success: true,
			message: 'Registration successful',
			token,
			user: userPayload,
			data: { token, user: userPayload },
		});
	} catch (err) {
		return sendError(res, 500, 'Server error');
	}
}

async function registerStaff(req, res) {
	try {
		const { name, email, password, phone, role, department, employeeId } = req.body;
		if (!name || !email || !password || !phone || !role || !department || !employeeId) {
			return sendError(res, 400, 'Missing required fields');
		}

		if (!['officer', 'worker'].includes(role)) {
			return sendError(res, 400, 'Invalid role for staff registration');
		}

		const normalizedEmail = normalizeEmail(email);
		const exists = await User.findOne({ email: normalizedEmail });
		if (exists) {
			return sendError(res, 400, 'Email already exists');
		}

		const hashed = await hashPassword(password);
		const user = await User.create({
			name: String(name).trim(),
			email: normalizedEmail,
			password: hashed,
			phone: String(phone).trim(),
			role,
			department: String(department).trim(),
			employeeId: String(employeeId).trim(),
		});

		return res.status(201).json({
			success: true,
			message: 'Staff account created',
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
					department: user.department,
					employeeId: user.employeeId,
				},
			},
		});
	} catch (err) {
		return sendError(res, 500, 'Server error');
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return sendError(res, 400, 'Email and password are required');
		}

		const user = await User.findOne({ email: normalizeEmail(email) });
		if (!user) {
			return sendError(res, 401, 'Invalid credentials');
		}

		const ok = await comparePassword(password, user.password);
		if (!ok) {
			return sendError(res, 401, 'Invalid credentials');
		}

		if (user.isActive === false) {
			return sendError(res, 403, 'Account deactivated');
		}

		const token = signToken(user);
		const userPayload = {
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			department: user.department,
		};

		return res.json({
			success: true,
			message: 'Login successful',
			token,
			user: userPayload,
			data: { token, user: userPayload },
		});
	} catch (err) {
		return sendError(res, 500, 'Server error');
	}
}

async function getMe(req, res) {
	return res.json({
		success: true,
		message: 'Profile loaded',
		data: { user: req.user },
	});
}

async function changePassword(req, res) {
	try {
		const { currentPassword, newPassword } = req.body;
		if (!currentPassword || !newPassword) {
			return sendError(res, 400, 'Current password and new password are required');
		}

		const user = await User.findById(req.user._id);
		if (!user) {
			return sendError(res, 404, 'User not found');
		}

		const ok = await comparePassword(currentPassword, user.password);
		if (!ok) {
			return sendError(res, 400, 'Current password is incorrect');
		}

		user.password = await hashPassword(newPassword);
		await user.save();

		return res.json({
			success: true,
			message: 'Password updated',
			data: {},
		});
	} catch (err) {
		return sendError(res, 500, 'Server error');
	}
}

module.exports = { registerCitizen, registerStaff, login, getMe, changePassword };
