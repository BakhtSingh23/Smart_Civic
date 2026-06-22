const mongoose = require('mongoose');

// ─── AutomationLog Schema ─────────────────────────────────────────────────────
// Provides an audit trail for every automation run. Stores execution metadata,
// counts, duration, and any errors for debugging and transparency.
// ───────────────────────────────────────────────────────────────────────────────

const automationLogSchema = new mongoose.Schema({
	executionTime: { type: Date, required: true },
	executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	totalProcessed: { type: Number, default: 0 },
	totalAssigned: { type: Number, default: 0 },
	totalFailed: { type: Number, default: 0 },
	totalDuplicates: { type: Number, default: 0 },
	duration: { type: Number, default: 0 }, // Duration in milliseconds
	errors: [{
		complaintId: String,
		error: String,
		timestamp: { type: Date, default: Date.now },
	}],
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.AutomationLog || mongoose.model('AutomationLog', automationLogSchema);
