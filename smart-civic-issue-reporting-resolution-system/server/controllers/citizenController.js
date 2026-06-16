const path = require('path');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendComplaintSubmittedEmail } = require('../utils/emailService');
const Feedback = require('../models/Feedback');

const sendResponse = (res, data) =>
  res.json({ success: true, message: 'Citizen data loaded', data });

async function submitComplaint(req, res) {
  try {
    console.log('submitComplaint called');
    console.log('User:', req.user);
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const {
      title,
      description,
      category,
      address,
      area,
      city,
      pincode,
      latitude,
      longitude,
    } = req.body;

    if (!title || !description || !category || !address || !area || !city || !pincode || !latitude || !longitude) {
      console.log('Missing required fields');
      return res.status(400).json({ success: false, message: 'All complaint fields are required', data: {} });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      console.log('Invalid coordinates');
      return res.status(400).json({ success: false, message: 'Invalid latitude or longitude', data: {} });
    }

    const media = Array.isArray(req.files)
      ? req.files.map((file) => path.join('uploads', 'complaints', file.filename).replace(/\\/g, '/'))
      : [];

    const location = {
      type: 'Point',
      coordinates: [lng, lat],
      address: String(address).trim(),
      area: String(area).trim(),
      city: String(city).trim(),
      pincode: String(pincode).trim(),
    };

    console.log('Creating complaint with citizen:', req.user._id);
    const complaint = await Complaint.create({
      citizen: req.user._id,
      title: String(title).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
      media,
      location,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          updatedBy: req.user._id,
          note: 'Complaint submitted by citizen',
        },
      ],
    });

    console.log('Complaint created:', complaint._id, complaint.complaintId);

    const admins = await User.find({ role: 'admin', isActive: true });
    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        recipient: admin._id,
        type: 'complaint_submitted',
        title: 'New complaint submitted',
        message: `A new complaint ${complaint.complaintId} has been submitted by ${req.user.name}.`,
        relatedComplaint: complaint._id,
      }));
      await Notification.insertMany(notifications);
      console.log('Notifications created for', admins.length, 'admins');
    }

    // Fire submission confirmation email — never block the response
    sendComplaintSubmittedEmail(req.user, complaint).catch(() => {});

    return res.status(201).json({ success: true, message: 'Complaint submitted', complaint });
  } catch (err) {
    console.error('submitComplaint error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit complaint', error: err.message, data: {} });
  }
}

async function getMyComplaints(req, res) {
  try {
    console.log('getMyComplaints called for user:', req.user._id);
    
    const { status, page = 1, limit = 10 } = req.query;
    const filters = { citizen: req.user._id };
    if (status) filters.status = status;

    console.log('Filters:', filters);

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    const total = await Complaint.countDocuments(filters);
    console.log('Total complaints matching filter:', total);

    const complaints = await Complaint.find(filters)
      .populate('incidentGroup', 'incidentId status totalReporters')
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    console.log('Complaints returned:', complaints.length);

    return res.json({
      success: true,
      message: 'Complaints loaded',
      data: {
        complaints,
        total,
        currentPage: pageNumber,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error('getMyComplaints error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load complaints', error: err.message, data: {} });
  }
}

async function getComplaintDetail(req, res) {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findOne({ _id: id, citizen: req.user._id })
      .populate('assignedOfficer', 'name department')
      .populate('incidentGroup');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found', data: {} });
    }

    return res.json({ success: true, message: 'Complaint detail loaded', data: { complaint } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load complaint', data: {} });
  }
}

async function getComplaintTimeline(req, res) {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findOne({ _id: id, citizen: req.user._id }).populate('statusHistory.updatedBy', 'name role');
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found', data: {} });
    }

    const timeline = Array.isArray(complaint.statusHistory) && complaint.statusHistory.length > 0
      ? complaint.statusHistory
          .map((item) => ({
            status: item.status,
            timestamp: item.timestamp,
            updatedBy: item.updatedBy ? { id: item.updatedBy._id, name: item.updatedBy.name, role: item.updatedBy.role } : null,
            note: item.note || '',
          }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      : [
          {
            status: complaint.status,
            timestamp: complaint.createdAt,
            updatedBy: { id: req.user._id, name: req.user.name, role: req.user.role },
            note: 'Complaint submitted',
          },
        ];

    return res.json({ success: true, message: 'Timeline loaded', data: { timeline } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load timeline', data: {} });
  }
}

async function getProfile(req, res) {
  return sendResponse(res, { user: req.user });
}

async function getDashboard(req, res) {
  try {
    const complaints = await Complaint.find({ citizen: req.user._id });
    const summary = {
      total: complaints.length,
      pending: complaints.filter((item) => item.status === 'pending').length,
      verified: complaints.filter((item) => item.status === 'verified').length,
      completed: complaints.filter((item) => item.status === 'completed').length,
      duplicate: complaints.filter((item) => item.isDuplicate).length,
    };
    return sendResponse(res, { summary, complaints: complaints.slice(0, 5) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load dashboard', data: {} });
  }
}

async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20, type, unreadOnly } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const filters = { recipient: req.user._id };
    if (type) filters.type = type;
    if (unreadOnly === 'true') filters.isRead = false;

    const total = await Notification.countDocuments(filters);
    const notifications = await Notification.find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return res.json({ success: true, message: 'Notifications loaded', data: { notifications, unreadCount, totalPages: Math.ceil(total / pageSize) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load notifications', data: {} });
  }
}

async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, recipient: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found', data: {} });
    notification.isRead = true;
    await notification.save();
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark notification', data: {} });
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { $set: { isRead: true } });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark all read', data: {} });
  }
}

async function submitFeedback(req, res) {
  try {
    const { id } = req.params; // complaint id
    const { rating, comment, resolutionSatisfied, responseTime } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found', data: {} });
    if (String(complaint.citizen) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized for this complaint', data: {} });
    if (complaint.status !== 'closed' && complaint.status !== 'completed') return res.status(400).json({ success: false, message: 'Feedback allowed only for closed complaints', data: {} });

    const existing = await Feedback.findOne({ complaint: complaint._id, citizen: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Feedback already submitted for this complaint', data: {} });

    const fb = await Feedback.create({ complaint: complaint._id, citizen: req.user._id, rating, comment, resolutionSatisfied, responseTime });
    complaint.feedbackGiven = true;
    await complaint.save();

    return res.json({ success: true, message: 'Feedback submitted', data: { feedback: fb } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit feedback', data: {} });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found', data: {} });
    if (name) user.name = String(name).trim();
    if (phone) user.phone = String(phone).trim();
    await user.save();
    return res.json({ success: true, message: 'Profile updated', data: { user } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile', data: {} });
  }
}

async function getUnreadNotificationCount(req, res) {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    return res.json({ success: true, message: 'Unread count', data: { count } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get unread count', data: {} });
  }
}

module.exports = {
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
};

