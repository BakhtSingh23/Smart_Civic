const Complaint = require('../models/Complaint');
const WorkerTask = require('../models/WorkerTask');
const User = require('../models/User');
const Notification = require('../models/Notification');
const IncidentGroup = require('../models/IncidentGroup');
const { sendWorkerTaskEmail, sendComplaintResolvedEmail } = require('../utils/emailService');

// ────────────────────────────────────────────────────────────────────────────
// Helper: create notification
// ────────────────────────────────────────────────────────────────────────────
const createNotif = (recipient, type, title, message, relatedComplaint = null, relatedTask = null) =>
  Notification.create({ recipient, type, title, message, relatedComplaint, relatedTask });

// ────────────────────────────────────────────────────────────────────────────
// 1. getOfficerDashboardStats
// ────────────────────────────────────────────────────────────────────────────
exports.getOfficerDashboardStats = async (req, res) => {
  try {
    const officerId = req.user.id;
    const department = req.user.department;

    const totalAssigned = await Complaint.countDocuments({ assignedOfficer: officerId });
    const pendingAction = await Complaint.countDocuments({
      assignedOfficer: officerId,
      status: { $in: ['assigned', 'in_progress'] },
    });

    // "Pending verification" = worker marked task complete, officer hasn't verified yet
    const pendingVerification = await WorkerTask.countDocuments({
      assignedBy: officerId,
      status: 'completed',
    });

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const completedThisWeek = await Complaint.countDocuments({
      assignedOfficer: officerId,
      status: 'completed',
      updatedAt: { $gte: startOfWeek },
    });

    // Workers in same department
    const workers = await User.find({ role: 'worker', department, isActive: true })
      .select('name email employeeId phone department');

    // For each worker, attach active task count
    const workersWithTasks = await Promise.all(
      workers.map(async (w) => {
        const activeTaskCount = await WorkerTask.countDocuments({
          assignedWorker: w._id,
          status: { $in: ['assigned', 'accepted', 'in_progress'] },
        });
        return { worker: w, activeTaskCount };
      })
    );

    // Complaints needing worker assignment
    const needsAssignment = await Complaint.find({
      assignedOfficer: officerId,
      status: 'assigned',
    })
      .select('complaintId title priority createdAt location')
      .sort({ createdAt: 1 })
      .limit(10);

    // Complaints with completed tasks awaiting officer verification
    const needsVerification = await WorkerTask.find({
      assignedBy: officerId,
      status: 'completed',
    })
      .populate('complaint', 'complaintId title priority')
      .populate('assignedWorker', 'name')
      .sort({ workerCompletedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalAssigned,
        pendingAction,
        pendingVerification,
        completedThisWeek,
        workersActive: workersWithTasks.filter((w) => w.activeTaskCount > 0).length,
        workers: workersWithTasks,
        needsAssignment,
        needsVerification,
      },
    });
  } catch (err) {
    console.error('getOfficerDashboardStats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 2. getAssignedComplaints
// ────────────────────────────────────────────────────────────────────────────
exports.getAssignedComplaints = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 15 } = req.query;
    const query = { assignedOfficer: req.user.id };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;
    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('citizen', 'name email')
        .populate('incidentGroup', 'incidentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Complaint.countDocuments(query),
    ]);

    // Attach latest worker task per complaint
    const complaintsWithTask = await Promise.all(
      complaints.map(async (c) => {
        const latestTask = await WorkerTask.findOne({ complaint: c._id })
          .populate('assignedWorker', 'name employeeId')
          .sort({ createdAt: -1 });
        return { ...c.toObject(), latestTask };
      })
    );

    res.json({
      success: true,
      data: {
        complaints: complaintsWithTask,
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
// 3. getComplaintDetail
// ────────────────────────────────────────────────────────────────────────────
exports.getComplaintDetail = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name email')
      .populate('incidentGroup');

    if (!complaint)
      return res.status(404).json({ success: false, message: 'Complaint not found' });

    const workerTasks = await WorkerTask.find({ complaint: complaint._id })
      .populate('assignedWorker', 'name employeeId phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { complaint, workerTasks } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 4. assignWorker
// ────────────────────────────────────────────────────────────────────────────
exports.assignWorker = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { workerId, instructions } = req.body;

    const complaint = await Complaint.findById(complaintId).populate('incidentGroup');
    if (!complaint)
      return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (String(complaint.assignedOfficer) !== String(req.user.id))
      return res.status(403).json({ success: false, message: 'Not your assigned complaint' });

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker')
      return res.status(400).json({ success: false, message: 'Invalid worker' });

    if (worker.department !== req.user.department)
      return res.status(403).json({ success: false, message: 'Worker not in your department' });

    const task = await WorkerTask.create({
      complaint: complaint._id,
      assignedWorker: workerId,
      assignedBy: req.user.id,
      instructions,
      status: 'assigned',
    });

    complaint.status = 'in_progress';
    complaint.statusHistory.push({
      status: 'in_progress',
      updatedBy: req.user.id,
      note: `Worker ${worker.name} assigned`,
    });
    await complaint.save();

    // Notify worker
    await createNotif(
      workerId,
      'task_assigned',
      'New Task Assigned',
      `You have been assigned to: ${complaint.title}`,
      complaint._id,
      task._id
    );

    // Notify linked duplicate citizens
    if (complaint.incidentGroup) {
      const group = await IncidentGroup.findById(complaint.incidentGroup).populate('linkedComplaints');
      if (group?.linkedComplaints?.length) {
        for (const linked of group.linkedComplaints) {
          const linkedComplaint = await Complaint.findById(linked).populate('citizen', '_id');
          if (linkedComplaint?.citizen?._id) {
            await createNotif(
              linkedComplaint.citizen._id,
              'work_in_progress',
              'Work Started on Your Issue',
              `A worker has been assigned to address: ${complaint.title}`,
              linkedComplaint._id
            );
          }
        }
      }
    }

    // Also notify the original citizen
    await createNotif(
      complaint.citizen,
      'work_in_progress',
      'Work Started on Your Complaint',
      `A field worker has been assigned to your complaint: ${complaint.title}`,
      complaint._id,
      task._id
    );

    const populated = await task.populate('assignedWorker', 'name employeeId email');

    // Email the worker about their new task
    sendWorkerTaskEmail(worker, task, complaint).catch(() => {});

    res.status(201).json({ success: true, data: { task: populated } });
  } catch (err) {
    console.error('assignWorker:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 5. reassignWorker
// ────────────────────────────────────────────────────────────────────────────
exports.reassignWorker = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { newWorkerId, reason } = req.body;

    const oldTask = await WorkerTask.findById(taskId);
    if (!oldTask)
      return res.status(404).json({ success: false, message: 'Task not found' });

    const newWorker = await User.findById(newWorkerId);
    if (!newWorker || newWorker.department !== req.user.department)
      return res.status(400).json({ success: false, message: 'Invalid worker or department mismatch' });

    oldTask.status = 'reassigned';
    await oldTask.save();

    const newTask = await WorkerTask.create({
      complaint: oldTask.complaint,
      assignedWorker: newWorkerId,
      assignedBy: req.user.id,
      instructions: oldTask.instructions,
      status: 'assigned',
    });

    await createNotif(
      newWorkerId,
      'task_assigned',
      'Task Reassigned to You',
      `You have been reassigned a task. Reason: ${reason || 'Reassignment by officer'}`,
      oldTask.complaint,
      newTask._id
    );

    res.json({ success: true, data: { newTask } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 6. verifyWorkerCompletion
// ────────────────────────────────────────────────────────────────────────────
exports.verifyWorkerCompletion = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { action, officerNote } = req.body;

    const task = await WorkerTask.findById(taskId).populate('complaint');
    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found' });

    if (action === 'approve') {
      task.status = 'verified';
      task.officerVerifiedAt = new Date();
      await task.save();

      const complaint = await Complaint.findById(task.complaint._id).populate('incidentGroup');
      complaint.status = 'completed';
      complaint.statusHistory.push({
        status: 'completed',
        updatedBy: req.user.id,
        note: officerNote || 'Officer verified completion',
      });
      await complaint.save();

      // Notify citizen
      await createNotif(
        complaint.citizen,
        'complaint_resolved',
        'Your Complaint Has Been Resolved',
        `The work on your complaint "${complaint.title}" has been verified and completed.`,
        complaint._id,
        task._id
      );

      // Email citizen about resolution
      const citizenDoc = await User.findById(complaint.citizen).select('name email');
      if (citizenDoc) {
        sendComplaintResolvedEmail(citizenDoc, complaint).catch(() => {});
      }

      // Also email linked duplicate citizens
      if (complaint.incidentGroup) {
        const group = await IncidentGroup.findById(complaint.incidentGroup);
        if (group?.linkedComplaints?.length) {
          for (const linkedId of group.linkedComplaints) {
            const linkedComplaint = await Complaint.findById(linkedId).populate('citizen', 'name email');
            if (linkedComplaint?.citizen?.email) {
              sendComplaintResolvedEmail(linkedComplaint.citizen, linkedComplaint).catch(() => {});
            }
          }
        }
      }

      // If part of an incident group, check if all linked complaints are completed
      if (complaint.incidentGroup) {
        const group = await IncidentGroup.findById(complaint.incidentGroup);
        if (group) {
          const allComplaints = [group.primaryComplaint, ...group.linkedComplaints];
          const statuses = await Complaint.find({ _id: { $in: allComplaints } }).select('status');
          const allDone = statuses.every((c) => c.status === 'completed' || c.status === 'closed');
          if (allDone) {
            group.status = 'resolved';
            await group.save();
          }
        }
      }
    } else if (action === 'reject') {
      task.status = 'reassigned';
      await task.save();

      await createNotif(
        task.assignedWorker,
        'general',
        'Completion Rejected',
        `Your completion for task was rejected. Reason: ${officerNote || 'Please redo the work.'}`,
        task.complaint,
        task._id
      );
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject.' });
    }

    res.json({ success: true, message: `Task ${action}d successfully` });
  } catch (err) {
    console.error('verifyWorkerCompletion:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 7. getDepartmentWorkers
// ────────────────────────────────────────────────────────────────────────────
exports.getDepartmentWorkers = async (req, res) => {
  try {
    const workers = await User.find({
      role: 'worker',
      department: req.user.department,
      isActive: true,
    }).select('name email employeeId phone department createdAt');

    const result = await Promise.all(
      workers.map(async (w) => {
        const activeTaskCount = await WorkerTask.countDocuments({
          assignedWorker: w._id,
          status: { $in: ['assigned', 'accepted', 'in_progress'] },
        });
        const completedTaskCount = await WorkerTask.countDocuments({
          assignedWorker: w._id,
          status: { $in: ['completed', 'verified'] },
        });
        return { worker: w, activeTaskCount, completedTaskCount };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 8. getWorkerTaskHistory
// ────────────────────────────────────────────────────────────────────────────
exports.getWorkerTaskHistory = async (req, res) => {
  try {
    const { page = 1, limit = 15, workerId, status } = req.query;
    const query = { assignedBy: req.user.id };
    if (workerId) query.assignedWorker = workerId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      WorkerTask.find(query)
        .populate('complaint', 'complaintId title status priority')
        .populate('assignedWorker', 'name employeeId')
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
