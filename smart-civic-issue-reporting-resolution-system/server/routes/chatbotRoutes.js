const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
	chat,
	getComplaintStatusForBot,
	detectCategory,
	submitComplaintFromChat,
} = require('../controllers/chatbotController');

router.post('/chat', protect, chat);
router.post('/detect-category', protect, detectCategory);
// Internal route for RASA action server — no user auth, but restrict to localhost in production
router.get('/complaint-status/:complaintId', getComplaintStatusForBot);
router.post('/submit-complaint', submitComplaintFromChat);

module.exports = router;
