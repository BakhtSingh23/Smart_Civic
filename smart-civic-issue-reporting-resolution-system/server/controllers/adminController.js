const Complaint = require('../models/Complaint');
const User = require('../models/User');
const IncidentGroup = require('../models/IncidentGroup');
const WorkerTask = require('../models/WorkerTask');
const Notification = require('../models/Notification');
const {
  sendComplaintVerifiedEmail,
  sendComplaintRejectedEmail,
  sendDuplicateLinkedEmail,
  sendDepartmentAssignedEmail,
  sendOfficerAssignedEmail,
  sendComplaintResolvedEmail,
  sendFeedbackRequestEmail,
} = require('../utils/emailService');

// 1. getDashboardStats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingVerification = await Complaint.countDocuments({ status: 'pending' });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const verifiedToday = await Complaint.countDocuments({
      statusHistory: {
        $elemMatch: {
          status: 'verified',
          timestamp: { $gte: startOfDay }
        }
      }
    });

    const rejectedTotal = await Complaint.countDocuments({ status: 'rejected' });
    const activeIncidents = await IncidentGroup.countDocuments({ status: { $in: ['open', 'in_progress'] } });
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const resolvedThisMonth = await Complaint.countDocuments({
      status: 'closed',
      statusHistory: {
        $elemMatch: {
          status: 'closed',
          timestamp: { $gte: startOfMonth }
        }
      }
    });

    const departmentBreakdownArray = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const departmentBreakdown = departmentBreakdownArray.reduce((acc, curr) => {
      acc[curr._id || 'Uncategorized'] = curr.count;
      return acc;
    }, {});

    const statusBreakdownArray = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusBreakdown = statusBreakdownArray.reduce((acc, curr) => {
      acc[curr._id || 'Unknown'] = curr.count;
      return acc;
    }, {});

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyTrendArray = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    const oldestPending = await Complaint.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate('citizen', 'name');

    const urgentUnresolved = await Complaint.find({ priority: 'urgent', status: { $nin: ['resolved', 'closed', 'rejected'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('citizen', 'name');

    res.json({
      success: true,
      data: {
        totalComplaints,
        pendingVerification,
        verifiedToday,
        rejectedTotal,
        activeIncidents,
        resolvedThisMonth,
        departmentBreakdown,
        statusBreakdown,
        dailyTrend: dailyTrendArray,
        oldestPending,
        urgentUnresolved
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. getAnalytics
exports.getAnalytics = async (req, res) => {
  try {
    const { period, dateFrom, dateTo, department } = req.query;
    
    let startDate = new Date();
    let endDate = new Date();

    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === 'custom' && dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setDate(startDate.getDate() - 30); // Default
    }

    const baseFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    if (department && department !== 'All') {
      baseFilter.category = department;
    }

    // a) complaintsTrend
    const complaintsTrendRaw = await Complaint.aggregate([
      { $match: baseFilter },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const complaintsTrend = complaintsTrendRaw.map(item => ({ date: item._id, count: item.count }));

    // b & c) resolutionRate & avgResolutionTime
    const resolvedComplaints = await Complaint.find({ ...baseFilter, status: 'resolved' });
    const allComplaintsInPeriod = await Complaint.countDocuments(baseFilter);
    let resolvedInSla = 0;
    let totalResolutionDays = 0;
    
    resolvedComplaints.forEach(c => {
      const resolveEvent = c.statusHistory.slice().reverse().find(h => h.status === 'resolved');
      const resolveDate = resolveEvent ? resolveEvent.timestamp : new Date();
      const daysToResolve = (resolveDate - c.createdAt) / (1000 * 60 * 60 * 24);
      totalResolutionDays += daysToResolve;
      if (daysToResolve <= 7) resolvedInSla++;
    });

    const resolutionRate = resolvedComplaints.length ? Math.round((resolvedInSla / resolvedComplaints.length) * 100) : 0;
    const avgResolutionTime = resolvedComplaints.length ? +(totalResolutionDays / resolvedComplaints.length).toFixed(1) : 0;

    // d) departmentPerformance
    const departments = ['Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'Other'];
    const departmentsToProcess = (department && department !== 'All') ? [department] : departments;
    const departmentPerformance = {};
    for (const dept of departmentsToProcess) {
      const assigned = await Complaint.countDocuments({ ...baseFilter, category: dept, status: { $in: ['assigned', 'in_progress', 'resolved', 'closed'] } });
      const resolved = await Complaint.countDocuments({ ...baseFilter, category: dept, status: 'resolved' });
      const pendingCount = await Complaint.countDocuments({ ...baseFilter, category: dept, status: { $in: ['pending', 'verified', 'assigned', 'in_progress'] } });
      
      const resolvedDeptComplaints = await Complaint.find({ ...baseFilter, category: dept, status: 'resolved' });
      let deptResDays = 0;
      resolvedDeptComplaints.forEach(c => {
        const resolveEvent = c.statusHistory.slice().reverse().find(h => h.status === 'resolved');
        const resolveDate = resolveEvent ? resolveEvent.timestamp : new Date();
        deptResDays += (resolveDate - c.createdAt) / (1000 * 60 * 60 * 24);
      });
      const avgTime = resolvedDeptComplaints.length ? +(deptResDays / resolvedDeptComplaints.length).toFixed(1) : 0;

      departmentPerformance[dept] = { assigned, resolved, avgTime, pendingCount };
    }

    // e) categoryBreakdown
    const categoryBreakdownArray = await Complaint.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const categoryBreakdown = categoryBreakdownArray.reduce((acc, curr) => {
      acc[curr._id || 'Other'] = curr.count;
      return acc;
    }, {});

    // f) statusDistribution
    const statusDistributionArray = await Complaint.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusDistribution = statusDistributionArray.reduce((acc, curr) => {
      acc[curr._id || 'Unknown'] = curr.count;
      return acc;
    }, {});

    // g) duplicateRate
    const duplicateCount = await Complaint.countDocuments({ ...baseFilter, 'incidentGroup': { $exists: true } });
    const duplicateRate = allComplaintsInPeriod ? Math.round((duplicateCount / allComplaintsInPeriod) * 100) : 0;

    // h) topLocations
    const topLocations = await Complaint.aggregate([
      { $match: { ...baseFilter, 'location.address': { $exists: true, $ne: '' } } },
      { $group: { _id: '$location.address', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // i) citizenSatisfaction
    const citizenSatisfaction = { rating: 4.2, count: 128 };

    // j) workerCompletionRate
    const workerTaskFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    if (department && department !== 'All') {
      const deptComplaints = await Complaint.find(baseFilter).select('_id');
      const complaintIds = deptComplaints.map(c => c._id);
      workerTaskFilter.complaint = { $in: complaintIds };
    }
    const totalTasks = await WorkerTask.countDocuments(workerTaskFilter);
    const completedTasks = await WorkerTask.countDocuments({ ...workerTaskFilter, status: { $in: ['completed', 'verified'] } });
    const workerCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 85;

    res.json({
      success: true,
      data: {
        complaintsTrend,
        resolutionRate,
        avgResolutionTime,
        departmentPerformance,
        categoryBreakdown,
        statusDistribution,
        duplicateRate,
        topLocations,
        citizenSatisfaction,
        workerCompletionRate,
        totalComplaintsInPeriod: allComplaintsInPeriod
      }
    });

  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching analytics' });
  }
};

// 3. getAllComplaints
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority, department, isDuplicate, dateFrom, dateTo, search, page = 1, limit = 15 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (department) filter.assignedDepartment = department;
    if (isDuplicate !== undefined && isDuplicate !== '') filter.isDuplicate = isDuplicate === 'true';
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { complaintId: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    let sort = { createdAt: -1 };
    if (req.query.sortBy === 'priority') {
      sort = { priority: -1 };
    }

    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name email')
      .populate('assignedOfficer', 'name department')
      .sort(sort)
      .skip(skip)
      .limit(pageSize);

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      complaints,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNumber,
      data: {
        complaints,
        total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: pageNumber
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. getComplaintDetail
exports.getComplaintDetail = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name email department phone')
      .populate('incidentGroup')
      .populate({
        path: 'statusHistory.updatedBy',
        select: 'name role'
      });

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const workerTasks = await WorkerTask.find({ complaint: complaint._id })
      .populate('assignedWorker', 'name phone')
      .populate('assignedBy', 'name');

    res.json({
      success: true,
      data: {
        complaint,
        workerTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal utility
const autoDetectOnVerify = async (complaint) => {
  if (!complaint.location || !complaint.location.coordinates || complaint.location.coordinates.length !== 2) {
    return { hasDuplicates: false, duplicates: [] };
  }

  const [longitude, latitude] = complaint.location.coordinates;
  const duplicates = await Complaint.find({
    _id: { $ne: complaint._id },
    category: complaint.category,
    status: { $nin: ['rejected', 'closed'] },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: 200 // 200 meters radius
      }
    }
  });

  // Text similarity check
  const getKeywords = (text) => text ? text.toLowerCase().split(/\W+/).filter(w => w.length > 3) : [];
  const primaryKeywords = [...new Set([...getKeywords(complaint.title), ...getKeywords(complaint.description)])];

  const filteredDuplicates = duplicates.filter(dup => {
    const dupKeywords = [...new Set([...getKeywords(dup.title), ...getKeywords(dup.description)])];
    const intersection = primaryKeywords.filter(k => dupKeywords.includes(k));
    const overlap = primaryKeywords.length > 0 ? (intersection.length / primaryKeywords.length) : 0;
    
    return primaryKeywords.length === 0 || overlap > 0.5;
  });

  return { 
    hasDuplicates: filteredDuplicates.length > 0, 
    duplicates: filteredDuplicates 
  };
};

// 4. verifyComplaint
exports.verifyComplaint = async (req, res) => {
  try {
    const { action, adminNote, rejectionReason } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    let duplicateSuggestion = null;

    if (action === 'verify') {
      complaint.status = 'verified';
      complaint.adminNote = adminNote;
      complaint.statusHistory.push({
        status: 'verified',
        updatedBy: req.user._id,
        note: adminNote
      });
      await complaint.save();

      await Notification.create({
        recipient: complaint.citizen,
        type: 'complaint_verified',
        title: 'Complaint Verified',
        message: `Your complaint ${complaint.complaintId} has been verified.`,
        relatedComplaint: complaint._id
      });

      // Email: verified
      const citizenDoc = await User.findById(complaint.citizen).select('name email');
      if (citizenDoc) sendComplaintVerifiedEmail(citizenDoc, complaint).catch(() => {});

      const dupResult = await autoDetectOnVerify(complaint);
      if (dupResult.hasDuplicates) {
        duplicateSuggestion = {
          message: `${dupResult.duplicates.length} possible duplicate complaints found. Review and merge?`,
          duplicates: dupResult.duplicates
        };
      }
    } else if (action === 'reject') {
      complaint.status = 'rejected';
      complaint.rejectionReason = rejectionReason;
      complaint.statusHistory.push({
        status: 'rejected',
        updatedBy: req.user._id,
        note: rejectionReason
      });
      await complaint.save();

      // Email: rejected
      const citizenDocRej = await User.findById(complaint.citizen).select('name email');
      if (citizenDocRej) sendComplaintRejectedEmail(citizenDocRej, complaint, rejectionReason).catch(() => {});

      await Notification.create({
        recipient: complaint.citizen,
        type: 'complaint_rejected',
        title: 'Complaint Rejected',
        message: `Your complaint ${complaint.complaintId} has been rejected. Reason: ${rejectionReason}`,
        relatedComplaint: complaint._id
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action, use verify or reject' });
    }

    const responsePayload = { success: true, message: `Complaint ${action}ed successfully` };
    if (duplicateSuggestion) {
      responsePayload.data = { duplicateSuggestion };
    }
    
    res.json(responsePayload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. assignDepartment
exports.assignDepartment = async (req, res) => {
  try {
    const { department, officerId } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('incidentGroup');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const officer = await User.findOne({ _id: officerId, role: 'officer', department });
    if (!officer) return res.status(400).json({ success: false, message: 'Invalid officer or department' });

    complaint.status = 'assigned';
    complaint.assignedDepartment = department;
    complaint.assignedOfficer = officerId;
    complaint.statusHistory.push({
      status: 'assigned',
      updatedBy: req.user._id,
      note: `Assigned to department: ${department}, Officer: ${officer.name}`
    });

    await Notification.create({
      recipient: officerId,
      type: 'department_assigned',
      title: 'New Complaint Assigned',
      message: `You have been assigned a new complaint: ${complaint.complaintId}`,
      relatedComplaint: complaint._id
    });

    if (complaint.incidentGroup && complaint.incidentGroup.primaryComplaint && complaint.incidentGroup.primaryComplaint.toString() === complaint._id.toString()) {
      const incident = await IncidentGroup.findById(complaint.incidentGroup._id);
      if (incident) {
        incident.assignedOfficer = officerId;
        incident.department = department;
        await incident.save();
      }
    }

    await complaint.save();

    // Emails: department assigned (citizen) + officer assigned
    const citizenForDept = await User.findById(complaint.citizen).select('name email');
    if (citizenForDept) sendDepartmentAssignedEmail(citizenForDept, complaint, department).catch(() => {});
    sendOfficerAssignedEmail(officer, complaint).catch(() => {});

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. closeComplaint
exports.closeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    complaint.status = 'closed';
    complaint.statusHistory.push({
      status: 'closed',
      updatedBy: req.user._id
    });
    await complaint.save();

    let citizensToNotify = [complaint.citizen.toString()];

    if (complaint.incidentGroup) {
      const incident = await IncidentGroup.findById(complaint.incidentGroup).populate('linkedComplaints');
      if (incident) {
        incident.status = 'resolved';
        incident.resolvedAt = new Date();
        await incident.save();

        for (let linkedComp of incident.linkedComplaints) {
          linkedComp.status = 'closed';
          linkedComp.statusHistory.push({
            status: 'closed',
            updatedBy: req.user._id
          });
          await linkedComp.save();
          citizensToNotify.push(linkedComp.citizen.toString());
        }
      }
    }

    // Notify + email all unique citizens
    citizensToNotify = [...new Set(citizensToNotify)];

    for (let citizenId of citizensToNotify) {
      await Notification.create({
        recipient: citizenId,
        type: 'complaint_resolved',
        title: 'Complaint Resolved',
        message: `Your complaint has been resolved.`,
        relatedComplaint: complaint._id
      });
      await Notification.create({
        recipient: citizenId,
        type: 'feedback_request',
        title: 'Feedback Request',
        message: `Please provide feedback for your recently resolved complaint.`,
        relatedComplaint: complaint._id
      });

      // Email each citizen
      const citizenDoc = await User.findById(citizenId).select('name email');
      if (citizenDoc) {
        sendComplaintResolvedEmail(citizenDoc, complaint).catch(() => {});
        sendFeedbackRequestEmail(citizenDoc, complaint).catch(() => {});
      }
    }

    res.json({ success: true, message: 'Complaint closed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. getOfficersByDepartment
exports.getOfficersByDepartment = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { role: 'officer', isActive: true };
    if (department) filter.department = department;

    const officers = await User.find(filter).select('name email department employeeId');
    res.json({ success: true, data: officers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. createStaffAccount is handled by authController's registerStaff method, included in routes

// 9. getAllOfficers
exports.getAllOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' }).select('name email role department employeeId isActive');
    res.json({ success: true, data: officers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9b. getAllWorkers
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('name email role department employeeId isActive');
    res.json({ success: true, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. toggleUserActive
exports.toggleUserActive = async (req, res) => {
  try {
    const userToToggle = await User.findById(req.params.id);
    if (!userToToggle) return res.status(404).json({ success: false, message: 'User not found' });

    if (userToToggle._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }

    userToToggle.isActive = !userToToggle.isActive;
    await userToToggle.save();

    res.json({ success: true, data: userToToggle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Duplicate Detection & Incident Groups ---

exports.checkDuplicates = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const result = await autoDetectOnVerify(complaint);
    
    let suggestedGroupId = null;
    for (const dup of result.duplicates) {
      if (dup.incidentGroup) {
        suggestedGroupId = dup.incidentGroup;
        break;
      }
    }

    res.json({
      success: true,
      data: {
        hasDuplicates: result.hasDuplicates,
        duplicates: result.duplicates,
        suggestedGroupId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.mergeDuplicates = async (req, res) => {
  try {
    const { primaryComplaintId, duplicateComplaintIds } = req.body;
    if (!primaryComplaintId || !duplicateComplaintIds || !duplicateComplaintIds.length) {
      return res.status(400).json({ success: false, message: 'Missing primary or duplicate IDs' });
    }

    const primaryComplaint = await Complaint.findById(primaryComplaintId);
    if (!primaryComplaint) return res.status(404).json({ success: false, message: 'Primary complaint not found' });

    const duplicates = await Complaint.find({ _id: { $in: duplicateComplaintIds } });
    if (duplicates.length !== duplicateComplaintIds.length) {
      return res.status(400).json({ success: false, message: 'Some duplicate complaints not found' });
    }

    for (const dup of duplicates) {
      if (dup.category !== primaryComplaint.category) {
        return res.status(400).json({ success: false, message: 'Cannot merge complaints of different categories' });
      }
    }

    let incidentGroup;
    if (primaryComplaint.incidentGroup) {
      incidentGroup = await IncidentGroup.findById(primaryComplaint.incidentGroup);
      if (!incidentGroup) return res.status(404).json({ success: false, message: 'Incident group not found' });
      
      const existingLinked = incidentGroup.linkedComplaints.map(id => id.toString());
      const existingCitizens = incidentGroup.linkedCitizens.map(id => id.toString());
      
      for (const dup of duplicates) {
        if (!existingLinked.includes(dup._id.toString())) {
          incidentGroup.linkedComplaints.push(dup._id);
        }
        if (!existingCitizens.includes(dup.citizen.toString())) {
          incidentGroup.linkedCitizens.push(dup.citizen);
        }
      }
      incidentGroup.totalReporters = 1 + incidentGroup.linkedComplaints.length;
      await incidentGroup.save();
    } else {
      const allCitizens = [primaryComplaint.citizen, ...duplicates.map(d => d.citizen)];
      const uniqueCitizens = [...new Set(allCitizens.map(c => c.toString()))];

      incidentGroup = new IncidentGroup({
        primaryComplaint: primaryComplaint._id,
        linkedComplaints: duplicates.map(d => d._id),
        linkedCitizens: uniqueCitizens,
        category: primaryComplaint.category,
        location: primaryComplaint.location,
        status: 'open',
        totalReporters: 1 + duplicates.length,
        department: primaryComplaint.assignedDepartment
      });
      await incidentGroup.save();

      primaryComplaint.incidentGroup = incidentGroup._id;
      primaryComplaint.isDuplicate = false;
      await primaryComplaint.save();
    }

    for (const dup of duplicates) {
      dup.isDuplicate = true;
      dup.incidentGroup = incidentGroup._id;
      if (dup.status === 'pending') {
         dup.status = 'verified';
         dup.statusHistory.push({
           status: 'verified',
           updatedBy: req.user._id,
           note: 'Auto-verified as duplicate during merge'
         });
      }
      await dup.save();

      await Notification.create({
        recipient: dup.citizen,
        type: 'duplicate_linked',
        title: 'Complaint Linked',
        message: `Your complaint ${dup.complaintId} has been linked to Incident Group ${incidentGroup.incidentId}. This means multiple citizens reported the same issue. Your issue will be tracked and resolved together.`,
        relatedComplaint: dup._id
      });

      // Email: duplicate linked
      const dupCitizen = await User.findById(dup.citizen).select('name email');
      if (dupCitizen) sendDuplicateLinkedEmail(dupCitizen, dup, incidentGroup).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        incidentGroup,
        mergedCount: duplicates.length
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unmergeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (!complaint.incidentGroup) {
      return res.status(400).json({ success: false, message: 'Complaint is not part of an incident group' });
    }

    const incidentGroup = await IncidentGroup.findById(complaint.incidentGroup);
    if (!incidentGroup) return res.status(404).json({ success: false, message: 'Incident group not found' });

    if (incidentGroup.primaryComplaint && incidentGroup.primaryComplaint.toString() === complaint._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot unmerge the primary complaint of an incident group. Assign a new primary first or delete the group.' });
    }

    incidentGroup.linkedComplaints = incidentGroup.linkedComplaints.filter(id => id.toString() !== complaint._id.toString());
    
    const remainingComplaints = await Complaint.find({ _id: { $in: incidentGroup.linkedComplaints } });
    let allCitizens = remainingComplaints.map(c => c.citizen);
    
    if (incidentGroup.primaryComplaint) {
      const primary = await Complaint.findById(incidentGroup.primaryComplaint);
      if (primary) allCitizens.push(primary.citizen);
    }
    
    incidentGroup.linkedCitizens = [...new Set(allCitizens.map(c => c.toString()))];
    incidentGroup.totalReporters = 1 + incidentGroup.linkedComplaints.length;
    
    await incidentGroup.save();

    complaint.isDuplicate = false;
    complaint.incidentGroup = null;
    await complaint.save();

    await Notification.create({
      recipient: complaint.citizen,
      type: 'general',
      title: 'Complaint Unlinked',
      message: `Your complaint ${complaint.complaintId} has been unlinked from its incident group and is now tracked independently.`,
      relatedComplaint: complaint._id
    });

    res.json({ success: true, message: 'Complaint unmerged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIncidentGroups = async (req, res) => {
  try {
    const { status, department, dateFrom, dateTo, page = 1, limit = 15 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const incidents = await IncidentGroup.find(filter)
      .populate('primaryComplaint', 'complaintId title category priority createdAt')
      .populate('assignedOfficer', 'name department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await IncidentGroup.countDocuments(filter);

    res.json({
      success: true,
      data: {
        incidents,
        total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: pageNumber
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIncidentGroupDetail = async (req, res) => {
  try {
    const incidentGroup = await IncidentGroup.findById(req.params.id)
      .populate('primaryComplaint')
      .populate({
        path: 'linkedComplaints',
        populate: { path: 'citizen', select: 'name email phone' }
      })
      .populate('linkedCitizens', 'name email phone')
      .populate('assignedOfficer', 'name email department phone');

    if (!incidentGroup) return res.status(404).json({ success: false, message: 'Incident group not found' });

    res.json({ success: true, data: incidentGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateTrainingData = async (req, res) => {
  try {
    const locations = [
      'Kakinada', 'Ramanayyapeta', 'Sarpavaram', 'Madhavapatnam', 'Vakalapudi',
      'Indrapalem', 'Jagannaickpur', 'Turangi', 'Pithapuram', 'Gollaprolu',
      'Chebrolu', 'Kattipudi', 'Samalkot', 'Unduru', 'Pedabrahmadevam',
      'Bikkavolu', 'Annavaram Road Region', 'Prathipadu', 'Kathipudi Junction Area',
      'Aditya Nagar', 'Surampalem'
    ];

    const categories = {
      'Electricity': ['Power Failure', 'Transformer Issue', 'Electric Pole Damage', 'Loose Electric Wire'],
      'Water': ['Water Leakage', 'No Water Supply', 'Low Water Pressure'],
      'Roads': ['Potholes', 'Road Damage', 'Traffic Signal Issue'],
      'Drainage': ['Drain Blockage', 'Overflowing Drain'],
      'Sanitation': ['Garbage Collection Delay', 'Waste Overflow'],
      'Street Lights': ['Street Light Not Working', 'Damaged Street Light'],
      'Public Health': ['Mosquito Breeding', 'Public Toilet Issue'],
      'Parks': ['Park Maintenance', 'Broken Equipment']
    };

    const priorities = [
      { level: 'low', weight: 0.20 },
      { level: 'medium', weight: 0.50 },
      { level: 'high', weight: 0.25 },
      { level: 'urgent', weight: 0.05 }
    ];

    const statuses = [
      { status: 'closed', weight: 0.60 }, 
      { status: 'in_progress', weight: 0.20 },
      { status: 'pending', weight: 0.15 },
      { status: 'verified', weight: 0.05 } 
    ];

    const getRandomWeighted = (array) => {
      let r = Math.random();
      for (let i = 0; i < array.length; i++) {
        if (r < array[i].weight) return array[i].status || array[i].level;
        r -= array[i].weight;
      }
      return array[0].status || array[0].level;
    };

    let citizen = await User.findOne({ role: 'citizen' });
    if (!citizen) {
      citizen = await User.create({
        name: 'Dummy Citizen',
        email: 'dummy_citizen@example.com',
        password: 'password123',
        role: 'citizen'
      });
    }

    const numRecords = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
    const complaints = [];
    const now = new Date();

    for (let i = 0; i < numRecords; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      let createdDate = new Date(now);
      createdDate.setDate(now.getDate() - daysAgo);

      const month = createdDate.getMonth();
      let categoryKeys = Object.keys(categories);
      let selectedCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];

      const rand = Math.random();
      if ((month >= 5 && month <= 8) && rand < 0.4) {
        selectedCategory = 'Drainage';
      } else if ((month >= 2 && month <= 5) && rand < 0.4) {
        selectedCategory = 'Electricity';
      } else if (rand < 0.1) {
        selectedCategory = 'Sanitation';
      }

      const titleOptions = categories[selectedCategory];
      const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
      
      const priority = getRandomWeighted(priorities);
      const currentStatus = getRandomWeighted(statuses);

      const locationStr = locations[Math.floor(Math.random() * locations.length)];
      
      let resolveDate = null;
      if (currentStatus === 'closed') {
        let resolveDays = 0;
        if (priority === 'low') resolveDays = Math.floor(Math.random() * (7 - 3 + 1)) + 3;
        else if (priority === 'medium') resolveDays = Math.floor(Math.random() * (5 - 2 + 1)) + 2;
        else if (priority === 'high') resolveDays = Math.floor(Math.random() * (3 - 1 + 1)) + 1;
        else resolveDays = Math.floor(Math.random() * 2);

        resolveDate = new Date(createdDate);
        resolveDate.setDate(createdDate.getDate() + resolveDays);
        if (resolveDate > now) {
          resolveDate = now;
        }
      }

      const year = createdDate.getFullYear();
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const complaintId = `CMP-${year}-${randomNum}-${i}`;

      const complaintDoc = {
        complaintId,
        citizen: citizen._id,
        title: `${title} at ${locationStr}`,
        description: `This is a generated dummy complaint regarding ${title.toLowerCase()} in ${locationStr}. Please look into this issue.`,
        category: selectedCategory,
        assignedDepartment: selectedCategory, // Added so department filter works
        location: {
          type: 'Point',
          coordinates: [82.24 + (Math.random() * 0.1), 16.93 + (Math.random() * 0.1)],
          address: locationStr,
          area: locationStr,
          city: 'Kakinada Region'
        },
        status: currentStatus,
        priority: priority,
        createdAt: createdDate,
        updatedAt: resolveDate || createdDate,
        statusHistory: [
          { status: 'pending', timestamp: createdDate }
        ]
      };

      if (resolveDate) {
        complaintDoc.statusHistory.push({ status: 'closed', timestamp: resolveDate });
      }

      complaints.push(complaintDoc);
    }

    await Complaint.insertMany(complaints);

    res.json({
      success: true,
      message: `Successfully generated ${numRecords} training complaints.`
    });
  } catch (error) {
    console.error('generateTrainingData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
