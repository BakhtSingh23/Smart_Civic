const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getMe, listUsers } = require('../controllers/usersController');

const router = express.Router();

router.get('/me', protect, getMe);
router.get('/', protect, requireRole('admin', 'authority'), listUsers);

module.exports = router;
