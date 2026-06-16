// Gmail SMTP transporter for Nodemailer.
// NOTE: For Gmail you typically need an App Password (recommended) instead of your normal password.

const nodemailer = require('nodemailer');

function buildGmailTransporter() {
	const { EMAIL_USER, EMAIL_PASS } = process.env;
	if (!EMAIL_USER || !EMAIL_PASS) return null;

	return nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: EMAIL_USER,
			pass: EMAIL_PASS,
		},
	});
}

module.exports = { buildGmailTransporter };
