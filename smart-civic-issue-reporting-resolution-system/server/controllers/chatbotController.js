'use strict';

/**
 * chatbotController.js
 *
 * Handles all chatbot API endpoints.
 * Previously powered by Rasa — now fully powered by Google Gemini AI.
 *
 * Routes:
 *  POST   /api/chatbot/chat               — Main conversation (auth required)
 *  POST   /api/chatbot/detect-category    — Category auto-detection (auth required)
 *  GET    /api/chatbot/complaint-status/:id — Complaint lookup (public, for internal use)
 *  POST   /api/chatbot/submit-complaint   — Submit complaint from chat (auth recommended)
 */

const Complaint   = require('../models/Complaint');
const User        = require('../models/User');
const Notification = require('../models/Notification');
const { generateComplaintId } = require('../utils/autoIdGenerator');
const { sendComplaintSubmittedEmail } = require('../utils/emailService');
const {
  sendChatMessage,
  detectCategoryFromDescription,
} = require('../services/geminiService');

// ─── POST /api/chatbot/chat ───────────────────────────────────────────────────

/**
 * Main conversational endpoint.
 * Sends the user message to Gemini, maintains session context,
 * and optionally executes backend actions (complaint submission, status check)
 * when Gemini signals them via embedded ACTION tokens.
 */
exports.chat = async (req, res) => {
  try {
    const { message, senderId } = req.body;

    if (!message || !senderId) {
      return res.status(400).json({
        success: false,
        message: 'message and senderId are required',
      });
    }

    const trimmedMessage = String(message).trim();
    if (!trimmedMessage) {
      return res.status(400).json({ success: false, message: 'message cannot be empty' });
    }

    // ── Call Gemini ─────────────────────────────────────────────────────────
    const { reply: geminiReply, action } = await sendChatMessage(trimmedMessage, String(senderId));

    // ── Handle embedded backend actions ─────────────────────────────────────
    let finalReply = geminiReply;
    let actionResult = null;

    if (action) {
      if (action.type === 'CHECK_STATUS') {
        // Gemini detected a complaint tracking intent — fetch from DB
        actionResult = await handleComplaintStatusLookup(action.complaintId);
        finalReply = buildStatusReply(action.complaintId, actionResult);
      } else if (action.type === 'SUBMIT_COMPLAINT') {
        // Gemini collected all required complaint fields — submit to DB
        const citizenId = req.user?._id || req.user?.id;
        if (citizenId) {
          actionResult = await handleComplaintSubmission(citizenId, action.payload);
          finalReply = buildSubmissionReply(actionResult);
        } else {
          finalReply = "⚠️ I couldn't submit your complaint — please make sure you're logged in.";
        }
      }
    }

    return res.json({ success: true, reply: finalReply });

  } catch (error) {
    console.error('[ChatbotController] chat error:', error.message);
    return res.status(500).json({
      success: false,
      reply: "⚠️ I'm temporarily unavailable. Please try again in a moment.",
    });
  }
};

// ─── POST /api/chatbot/detect-category ────────────────────────────────────────

/**
 * Smart category detection from a plain-text issue description.
 * Used by SubmitComplaint.jsx for the "Auto-detect Category" button.
 *
 * Returns the same JSON shape as the previous Rasa /model/parse endpoint
 * so the frontend requires zero changes.
 */
exports.detectCategory = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'description is required and must be at least 5 characters',
      });
    }

    const result = await detectCategoryFromDescription(description);

    return res.json({
      success: true,
      category:       result.category,
      department:     result.department,
      confidence:     result.confidence,
      intent:         result.intent,
      suggestedTitle: result.suggestedTitle,
    });

  } catch (error) {
    console.error('[ChatbotController] detectCategory error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Category detection failed. Please try again.',
    });
  }
};

// ─── GET /api/chatbot/complaint-status/:complaintId ───────────────────────────

/**
 * Retrieves complaint status from the database.
 * No auth required — used internally by the chat controller
 * and directly accessible for quick lookups.
 */
exports.getComplaintStatusForBot = async (req, res) => {
  try {
    const { complaintId } = req.params;

    if (!complaintId) {
      return res.status(400).json({ success: false, message: 'complaintId is required' });
    }

    const complaint = await Complaint.findOne({ complaintId: complaintId.toUpperCase() })
      .populate('incidentGroup', 'incidentId')
      .select('complaintId title category status assignedDepartment isDuplicate createdAt incidentGroup');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.json({
      success: true,
      complaint: {
        complaintId:      complaint.complaintId,
        title:            complaint.title,
        category:         complaint.category,
        status:           complaint.status,
        assignedDepartment: complaint.assignedDepartment,
        isDuplicate:      complaint.isDuplicate,
        incidentGroupId:  complaint.incidentGroup?.incidentId || null,
        createdAt:        complaint.createdAt,
      },
    });

  } catch (error) {
    console.error('[ChatbotController] complaint status lookup error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during status lookup' });
  }
};

// ─── POST /api/chatbot/submit-complaint ───────────────────────────────────────

/**
 * Creates a complaint submitted through the chatbot conversation.
 * Sends email confirmation and creates admin notification.
 */
exports.submitComplaintFromChat = async (req, res) => {
  try {
    const {
      citizenId,
      title,
      description,
      category,
      address,
      city,
      priority,
      source,
    } = req.body;

    // Validate citizen
    const citizen = await User.findById(citizenId);
    if (!citizen || citizen.role !== 'citizen') {
      return res.status(401).json({ success: false, message: 'Invalid citizen' });
    }

    const complaintId = await generateComplaintId();

    // Create complaint — no GPS coordinates from chat, coordinates default to [0,0]
    const complaint = await Complaint.create({
      complaintId,
      citizen: citizenId,
      title: title || `${category} issue reported via chatbot`,
      description,
      category,
      priority: priority || 'medium',
      status: 'pending',
      location: {
        type: 'Point',
        coordinates: [0, 0],
        address: address || '',
        city: city || '',
        area: address || '',
        pincode: '',
      },
      media: [],
      aiGenerated: false,
      source: source || 'chatbot',
    });

    // Admin notification
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      await Notification.create({
        recipient: adminUser._id,
        type: 'complaint_submitted',
        title: 'New complaint via Chatbot',
        message: `${citizen.name} filed complaint ${complaintId} via chat assistant`,
        relatedComplaint: complaint._id,
      });
    }

    // Email confirmation (non-fatal)
    try {
      await sendComplaintSubmittedEmail(citizen, complaint);
    } catch (emailErr) {
      console.error('[ChatbotController] Email send failed (non-fatal):', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      complaintId: complaint.complaintId,
      message: 'Complaint submitted successfully',
    });

  } catch (error) {
    console.error('[ChatbotController] chat complaint submit error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during submission' });
  }
};

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Fetches complaint data from the database for status lookup.
 */
async function handleComplaintStatusLookup(complaintId) {
  try {
    const complaint = await Complaint.findOne({ complaintId: complaintId.toUpperCase() })
      .populate('incidentGroup', 'incidentId')
      .select('complaintId title category status assignedDepartment isDuplicate createdAt incidentGroup');
    return complaint || null;
  } catch (err) {
    console.error('[ChatbotController] DB status lookup error:', err.message);
    return null;
  }
}

/**
 * Builds a human-friendly status reply message from a Complaint document.
 */
function buildStatusReply(complaintId, complaint) {
  if (!complaint) {
    return (
      `❌ I couldn't find a complaint with ID **${complaintId}**.\n\n` +
      `Please double-check the format: **CMP-2026-0042**\n\n` +
      `You can find your complaint IDs in:\n` +
      `• Your registration email\n` +
      `• **My Complaints** page in your dashboard`
    );
  }

  const statusEmoji = {
    pending:     '🕐',
    verified:    '✅',
    rejected:    '❌',
    assigned:    '📋',
    in_progress: '🔧',
    completed:   '🎉',
    closed:      '🔒',
  }[complaint.status] || '📍';

  const date = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Unknown';

  let reply = `📍 **Complaint Status Update**\n`;
  reply += `─────────────────────────\n`;
  reply += `🆔 **ID:** ${complaint.complaintId}\n`;
  reply += `📝 **Title:** ${complaint.title}\n`;
  reply += `📂 **Category:** ${complaint.category}\n`;
  if (complaint.assignedDepartment) {
    reply += `🏢 **Department:** ${complaint.assignedDepartment}\n`;
  }
  reply += `${statusEmoji} **Status:** ${complaint.status.replace(/_/g, ' ').toUpperCase()}\n`;
  reply += `📅 **Filed on:** ${date}\n`;

  if (complaint.isDuplicate && complaint.incidentGroup?.incidentId) {
    reply += `\n🔗 This complaint has been grouped with similar reports (Incident: ${complaint.incidentGroup.incidentId})`;
  }

  reply += `\n\nFor full details, visit **My Complaints** in your dashboard.`;
  return reply;
}

/**
 * Handles internal complaint submission triggered by Gemini's ACTION signal.
 */
async function handleComplaintSubmission(citizenId, payload) {
  try {
    const citizen = await User.findById(citizenId);
    if (!citizen || citizen.role !== 'citizen') return null;

    const complaintId = await generateComplaintId();
    const { category, description, address, city, priority } = payload;

    const validCategories = ['Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'Street Lights', 'Public Health', 'Parks', 'Other'];
    const safeCategory = validCategories.includes(category) ? category : 'Other';

    const complaint = await Complaint.create({
      complaintId,
      citizen: citizenId,
      title: `${safeCategory} issue reported via chatbot`,
      description: description || 'Reported via chat assistant',
      category: safeCategory,
      priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
      status: 'pending',
      location: {
        type: 'Point',
        coordinates: [0, 0],
        address: address || '',
        city: city || '',
        area: address || '',
        pincode: '',
      },
      media: [],
      source: 'chatbot',
    });

    // Admin notification
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      await Notification.create({
        recipient: adminUser._id,
        type: 'complaint_submitted',
        title: 'New complaint via Chatbot',
        message: `${citizen.name} filed complaint ${complaintId} via AI chat assistant`,
        relatedComplaint: complaint._id,
      });
    }

    // Email (non-fatal)
    try {
      await sendComplaintSubmittedEmail(citizen, complaint);
    } catch (e) {
      console.error('[ChatbotController] Email send failed (non-fatal):', e.message);
    }

    return { complaintId: complaint.complaintId, category: safeCategory };

  } catch (err) {
    console.error('[ChatbotController] Inline complaint submission error:', err.message);
    return null;
  }
}

/**
 * Builds a human-friendly reply after a chat-submitted complaint.
 */
function buildSubmissionReply(result) {
  if (!result) {
    return (
      '⚠️ Something went wrong while submitting your complaint.\n\n' +
      'Please try again or use the **Report Issue** form in your dashboard.\n' +
      'Your issue details have been noted — don\'t worry!'
    );
  }
  return (
    `🎉 **Complaint Submitted Successfully!**\n\n` +
    `🆔 **Your Complaint ID:** \`${result.complaintId}\`\n` +
    `📂 **Category:** ${result.category}\n\n` +
    `✅ You'll receive an email confirmation shortly.\n` +
    `📊 Track your complaint anytime in **My Complaints** → "View Details".\n\n` +
    `Is there anything else I can help you with?`
  );
}
