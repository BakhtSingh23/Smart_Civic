const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const ctrl = require('../controllers/workerController');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('worker'));

router.get('/dashboard', ctrl.getWorkerDashboard);
router.get('/tasks', ctrl.getMyTasks);
router.get('/tasks/:id', ctrl.getTaskDetail);
router.patch('/tasks/:id/accept', ctrl.acceptTask);
router.patch('/tasks/:id/start', upload.array('beforeImages', 3), ctrl.startTask);
router.patch('/tasks/:id/complete', upload.array('afterImages', 5), ctrl.submitCompletion);
router.get('/tasks/:id/location', ctrl.getTaskLocation);

module.exports = router;
