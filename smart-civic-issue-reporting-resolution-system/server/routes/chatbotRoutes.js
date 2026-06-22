'use strict';

/**
 * chatbotRoutes.js
 *
 * All chatbot API routes — powered by Google Gemini AI.
 */

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  chat,
  getComplaintStatusForBot,
  detectCategory,
  submitComplaintFromChat,
} = require('../controllers/chatbotController');

// Main conversation endpoint — requires authenticated user for session management
router.post('/chat', protect, chat);

// Auto-detect category from description text (used by SubmitComplaint form)
router.post('/detect-category', protect, detectCategory);

// Complaint status lookup — public, used internally by chat controller
router.get('/complaint-status/:complaintId', getComplaintStatusForBot);

// Submit complaint from chat session
router.post('/submit-complaint', submitComplaintFromChat);

module.exports = router;
