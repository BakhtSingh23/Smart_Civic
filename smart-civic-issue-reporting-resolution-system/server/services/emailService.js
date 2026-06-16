// Central email sending utility used by controllers.

const { buildGmailTransporter } = require('../config/gmailSMTP');
const { welcomeMailTemplate } = require('../templates/welcomeMail');

function roleToLabel(role) {
	if (role === 'admin') return 'Central Admin';
	if (role === 'authority') return 'Department Officer';
	return 'Citizen/User';
}

async function sendWelcomeEmail({ toEmail, name, role }) {
	const transporter = buildGmailTransporter();
	if (!transporter) return { skipped: true, reason: 'EMAIL_USER/EMAIL_PASS not configured' };

	const { EMAIL_USER } = process.env;
	const { subject, html } = welcomeMailTemplate({ name, roleLabel: roleToLabel(role) });

	await transporter.sendMail({
		from: `Smart Civic <${EMAIL_USER}>`,
		to: toEmail,
		subject,
		html,
	});

	return { sent: true };
}

module.exports = { sendWelcomeEmail };
