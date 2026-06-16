const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { listMyNotifications, markRead, getUnreadCount } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, listMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/:id/read', protect, markRead);

module.exports = router;
