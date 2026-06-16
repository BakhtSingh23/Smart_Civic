const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/officerController');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('officer'));

router.get('/dashboard', ctrl.getOfficerDashboardStats);
router.get('/complaints', ctrl.getAssignedComplaints);
router.get('/complaints/:id', ctrl.getComplaintDetail);
router.post('/complaints/:complaintId/assign-worker', ctrl.assignWorker);
router.patch('/tasks/:id/reassign', ctrl.reassignWorker);
router.patch('/tasks/:id/verify', ctrl.verifyWorkerCompletion);
router.get('/workers', ctrl.getDepartmentWorkers);
router.get('/tasks', ctrl.getWorkerTaskHistory);

module.exports = router;
