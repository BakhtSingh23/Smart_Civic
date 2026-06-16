const NotificationLog = require('../models/NotificationLog');

async function listMyNotifications(req, res, next) {
	try {
		const notifications = await NotificationLog.find({ user: req.user._id })
			.sort({ createdAt: -1 })
			.limit(200);
		res.json({ success: true, data: { notifications } });
	} catch (err) {
		next(err);
	}
}

async function getUnreadCount(req, res, next) {
	try {
		const count = await NotificationLog.countDocuments({ user: req.user._id, read: false });
		res.json({ success: true, count, data: { count } });
	} catch (err) {
		next(err);
	}
}

async function markRead(req, res, next) {
	try {
		const { id } = req.params;
		const notif = await NotificationLog.findOne({ _id: id, user: req.user._id });
		if (!notif) {
			res.status(404);
			return next(new Error('Notification not found'));
		}
		notif.read = true;
		await notif.save();
		res.json({ success: true, data: { notification: notif } });
	} catch (err) {
		next(err);
	}
}

module.exports = { listMyNotifications, getUnreadCount, markRead };
