const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  createComplaint,
  listComplaints,
  assignDepartment,
  assignWorker,
  markInProgress,
  completeWork,
  closeTicket,
  listRecurrent,
} = require('../controllers/complaintsController');

const router = express.Router();

// Citizen: submit complaint (optional before image)
router.post(
  '/',
  protect,
  requireRole('citizen'),
  (req, _res, next) => {
    req.uploadFolder = 'before_issue_images';
    next();
  },
  upload.single('image'),
  createComplaint
);

router.get('/', protect, listComplaints);
router.get('/recurrent', protect, requireRole('admin', 'authority'), listRecurrent);

// Admin: assign department/authority
router.patch('/:id/assign-department', protect, requireRole('admin'), assignDepartment);

// Authority: assign worker
router.patch('/:id/assign-worker', protect, requireRole('authority', 'admin'), assignWorker);

// Worker: mark in-progress
router.patch('/:id/in-progress', protect, requireRole('worker'), markInProgress);

// Worker: complete work with completion image + note
router.patch(
  '/:id/complete',
  protect,
  requireRole('worker'),
  (req, _res, next) => {
    req.uploadFolder = 'completion_images';
    next();
  },
  upload.single('image'),
  completeWork
);

// Admin: close ticket
router.patch('/:id/close', protect, requireRole('admin'), closeTicket);

module.exports = router;
