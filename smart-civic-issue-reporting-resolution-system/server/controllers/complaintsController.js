const Complaint = require('../models/Complaint');
const NotificationLog = require('../models/NotificationLog');
const User = require('../models/User');

function buildRecurrenceKey({ category, locationText, latitude, longitude, department }) {
  const lat = latitude == null ? '' : String(latitude.toFixed(5));
  const lng = longitude == null ? '' : String(longitude.toFixed(5));
  return [category || '', department || '', (locationText || '').trim().toLowerCase(), lat, lng]
    .join('|')
    .slice(0, 180);
}

async function createComplaint(req, res, next) {
  try {
    const { title, description, category, department, locationText, latitude, longitude } = req.body;
    if (!title || !category) {
      res.status(400);
      return next(new Error('title and category are required'));
    }

    const beforeImageUrl = req.file ? `/uploads/${req.uploadFolder}/${req.file.filename}` : null;
    const recurrenceKey = buildRecurrenceKey({ category, locationText, latitude, longitude, department });

    const recentClosed = await Complaint.findOne({
      recurrenceKey,
      status: 'closed',
      createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    const complaint = await Complaint.create({
      citizen: req.user._id,
      title,
      description: description || '',
      category,
      department: department || null,
      locationText: locationText || '',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      beforeImageUrl,
      recurrenceKey,
      isRecurrent: Boolean(recentClosed),
      recurrentOf: recentClosed ? recentClosed._id : null,
    });

    await NotificationLog.create({
      user: req.user._id,
      complaint: complaint._id,
      message: `Complaint submitted: ${complaint.title}`,
    });

    res.status(201).json({ complaint });
  } catch (err) {
    next(err);
  }
}

async function listComplaints(req, res, next) {
  try {
    const role = req.user.role;
    const query = {};
    if (role === 'citizen') query.citizen = req.user._id;
    if (role === 'authority') query.department = req.user.department;
    if (role === 'worker') query.assignedWorker = req.user._id;

    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email')
      .populate('assignedAuthority', 'name email department')
      .populate('assignedWorker', 'name email department')
      .sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    next(err);
  }
}

async function assignDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { department, authorityId } = req.body;
    if (!department) {
      res.status(400);
      return next(new Error('department is required'));
    }

    let authority = null;
    if (authorityId) {
      authority = await User.findById(authorityId);
      if (!authority || authority.role !== 'authority') {
        res.status(400);
        return next(new Error('authorityId must be a valid authority user'));
      }
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404);
      return next(new Error('Complaint not found'));
    }

    complaint.department = department;
    complaint.assignedAuthority = authority ? authority._id : complaint.assignedAuthority;
    complaint.status = 'assigned_to_department';
    await complaint.save();

    if (authority) {
      await NotificationLog.create({
        user: authority._id,
        complaint: complaint._id,
        message: `New complaint assigned to your department: ${complaint.title}`,
      });
    }

    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

async function assignWorker(req, res, next) {
  try {
    const { id } = req.params;
    const { workerId } = req.body;
    if (!workerId) {
      res.status(400);
      return next(new Error('workerId is required'));
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      res.status(400);
      return next(new Error('workerId must be a valid worker user'));
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404);
      return next(new Error('Complaint not found'));
    }

    if (req.user.role === 'authority' && complaint.department !== req.user.department) {
      res.status(403);
      return next(new Error('Forbidden'));
    }

    complaint.assignedWorker = worker._id;
    complaint.status = 'assigned_to_worker';
    await complaint.save();

    await NotificationLog.create({
      user: worker._id,
      complaint: complaint._id,
      message: `New work assigned: ${complaint.title}`,
    });

    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

async function markInProgress(req, res, next) {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404);
      return next(new Error('Complaint not found'));
    }
    if (req.user.role !== 'worker' || String(complaint.assignedWorker) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Forbidden'));
    }

    complaint.status = 'in_progress';
    await complaint.save();
    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

async function completeWork(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404);
      return next(new Error('Complaint not found'));
    }
    if (req.user.role !== 'worker' || String(complaint.assignedWorker) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Forbidden'));
    }

    const completionImageUrl = req.file ? `/uploads/${req.uploadFolder}/${req.file.filename}` : null;
    if (!completionImageUrl) {
      res.status(400);
      return next(new Error('completion image is required'));
    }

    complaint.completionImageUrl = completionImageUrl;
    complaint.workerCompletionNote = note || '';
    complaint.status = 'completed';
    await complaint.save();

    await NotificationLog.create({
      user: complaint.citizen,
      complaint: complaint._id,
      message: `Work completed for your complaint: ${complaint.title}`,
    });

    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

async function closeTicket(req, res, next) {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404);
      return next(new Error('Complaint not found'));
    }
    complaint.status = 'closed';
    await complaint.save();

    await NotificationLog.create({
      user: complaint.citizen,
      complaint: complaint._id,
      message: `Ticket closed: ${complaint.title}`,
    });

    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

async function listRecurrent(req, res, next) {
  try {
    const role = req.user.role;
    const query = { isRecurrent: true };
    if (role === 'authority') query.department = req.user.department;
    const complaints = await Complaint.find(query).sort({ createdAt: -1 }).limit(200);
    res.json({ complaints });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createComplaint,
  listComplaints,
  assignDepartment,
  assignWorker,
  markInProgress,
  completeWork,
  closeTicket,
  listRecurrent,
};
