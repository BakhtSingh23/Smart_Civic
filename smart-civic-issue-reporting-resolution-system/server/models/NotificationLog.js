const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
		message: { type: String, required: true },
		read: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
