'use strict';

const nodemailer = require('nodemailer');

// ─── Transporter ────────────────────────────────────────────────────────────
// Use explicit SMTP settings instead of the 'service' shorthand.
// Gmail's shorthand works locally but production servers get flagged by Google
// because of unfamiliar IPs and stricter security policies.

let transporter = null;

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: (process.env.EMAIL_SECURE ?? 'true') === 'true', // true for 465, false for 587
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      // Some cloud providers (Render, Railway) use proxies that can cause
      // certificate verification failures — allow self-signed in production.
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,  // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  // Verify SMTP connection on startup (non-blocking — never prevents server start)
  transporter.verify()
    .then(() => console.log('[EMAIL] ✅ SMTP connection verified successfully'))
    .catch((err) => console.warn('[EMAIL] ⚠️  SMTP verification failed — emails may not send:', err.message));
} else {
  console.warn('[EMAIL] ⚠️  EMAIL_USER or EMAIL_PASS not set — email sending is disabled');
}

// ─── Core send (with retry) ─────────────────────────────────────────────────
async function sendEmail(to, subject, html, retries = 1) {
  if (!transporter) {
    console.warn(`[EMAIL] ⏭️  Skipped "${subject}" to ${to} — no transporter configured`);
    return;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'SmartCivic <no-reply@smartcivic.com>',
        to,
        subject,
        html,
      });
      console.log(`[EMAIL] ✅ Sent "${subject}" to ${to} — ID: ${info.messageId}`);
      return; // Success — exit
    } catch (err) {
      console.error(`[EMAIL] ❌ Attempt ${attempt + 1}/${retries + 1} failed for "${subject}" to ${to}:`, err.message);

      if (attempt < retries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
  // All retries exhausted — log but never throw (email failure must not break API)
}

// ─── Base Template ───────────────────────────────────────────────────────────
function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SmartCivic</title>
  <style>
    body { margin:0; padding:0; background:#f0f4f8; font-family:'Segoe UI',Arial,sans-serif; }
    .wrapper { max-width:600px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.10); }
    .header { background:linear-gradient(135deg,#1d4ed8,#3b82f6); padding:32px 40px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:26px; letter-spacing:1px; }
    .header p  { color:#bfdbfe; margin:6px 0 0; font-size:13px; }
    .body { padding:36px 40px; }
    .body p  { color:#374151; font-size:15px; line-height:1.7; margin:0 0 16px; }
    .body h2 { color:#1e3a8a; font-size:20px; margin:0 0 20px; }
    .info-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:18px 22px; margin:20px 0; }
    .info-card p { margin:6px 0; font-size:14px; color:#475569; }
    .info-card strong { color:#1e293b; }
    .btn { display:inline-block; margin:20px 0; padding:13px 32px; background:#2563eb; color:#fff !important; border-radius:8px; text-decoration:none; font-weight:700; font-size:15px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
    .badge-blue   { background:#dbeafe; color:#1d4ed8; }
    .badge-green  { background:#dcfce7; color:#15803d; }
    .badge-red    { background:#fee2e2; color:#dc2626; }
    .badge-amber  { background:#fef3c7; color:#b45309; }
    .divider { border:none; border-top:1px solid #e2e8f0; margin:28px 0; }
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 40px; text-align:center; }
    .footer p { color:#94a3b8; font-size:12px; margin:4px 0; }
    @media (max-width:640px) { .body,.header,.footer { padding:20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏙️ SmartCivic</h1>
      <p>Municipal Issue Reporting &amp; Resolution Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p><strong>SmartCivic Municipal Platform</strong></p>
      <p>Do not reply to this email — this is an automated notification.</p>
      <p style="color:#cbd5e1">© ${new Date().getFullYear()} SmartCivic. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Template helpers ─────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// ═════════════════════════════════════════════════════════════════════════════
// Email functions
// ═════════════════════════════════════════════════════════════════════════════

// 1. Registration welcome
async function sendRegistrationEmail(user) {
  const html = baseTemplate(`
    <h2>Welcome to SmartCivic, ${user.name}! 🎉</h2>
    <p>Thank you for joining <strong>SmartCivic</strong> — your direct link to municipal services. You can now report civic issues and track their resolution in real time.</p>
    <div class="info-card">
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Account Type:</strong> <span class="badge badge-blue">${capitalize(user.role)}</span></p>
    </div>
    <p>Get started by reporting your first issue — your voice matters to us.</p>
    <a href="${process.env.CLIENT_URL}/login" class="btn">Login to SmartCivic</a>
  `);
  await sendEmail(user.email, `Welcome to SmartCivic, ${user.name}!`, html);
}

// 2. Complaint submitted
async function sendComplaintSubmittedEmail(citizen, complaint) {
  const html = baseTemplate(`
    <h2>Complaint Received ✅</h2>
    <p>Hi ${citizen.name}, we have received your complaint and it is now under review by our team.</p>
    <div class="info-card">
      <p><strong>Complaint ID:</strong> <span class="badge badge-blue">${complaint.complaintId}</span></p>
      <p><strong>Title:</strong> ${complaint.title}</p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>Submitted:</strong> ${fmt(complaint.createdAt)}</p>
      <p><strong>Status:</strong> <span class="badge badge-amber">Pending Review</span></p>
    </div>
    <p>Our team will review your complaint within <strong>24 hours</strong>. You will receive an email once it is verified or if additional information is required.</p>
    <a href="${process.env.CLIENT_URL}/citizen/complaints" class="btn">Track Your Complaint</a>
  `);
  await sendEmail(citizen.email, `Complaint Received — ${complaint.complaintId}`, html);
}

// 3. Complaint verified
async function sendComplaintVerifiedEmail(citizen, complaint) {
  const html = baseTemplate(`
    <h2>Your Complaint is Verified ✅</h2>
    <p>Hi ${citizen.name}, great news! Your complaint <strong>${complaint.complaintId}</strong> has been verified by our admin team.</p>
    <div class="info-card">
      <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
      <p><strong>Title:</strong> ${complaint.title}</p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>Status:</strong> <span class="badge badge-green">Verified</span></p>
    </div>
    <p><strong>What happens next?</strong></p>
    <p>Your complaint will be assigned to the relevant department, who will then deploy field workers to address the issue. You will be notified at every step.</p>
    <a href="${process.env.CLIENT_URL}/citizen/complaints" class="btn">View Complaint Status</a>
  `);
  await sendEmail(citizen.email, `Your Complaint ${complaint.complaintId} is Verified ✅`, html);
}

// 4. Complaint rejected
async function sendComplaintRejectedEmail(citizen, complaint, reason) {
  const html = baseTemplate(`
    <h2>Update on Your Complaint</h2>
    <p>Hi ${citizen.name}, we regret to inform you that your complaint <strong>${complaint.complaintId}</strong> could not be processed at this time.</p>
    <div class="info-card">
      <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
      <p><strong>Title:</strong> ${complaint.title}</p>
      <p><strong>Status:</strong> <span class="badge badge-red">Rejected</span></p>
      <p><strong>Reason:</strong> ${reason || 'Insufficient information provided.'}</p>
    </div>
    <p>You are welcome to <strong>resubmit your complaint</strong> with more details, clearer photos, or a precise location. Our team is here to help resolve genuine civic issues.</p>
    <a href="${process.env.CLIENT_URL}/citizen/submit" class="btn">Submit New Complaint</a>
  `);
  await sendEmail(citizen.email, `Update on Your Complaint ${complaint.complaintId}`, html);
}

// 5. Duplicate linked
async function sendDuplicateLinkedEmail(citizen, complaint, incidentGroup) {
  const total = incidentGroup.totalReporters || '(multiple)';
  const html = baseTemplate(`
    <h2>Your Complaint is Part of a Group Incident 👥</h2>
    <p>Hi ${citizen.name}, good news — you're not alone! <strong>${total} citizens</strong> have reported the same civic issue in your area.</p>
    <div class="info-card">
      <p><strong>Your Complaint ID:</strong> ${complaint.complaintId}</p>
      <p><strong>Incident Group ID:</strong> <span class="badge badge-blue">${incidentGroup.incidentId}</span></p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>Total Reporters:</strong> ${total}</p>
    </div>
    <p>We have grouped all related complaints into one incident. This <strong>increases priority</strong> and ensures all reporters — including you — are updated simultaneously as work progresses.</p>
    <p>You will receive notifications as the incident moves through verification, assignment, and resolution.</p>
    <a href="${process.env.CLIENT_URL}/citizen/complaints" class="btn">Track Incident Progress</a>
  `);
  await sendEmail(citizen.email, `Your Complaint is Part of a Group Incident 👥`, html);
}

// 6. Department assigned (citizen)
async function sendDepartmentAssignedEmail(citizen, complaint, department) {
  const html = baseTemplate(`
    <h2>Action Taken — ${department} Department Assigned ⚙️</h2>
    <p>Hi ${citizen.name}, your complaint has been assigned to the <strong>${department} Department</strong> for resolution.</p>
    <div class="info-card">
      <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
      <p><strong>Title:</strong> ${complaint.title}</p>
      <p><strong>Assigned Department:</strong> <span class="badge badge-blue">${department}</span></p>
      <p><strong>Status:</strong> <span class="badge badge-amber">Assigned</span></p>
    </div>
    <p>The department will deploy a field officer and workers to your location. You will be notified when work begins.</p>
    <a href="${process.env.CLIENT_URL}/citizen/complaints" class="btn">View Status</a>
  `);
  await sendEmail(citizen.email, `Action Taken — ${department} Department Assigned`, html);
}

// 7. Officer assigned (officer)
async function sendOfficerAssignedEmail(officer, complaint) {
  const html = baseTemplate(`
    <h2>New Complaint Assigned to You</h2>
    <p>Hi ${officer.name}, a new complaint has been assigned to you for resolution.</p>
    <div class="info-card">
      <p><strong>Complaint ID:</strong> <span class="badge badge-blue">${complaint.complaintId}</span></p>
      <p><strong>Title:</strong> ${complaint.title}</p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>Priority:</strong> <span class="badge badge-amber">${capitalize(complaint.priority)}</span></p>
      <p><strong>Location:</strong> ${complaint.location?.address || 'See portal for details'}</p>
      <p><strong>Submitted:</strong> ${fmt(complaint.createdAt)}</p>
    </div>
    <p>Please log in to <strong>SmartCivic</strong> to review the complaint details and assign field workers promptly.</p>
    <a href="${process.env.CLIENT_URL}/officer/complaints" class="btn">Open in Officer Portal</a>
  `);
  await sendEmail(officer.email, `New Complaint Assigned to You — ${complaint.complaintId}`, html);
}

// 8. Worker task assigned
async function sendWorkerTaskEmail(worker, task, complaint) {
  const html = baseTemplate(`
    <h2>New Field Task Assigned to You 🔧</h2>
    <p>Hi ${worker.name}, you have been assigned a new field task. Please accept and start work at your earliest convenience.</p>
    <div class="info-card">
      <p><strong>Task ID:</strong> <span class="badge badge-blue">${task.taskId}</span></p>
      <p><strong>Complaint:</strong> ${complaint.complaintId} — ${complaint.title}</p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>Priority:</strong> <span class="badge badge-amber">${capitalize(complaint.priority)}</span></p>
      <p><strong>Location:</strong> ${complaint.location?.address || 'See portal for map'}</p>
      ${task.instructions ? `<p><strong>Officer Instructions:</strong> ${task.instructions}</p>` : ''}
    </div>
    <p>Log in to SmartCivic to accept this task, view the map, upload before/after photos, and mark completion.</p>
    <a href="${process.env.CLIENT_URL}/worker/tasks/${task._id}" class="btn">Open Task in Portal</a>
  `);
  await sendEmail(worker.email, `New Field Task Assigned — ${task.taskId}`, html);
}

// 9. Work started (citizen)
async function sendWorkStartedEmail(citizen, complaint) {
  const html = baseTemplate(`
    <h2>Work Has Started on Your Complaint ⚙️</h2>
    <p>Hi ${citizen.name}, great news! Our field team has <strong>started working</strong> on the issue you reported.</p>
    <div class="info-card">
      <p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
      <p><strong>Issue:</strong> ${complaint.title}</p>
      <p><strong>Location:</strong> ${complaint.location?.address || 'On-site'}</p>
      <p><strong>Status:</strong> <span class="badge badge-blue">In Progress</span></p>
    </div>
    <p>Our team is actively working to resolve this issue. Depending on the complexity, field work typically takes <strong>1–3 business days</strong>. You will be notified once the work is verified and completed.</p>
    <a href="${process.env.CLIENT_URL}/citizen/complaints" class="btn">Track Progress</a>
  `);
  await sendEmail(citizen.email, `Work Started on Your Complaint ⚙️`, html);
}

// 10. Complaint resolved
async function sendComplaintResolvedEmail(citizen, complaint) {
  const html = baseTemplate(`
    <h2>Issue Resolved! ✅</h2>
    <p>Hi ${citizen.name}, we're happy to confirm that the issue you reported has been <strong>resolved</strong> by our team.</p>
    <div class="info-card">
      <p><strong>Complaint ID:</strong> <span class="badge badge-green">${complaint.complaintId}</span></p>
      <p><strong>Issue:</strong> ${complaint.title}</p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>Resolved On:</strong> ${fmt(new Date())}</p>
    </div>
    <p>We hope the resolution meets your expectations. Your feedback helps us improve municipal services for everyone.</p>
    <a href="${process.env.CLIENT_URL}/citizen/complaints" class="btn">View Resolution Details</a>
  `);
  await sendEmail(citizen.email, `Issue Resolved! ✅ — ${complaint.complaintId}`, html);
}

// 11. Feedback request
async function sendFeedbackRequestEmail(citizen, complaint) {
  const html = baseTemplate(`
    <h2>How Did We Do? ⭐</h2>
    <p>Hi ${citizen.name}, your complaint <strong>${complaint.complaintId}</strong> has been resolved. We'd love to hear how we did!</p>
    <div class="info-card">
      <p><strong>Complaint:</strong> ${complaint.title}</p>
      <p><strong>Resolved On:</strong> ${fmt(new Date())}</p>
    </div>
    <p>Your feedback takes less than a minute and directly helps us improve the quality and speed of our services.</p>
    <a href="${process.env.CLIENT_URL}/citizen/complaints/${complaint._id}" class="btn">⭐ Give Feedback</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">You received this because your issue was recently resolved. You only need to rate once per complaint.</p>
  `);
  await sendEmail(citizen.email, `How Did We Do? Rate Your Experience ⭐`, html);
}

// 12. Automated assignment notification (officer)
async function sendAutomationAssignmentEmail(officer, complaint, priority) {
  const priorityColors = {
    urgent: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
    high: { bg: '#fef3c7', color: '#b45309', label: 'High' },
    medium: { bg: '#dbeafe', color: '#1d4ed8', label: 'Medium' },
    low: { bg: '#dcfce7', color: '#15803d', label: 'Low' },
  };
  const p = priorityColors[priority] || priorityColors.medium;

  const html = baseTemplate(`
    <h2>🤖 Automated Complaint Assignment</h2>
    <p>Hi ${officer.name}, a complaint has been <strong>automatically assigned</strong> to you by the SmartCivic Automation Engine.</p>
    <div class="info-card">
      <p><strong>Complaint ID:</strong> <span class="badge badge-blue">${complaint.complaintId}</span></p>
      <p><strong>Title:</strong> ${complaint.title}</p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>Priority:</strong> <span class="badge" style="background:${p.bg};color:${p.color}">${p.label}</span></p>
      <p><strong>Location:</strong> ${complaint.location?.address || 'See portal for details'}</p>
      <p><strong>Assignment Time:</strong> ${fmt(new Date())}</p>
      <p><strong>Submitted:</strong> ${fmt(complaint.createdAt)}</p>
    </div>
    <p>This assignment was made automatically based on <strong>workload balancing</strong> — you currently have the lightest caseload in your department.</p>
    <p>Please log in to <strong>SmartCivic</strong> to review the complaint and assign field workers.</p>
    <a href="${process.env.CLIENT_URL}/officer/complaints" class="btn">Open in Officer Portal</a>
  `);
  await sendEmail(officer.email, `🤖 Automated Assignment — ${complaint.complaintId}`, html);
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  sendRegistrationEmail,
  sendComplaintSubmittedEmail,
  sendComplaintVerifiedEmail,
  sendComplaintRejectedEmail,
  sendDuplicateLinkedEmail,
  sendDepartmentAssignedEmail,
  sendOfficerAssignedEmail,
  sendWorkerTaskEmail,
  sendWorkStartedEmail,
  sendComplaintResolvedEmail,
  sendFeedbackRequestEmail,
  sendAutomationAssignmentEmail,
};
