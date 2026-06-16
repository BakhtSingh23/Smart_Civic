const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
	complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
	citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	rating: { type: Number, min: 1, max: 5, required: true },
	comment: String,
	resolutionSatisfied: Boolean,
	responseTime: { type: String, enum: ['very_fast', 'fast', 'average', 'slow', 'very_slow'] },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
