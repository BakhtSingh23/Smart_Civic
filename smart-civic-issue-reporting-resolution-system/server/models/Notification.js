const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
	recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	type: {
		type: String,
		enum: [
			'complaint_submitted',
			'complaint_verified',
			'complaint_rejected',
			'duplicate_linked',
			'department_assigned',
			'task_assigned',
			'work_in_progress',
			'complaint_resolved',
			'feedback_request',
			'general',
		],
	},
	title: String,
	message: String,
	relatedComplaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
	relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerTask' },
	isRead: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
