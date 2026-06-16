const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const { registerStaff } = require('../controllers/authController');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/complaints', adminController.getAllComplaints);
router.get('/complaints/:id', adminController.getComplaintDetail);
router.patch('/complaints/:id/verify', adminController.verifyComplaint);
router.patch('/complaints/:id/assign', adminController.assignDepartment);
router.patch('/complaints/:id/close', adminController.closeComplaint);
router.get('/officers/by-department', adminController.getOfficersByDepartment);
router.get('/officers', adminController.getAllOfficers);
router.get('/workers', adminController.getAllWorkers);
router.post('/staff', registerStaff);
router.patch('/users/:id/toggle-active', adminController.toggleUserActive);

// Duplicate Detection & Incident Groups
router.get('/complaints/:id/check-duplicates', adminController.checkDuplicates);

// ML Forecasting Data Generation
router.post('/generate-training-data', adminController.generateTrainingData);
router.post('/incidents/merge', adminController.mergeDuplicates);
router.post('/incidents/:id/unmerge', adminController.unmergeComplaint);
router.get('/incidents', adminController.getIncidentGroups);
router.get('/incidents/:id', adminController.getIncidentGroupDetail);

module.exports = router;
