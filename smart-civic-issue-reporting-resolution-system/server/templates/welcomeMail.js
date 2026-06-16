// Simple, professional HTML welcome email template.

function welcomeMailTemplate({ name, roleLabel }) {
	const safeName = String(name || 'there');
	return {
		subject: 'Welcome to Smart Civic',
		html: `
			<div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6; color:#0b1220;">
				<div style="max-width:640px; margin:0 auto; padding:24px;">
					<div style="background:#0f1b33; color:#ffffff; padding:18px 20px; border-radius:12px;">
						<h2 style="margin:0; font-weight:700;">Smart Civic</h2>
						<p style="margin:6px 0 0; opacity:0.9;">Issue Reporting & Resolution System</p>
					</div>

					<div style="margin-top:16px; background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-radius:12px; padding:18px 20px;">
						<p style="margin:0 0 10px;">Hi <b>${safeName}</b>,</p>
						<p style="margin:0 0 10px;">
							Welcome to <b>Smart Civic</b>. Your account has been created successfully.
						</p>
						<p style="margin:0 0 10px;">
							Role: <b>${roleLabel}</b>
						</p>
						<p style="margin:0; color:#374151;">
							You can now sign in and start using the platform. If you did not create this account, please ignore this email.
						</p>
					</div>

					<p style="margin:14px 4px 0; font-size:12px; color:#6b7280;">
						This is an automated email. Please do not reply.
					</p>
				</div>
			</div>
		`,
	};
}

module.exports = { welcomeMailTemplate };
