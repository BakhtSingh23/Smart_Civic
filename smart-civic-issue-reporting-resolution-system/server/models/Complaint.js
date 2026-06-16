const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
	complaintId: { type: String, unique: true },
	citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	title: { type: String, required: true },
	description: { type: String, required: true },
	category: {
		type: String,
		enum: ['Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'Street Lights', 'Public Health', 'Parks', 'Other'],
		required: true,
	},
	media: [String],
	source: {
		type: String,
		enum: ['web_form', 'chatbot', 'api'],
		default: 'web_form'
	},
	location: {
		type: { type: String, default: 'Point' },
		coordinates: [Number],
		address: String,
		area: String,
		city: String,
		pincode: String,
	},
	status: {
		type: String,
		enum: ['pending', 'verified', 'rejected', 'assigned', 'in_progress', 'completed', 'closed'],
		default: 'pending',
	},
	statusHistory: [
		{
			status: { type: String, required: true },
			timestamp: { type: Date, default: Date.now },
			updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			note: String,
		},
	],

	priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
	incidentGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentGroup', default: null },
	isDuplicate: { type: Boolean, default: false },
	assignedDepartment: String,
	assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	adminNote: String,
	rejectionReason: String,
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
    feedbackGiven: { type: Boolean, default: false },
});

complaintSchema.index({ location: '2dsphere' });

complaintSchema.pre('save', async function (next) {
	if (this.complaintId) return next();

	const year = new Date().getFullYear();
	let unique = false;

	while (!unique) {
		const randomNum = Math.floor(1000 + Math.random() * 9000);
		const candidate = `CMP-${year}-${randomNum}`;
		const exists = await mongoose.models.Complaint.exists({ complaintId: candidate });
		if (!exists) {
			this.complaintId = candidate;
			unique = true;
		}
	}

	next();
});

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
