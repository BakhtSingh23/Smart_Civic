const axios = require('axios');
const Complaint = require('../models/Complaint');

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

// POST /api/chatbot/chat
exports.chat = async (req, res) => {
	try {
		const { message, senderId } = req.body;
		// senderId: use req.user.id so RASA maintains per-user session

		if (!message || !senderId) {
			return res.status(400).json({ success: false, message: 'message and senderId required' });
		}

		const rasaResponse = await axios.post(`${RASA_URL}/webhooks/rest/webhook`, {
			sender: String(senderId),
			message: message.trim(),
		});

		// RASA returns array of response objects: [{ text: '...' }, { text: '...' }]
		const replies = rasaResponse.data
			.filter((r) => r.text)
			.map((r) => r.text)
			.join('\n\n');

		return res.json({
			success: true,
			reply:
				replies ||
				"I'm not sure how to respond to that. Try asking about filing a complaint or checking status!",
		});
	} catch (error) {
		console.error('RASA chat error:', error.message);
		return res.status(500).json({
			success: false,
			reply: "I'm temporarily unavailable. Please try again in a moment.",
		});
	}
};

// GET /api/chatbot/complaint-status/:complaintId
// Called by RASA action server (actions.py) — no auth middleware, internal only
exports.getComplaintStatusForBot = async (req, res) => {
	try {
		const { complaintId } = req.params;

		const complaint = await Complaint.findOne({ complaintId: complaintId.toUpperCase() })
			.populate('incidentGroup', 'incidentId')
			.select(
				'complaintId title category status assignedDepartment isDuplicate createdAt incidentGroup'
			);

		if (!complaint) {
			return res.status(404).json({ success: false, message: 'Complaint not found' });
		}

		return res.json({
			success: true,
			complaint: {
				complaintId: complaint.complaintId,
				title: complaint.title,
				category: complaint.category,
				status: complaint.status,
				assignedDepartment: complaint.assignedDepartment,
				isDuplicate: complaint.isDuplicate,
				incidentGroupId: complaint.incidentGroup?.incidentId || null,
				createdAt: complaint.createdAt,
			},
		});
	} catch (error) {
		console.error('Bot status lookup error:', error.message);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

// POST /api/chatbot/detect-category (keyword + simple NLP via RASA)
exports.detectCategory = async (req, res) => {
	try {
		const { description } = req.body;
		if (!description)
			return res.status(400).json({ success: false, message: 'description required' });

		// Send to RASA NLU parse endpoint directly
		const rasaResponse = await axios.post(`${RASA_URL}/model/parse`, {
			text: description,
		});

		const intent = rasaResponse.data.intent?.name || 'report_complaint';
		const confidence = rasaResponse.data.intent?.confidence || 0;

		const intentToCategory = {
			report_road_issue: 'Roads',
			report_water_issue: 'Water',
			report_sanitation_issue: 'Sanitation',
			report_electricity_issue: 'Electricity',
			report_drainage_issue: 'Drainage',
		};

		const category = intentToCategory[intent] || 'Other';

		return res.json({
			success: true,
			category,
			confidence: Math.round(confidence * 100),
			intent,
			suggestedTitle: `${category} issue reported by citizen`,
		});
	} catch (error) {
		console.error('Category detection error:', error.message);
		return res.status(500).json({ success: false, message: 'Detection failed' });
	}
};

const User = require('../models/User')
const { sendComplaintSubmittedEmail } = require('../utils/emailService')

// POST /api/chatbot/submit-complaint
// Called by RASA action server — internal only
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
      source
    } = req.body

    // Validate citizen exists
    const citizen = await User.findById(citizenId)
    if (!citizen || citizen.role !== 'citizen') {
      return res.status(401).json({ success: false, message: 'Invalid citizen' })
    }

    // Generate complaint ID
    const { generateComplaintId } = require('../utils/autoIdGenerator')
    const complaintId = await generateComplaintId()

    // Build complaint — no GPS coordinates since filed via chat
    // We store address as text; coordinates default to [0,0] as placeholder
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
        coordinates: [0, 0],         // no GPS from chat — admin can update
        address: address || '',
        city: city || '',
        area: address || '',
        pincode: ''
      },
      media: [],
      aiGenerated: false,
      source: source || 'chatbot'    // add 'source' field to Complaint model
    })

    // Create admin notification
    const Notification = require('../models/Notification')
    const adminUser = await User.findOne({ role: 'admin' })
    if (adminUser) {
      await Notification.create({
        recipient: adminUser._id,
        type: 'complaint_submitted',
        title: 'New complaint via Chatbot',
        message: `${citizen.name} filed complaint ${complaintId} via chat assistant`,
        relatedComplaint: complaint._id
      })
    }

    // Send confirmation email to citizen
    try {
      await sendComplaintSubmittedEmail(citizen, complaint)
    } catch (emailErr) {
      console.error('Email send failed (non-fatal):', emailErr.message)
    }

    return res.status(201).json({
      success: true,
      complaintId: complaint.complaintId,
      message: 'Complaint submitted successfully'
    })

  } catch (error) {
    console.error('Chat complaint submit error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error during submission' })
  }
}
