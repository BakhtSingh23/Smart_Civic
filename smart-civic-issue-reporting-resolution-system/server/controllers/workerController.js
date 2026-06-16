const WorkerTask = require('../models/WorkerTask');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const IncidentGroup = require('../models/IncidentGroup');
const User = require('../models/User');
const path = require('path');
const { sendWorkStartedEmail } = require('../utils/emailService');

// Helper: build public URL from file path
const toUrl = (filePath) => {
  if (!filePath) return null;
  const rel = filePath.replace(/\\/g, '/').split('uploads/')[1];
  return rel ? `/uploads/${rel}` : filePath;
};

// Helper: create notification
const notify = (recipient, type, title, message, relatedComplaint = null, relatedTask = null) =>
  Notification.create({ recipient, type, title, message, relatedComplaint, relatedTask });

// ────────────────────────────────────────────────────────────────────────────
// 1. getWorkerDashboard
// ────────────────────────────────────────────────────────────────────────────
exports.getWorkerDashboard = async (req, res) => {
  try {
    const workerId = req.user.id;

    const pendingTasks = await WorkerTask.find({
      assignedWorker: workerId,
      status: 'assigned',
    })
      .populate('complaint', 'title category location priority')
      .populate('assignedBy', 'name phone')
      .sort({ createdAt: -1 });

    const activeTask = await WorkerTask.findOne({
      assignedWorker: workerId,
      status: 'in_progress',
    })
      .populate({
        path: 'complaint',
        populate: { path: 'citizen', select: 'name' },
      })
      .populate('assignedBy', 'name phone department');

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const completedThisWeek = await WorkerTask.countDocuments({
      assignedWorker: workerId,
      status: { $in: ['completed', 'verified'] },
      workerCompletedAt: { $gte: startOfWeek },
    });

    const totalCompleted = await WorkerTask.countDocuments({
      assignedWorker: workerId,
      status: { $in: ['completed', 'verified'] },
    });

    res.json({
      success: true,
      data: {
        pendingTasks,
        activeTask,
        pendingCount: pendingTasks.length,
        completedThisWeek,
        totalCompleted,
      },
    });
  } catch (err) {
    console.error('getWorkerDashboard:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 2. getMyTasks
// ────────────────────────────────────────────────────────────────────────────
exports.getMyTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { assignedWorker: req.user.id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      WorkerTask.find(query)
        .populate('complaint', 'title category location description media priority createdAt')
        .populate('assignedBy', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WorkerTask.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 3. getTaskDetail
// ────────────────────────────────────────────────────────────────────────────
exports.getTaskDetail = async (req, res) => {
  try {
    const task = await WorkerTask.findById(req.params.id)
      .populate({
        path: 'complaint',
        populate: { path: 'citizen', select: 'name email phone' },
      })
      .populate('assignedBy', 'name phone email department');

    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });

    if (String(task.assignedWorker) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, data: { task } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 4. acceptTask
// ────────────────────────────────────────────────────────────────────────────
exports.acceptTask = async (req, res) => {
  try {
    const task = await WorkerTask.findById(req.params.id).populate('complaint', 'title');
    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });
    if (String(task.assignedWorker) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    task.status = 'accepted';
    await task.save();

    await notify(
      task.assignedBy,
      'general',
      'Worker Accepted Task',
      `${req.user.name} has accepted the task for: ${task.complaint?.title}`,
      task.complaint?._id,
      task._id
    );

    res.json({ success: true, data: { task } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 5. startTask
// ────────────────────────────────────────────────────────────────────────────
exports.startTask = async (req, res) => {
  try {
    const task = await WorkerTask.findById(req.params.id).populate({
      path: 'complaint',
      populate: { path: 'incidentGroup', populate: { path: 'linkedComplaints' } },
    });

    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });
    if (String(task.assignedWorker) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'Access denied' });
    if (!['assigned', 'accepted'].includes(task.status))
      return res.status(400).json({ success: false, message: 'Task is not in a startable state' });

    const beforeImageUrls = req.files?.map((f) => toUrl(f.path)) || [];

    task.status = 'in_progress';
    task.beforeImages = beforeImageUrls;
    task.workerStartedAt = new Date();
    await task.save();

    const complaint = task.complaint;
    if (complaint) {
      complaint.status = 'in_progress';
      complaint.statusHistory.push({
        status: 'in_progress',
        updatedBy: req.user.id,
        note: 'Field worker has started work',
      });
      await complaint.save();

      // Notify original citizen
      await notify(
        complaint.citizen,
        'work_in_progress',
        'Work Has Started on Your Complaint',
        `A field worker has started working on: ${complaint.title}`,
        complaint._id,
        task._id
      );

      // Email original citizen
      const citizenDoc = await User.findById(complaint.citizen).select('name email');
      if (citizenDoc) sendWorkStartedEmail(citizenDoc, complaint).catch(() => {});

      // Notify linked duplicate citizens
      if (complaint.incidentGroup?.linkedComplaints?.length) {
        for (const linked of complaint.incidentGroup.linkedComplaints) {
          const linkedDoc = await Complaint.findById(linked).populate('citizen', '_id');
          if (linkedDoc?.citizen?._id) {
            await notify(
              linkedDoc.citizen._id,
              'work_in_progress',
              'Work Has Started on Your Reported Issue',
              `A field worker has started addressing the issue you reported: ${complaint.title}`,
              linkedDoc._id
            );

            // Email linked duplicate citizen too
            const linkedCitizenDoc = await User.findById(linkedDoc.citizen._id).select('name email');
            if (linkedCitizenDoc) sendWorkStartedEmail(linkedCitizenDoc, complaint).catch(() => {});
          }
        }
      }
    }

    // Notify officer
    await notify(
      task.assignedBy,
      'general',
      'Worker Started Task',
      `${req.user.name} has started working on: ${complaint?.title}`,
      complaint?._id,
      task._id
    );

    res.json({ success: true, data: { task } });
  } catch (err) {
    console.error('startTask:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 6. submitCompletion
// ────────────────────────────────────────────────────────────────────────────
exports.submitCompletion = async (req, res) => {
  try {
    const { completionNote } = req.body;
    const task = await WorkerTask.findById(req.params.id).populate('complaint', 'title citizen');

    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });
    if (String(task.assignedWorker) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'Access denied' });
    if (task.status !== 'in_progress')
      return res.status(400).json({ success: false, message: 'Task must be in progress to submit completion' });

    const afterImageUrls = req.files?.map((f) => toUrl(f.path)) || [];

    task.status = 'completed';
    task.afterImages = afterImageUrls;
    task.completionNote = completionNote || '';
    task.workerCompletedAt = new Date();
    await task.save();

    // Notify officer to verify
    await notify(
      task.assignedBy,
      'general',
      'Task Completion Submitted',
      `${req.user.name} has marked the task as complete. Please verify the work for: ${task.complaint?.title}`,
      task.complaint?._id,
      task._id
    );

    res.json({ success: true, data: { task } });
  } catch (err) {
    console.error('submitCompletion:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 7. getTaskLocation
// ────────────────────────────────────────────────────────────────────────────
exports.getTaskLocation = async (req, res) => {
  try {
    const task = await WorkerTask.findById(req.params.id).populate('complaint', 'location title');
    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });
    if (String(task.assignedWorker) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { location, title } = task.complaint;
    res.json({ success: true, data: { location, title } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
