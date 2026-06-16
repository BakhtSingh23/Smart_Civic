const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getProfile,
  getDashboard,
  submitComplaint,
  getMyComplaints,
  getComplaintDetail,
  getComplaintTimeline,
  getNotifications,
  markNotificationRead,
  markAllRead,
  submitFeedback,
  updateProfile,
  getUnreadNotificationCount,
} = require('../controllers/citizenController');
const { uploadMedia } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/complaints', protect, authorizeRoles('citizen'), uploadMedia, submitComplaint);
router.get('/complaints', protect, authorizeRoles('citizen'), getMyComplaints);
router.get('/complaints/:id', protect, authorizeRoles('citizen'), getComplaintDetail);
router.get('/complaints/:id/timeline', protect, authorizeRoles('citizen'), getComplaintTimeline);
router.get('/profile', protect, authorizeRoles('citizen'), getProfile);
router.get('/dashboard', protect, authorizeRoles('citizen'), getDashboard);
router.get('/notifications', protect, authorizeRoles('citizen'), getNotifications);
router.patch('/notifications/:id/read', protect, authorizeRoles('citizen'), markNotificationRead);
router.patch('/notifications/mark-all-read', protect, authorizeRoles('citizen'), markAllRead);
router.post('/complaints/:id/feedback', protect, authorizeRoles('citizen'), submitFeedback);
router.put('/profile', protect, authorizeRoles('citizen'), updateProfile);

// unread count (accessible by all authenticated roles)
router.get('/notifications/unread-count', protect, getUnreadNotificationCount);

module.exports = router;
