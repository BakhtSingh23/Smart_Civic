const mongoose = require('mongoose');

// ─── AutomationReport Schema ──────────────────────────────────────────────────
// Stores comprehensive end-of-day reports generated after automated complaint
// processing. Each report captures full statistics: department-wise, priority-wise,
// authority assignments, and resolution summaries.
// ───────────────────────────────────────────────────────────────────────────────

const authorityAssignmentSchema = new mongoose.Schema({
	officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	officerName: String,
	department: String,
	assignedCount: { type: Number, default: 0 },
}, { _id: false });

const automationReportSchema = new mongoose.Schema({
	reportId: { type: String, unique: true },
	date: { type: Date, required: true },
	executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

	// Overall counts
	totalReceived: { type: Number, default: 0 },
	totalProcessed: { type: Number, default: 0 },
	totalAssigned: { type: Number, default: 0 },
	totalFailed: { type: Number, default: 0 },
	totalPending: { type: Number, default: 0 },
	totalDuplicates: { type: Number, default: 0 },

	// Department-wise breakdown: { "Electricity": { assigned: 5, pending: 2, failed: 1 }, ... }
	departmentSummary: { type: Map, of: new mongoose.Schema({
		assigned: { type: Number, default: 0 },
		pending: { type: Number, default: 0 },
		failed: { type: Number, default: 0 },
	}, { _id: false }) },

	// Priority-wise breakdown: { "urgent": 3, "high": 10, ... }
	prioritySummary: { type: Map, of: Number },

	// Per-officer assignment stats
	authorityAssignments: [authorityAssignmentSchema],

	// Resolution snapshot at time of report
	resolutionSummary: {
		resolved: { type: Number, default: 0 },
		inProgress: { type: Number, default: 0 },
		pending: { type: Number, default: 0 },
	},

	// Any errors encountered during processing
	errors: [{
		complaintId: String,
		error: String,
	}],

	createdAt: { type: Date, default: Date.now },
});

// Auto-generate unique reportId
automationReportSchema.pre('save', async function (next) {
	if (this.reportId) return next();

	const year = new Date().getFullYear();
	let unique = false;

	while (!unique) {
		const randomNum = Math.floor(1000 + Math.random() * 9000);
		const candidate = `RPT-${year}-${randomNum}`;
		const exists = await mongoose.models.AutomationReport.exists({ reportId: candidate });
		if (!exists) {
			this.reportId = candidate;
			unique = true;
		}
	}

	next();
});

module.exports = mongoose.models.AutomationReport || mongoose.model('AutomationReport', automationReportSchema);
