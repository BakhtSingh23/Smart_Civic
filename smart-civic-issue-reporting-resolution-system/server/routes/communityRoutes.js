const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAllThreads,
  getThread,
  getThreadReplies,
  createThread,
  replyToThread,
  upvoteThread,
  upvoteReply,
  deleteThread,
  deleteReply,
  pinThread,
  lockThread,
  markThreadResolved
} = require('../controllers/communityController');

// Public routes
router.get('/threads', getAllThreads);
router.get('/threads/:id', getThread);
router.get('/threads/:id/replies', getThreadReplies);

// Protected routes
router.post('/threads', protect, createThread);
router.post('/threads/:id/reply', protect, replyToThread);
router.patch('/threads/:id/upvote', protect, upvoteThread);
router.patch('/replies/:id/upvote', protect, upvoteReply);
router.delete('/threads/:id', protect, deleteThread);
router.delete('/replies/:id', protect, deleteReply);

// Admin / Author routes
router.patch('/threads/:id/pin', protect, authorizeRoles('admin'), pinThread);
router.patch('/threads/:id/lock', protect, authorizeRoles('admin'), lockThread);
router.patch('/threads/:id/resolve', protect, markThreadResolved);

module.exports = router;
