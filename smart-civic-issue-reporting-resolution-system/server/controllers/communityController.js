const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
const NotificationLog = require('../models/NotificationLog');
const Complaint = require('../models/Complaint');

// a) getAllThreads
exports.getAllThreads = async (req, res, next) => {
  try {
    const { category, area, status, search, tags, sort, page = 1 } = req.query;
    const limit = 15;
    const skip = (page - 1) * limit;

    const query = { status: { $ne: 'archived' } };
    if (category && category !== 'All') query.category = category;
    if (area) query.area = area;
    if (status) query.status = status;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'top') sortOption = { upvoteCount: -1 };
    if (sort === 'active') sortOption = { replyCount: -1 };

    const threads = await Thread.find(query)
      .populate('author', 'name role')
      .sort({ isPinned: -1, ...sortOption })
      .skip(skip)
      .limit(limit);

    const total = await Thread.countDocuments(query);

    res.json({
      threads,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    next(err);
  }
};

// b) getThread
exports.getThread = async (req, res, next) => {
  try {
    const thread = await Thread.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name role department')
      .populate('relatedComplaint', 'complaintId title status');

    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    res.json(thread);
  } catch (err) {
    next(err);
  }
};

// c) getThreadReplies
exports.getThreadReplies = async (req, res, next) => {
  try {
    const replies = await Reply.find({ thread: req.params.id })
      .populate('author', 'name role department')
      .sort({ createdAt: 1 });

    // Build nested structure
    const replyMap = {};
    replies.forEach(reply => {
      const replyObj = reply.toObject();
      replyObj.children = [];
      replyMap[reply._id] = replyObj;
    });

    const nestedReplies = [];
    replies.forEach(reply => {
      const replyObj = replyMap[reply._id];
      if (reply.parentReply) {
        if (replyMap[reply.parentReply]) {
          replyMap[reply.parentReply].children.push(replyObj);
        }
      } else {
        nestedReplies.push(replyObj);
      }
    });

    res.json(nestedReplies);
  } catch (err) {
    next(err);
  }
};

// d) createThread
exports.createThread = async (req, res, next) => {
  try {
    const { title, body, category, area, city, tags, relatedComplaint } = req.body;
    
    let complaintObjectId = null;
    if (relatedComplaint && relatedComplaint.startsWith('CMP-')) {
      const complaint = await Complaint.findOne({ complaintId: relatedComplaint });
      if (complaint) {
        complaintObjectId = complaint._id;
      } else {
        return res.status(400).json({ message: `Complaint with ID ${relatedComplaint} not found.` });
      }
    }

    const thread = await Thread.create({
      title,
      body,
      category,
      area,
      city,
      tags,
      relatedComplaint: complaintObjectId,
      author: req.user._id
    });
    res.status(201).json(thread);
  } catch (err) {
    next(err);
  }
};

// e) replyToThread
exports.replyToThread = async (req, res, next) => {
  try {
    const { body, parentReply } = req.body;
    const threadId = req.params.id;

    const isOfficial = req.user.role === 'officer' || req.user.role === 'admin';

    const reply = await Reply.create({
      thread: threadId,
      author: req.user._id,
      body,
      parentReply: parentReply || null,
      isOfficialResponse: isOfficial
    });

    const thread = await Thread.findByIdAndUpdate(threadId, {
      $inc: { replyCount: 1 },
      updatedAt: Date.now()
    });

    if (thread && String(thread.author) !== String(req.user._id)) {
      await NotificationLog.create({
        user: thread.author,
        message: `Someone replied to your thread: ${thread.title}`
      });
    }

    res.status(201).json(reply);
  } catch (err) {
    next(err);
  }
};

// f) upvoteThread
exports.upvoteThread = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const upvoteIndex = thread.upvotes.indexOf(req.user._id);
    let upvoted = false;

    if (upvoteIndex === -1) {
      thread.upvotes.push(req.user._id);
      thread.upvoteCount += 1;
      upvoted = true;
    } else {
      thread.upvotes.splice(upvoteIndex, 1);
      thread.upvoteCount -= 1;
    }

    await thread.save();
    res.json({ upvoted, newCount: thread.upvoteCount });
  } catch (err) {
    next(err);
  }
};

// g) upvoteReply
exports.upvoteReply = async (req, res, next) => {
  try {
    const reply = await Reply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const upvoteIndex = reply.upvotes.indexOf(req.user._id);
    let upvoted = false;

    if (upvoteIndex === -1) {
      reply.upvotes.push(req.user._id);
      reply.upvoteCount += 1;
      upvoted = true;
    } else {
      reply.upvotes.splice(upvoteIndex, 1);
      reply.upvoteCount -= 1;
    }

    await reply.save();
    res.json({ upvoted, newCount: reply.upvoteCount });
  } catch (err) {
    next(err);
  }
};

// h) deleteThread
exports.deleteThread = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    if (String(thread.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    thread.status = 'archived';
    await thread.save();
    res.json({ message: 'Thread archived' });
  } catch (err) {
    next(err);
  }
};

// i) deleteReply
exports.deleteReply = async (req, res, next) => {
  try {
    const reply = await Reply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    if (String(reply.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    reply.isDeleted = true;
    reply.body = '[Reply deleted]';
    await reply.save();
    res.json({ message: 'Reply deleted' });
  } catch (err) {
    next(err);
  }
};

// j) pinThread
exports.pinThread = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    thread.isPinned = !thread.isPinned;
    await thread.save();
    res.json({ isPinned: thread.isPinned });
  } catch (err) {
    next(err);
  }
};

// k) lockThread
exports.lockThread = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    thread.isLocked = !thread.isLocked;
    await thread.save();
    res.json({ isLocked: thread.isLocked });
  } catch (err) {
    next(err);
  }
};

// l) markThreadResolved
exports.markThreadResolved = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    if (String(thread.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    thread.status = 'resolved';
    await thread.save();
    res.json({ status: thread.status });
  } catch (err) {
    next(err);
  }
};
