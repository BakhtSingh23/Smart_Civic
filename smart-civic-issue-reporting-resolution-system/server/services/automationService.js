'use strict';

const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const AutomationReport = require('../models/AutomationReport');
const AutomationLog = require('../models/AutomationLog');
const User = require('../models/User');

const { routeComplaint, getDepartment } = require('./complaintRoutingService');
const { findLeastLoadedOfficer } = require('./loadBalancingService');
const { checkForDuplicates } = require('./duplicateDetectionService');
const {
	sendOfficerAssignedEmail,
	sendDepartmentAssignedEmail,
	sendAutomationAssignmentEmail,
} = require('../utils/emailService');

// ─── Automation Service ───────────────────────────────────────────────────────
// Main orchestrator for the "Automate Today's Complaints" feature.
// Processes all verified but unassigned complaints from the current day:
//   1. Auto-detect priority from category/title
//   2. Sort by priority (urgent → high → medium → low)
//   3. Run duplicate detection
//   4. Route to correct department
//   5. Load-balance assign to least-loaded officer
//   6. Send notifications + emails
//   7. Generate report and log
// ───────────────────────────────────────────────────────────────────────────────

// Priority sort order: urgent (Critical) first, then high, medium, low
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

/**
 * Fetches all complaints eligible for automated processing today.
 * Eligible = verified status + no assigned officer + created today.
 * @returns {Promise<Array>} Array of eligible complaint documents
 */
async function fetchEligibleComplaints() {
	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date();
	endOfDay.setHours(23, 59, 59, 999);

	const complaints = await Complaint.find({
		status: 'verified',
		assignedOfficer: null,
		createdAt: { $gte: startOfDay, $lte: endOfDay },
	}).populate('citizen', 'name email');

	return complaints;
}

/**
 * Main automation orchestrator.
 * @param {string} adminUserId - The admin user who initiated the automation
 * @returns {Promise<Object>} Comprehensive result summary
 */
async function automateComplaints(adminUserId) {
	const startTime = Date.now();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Track results
	const results = {
		totalReceived: 0,
		totalProcessed: 0,
		totalAssigned: 0,
		totalFailed: 0,
		totalPending: 0,
		totalDuplicates: 0,
		departmentSummary: {},
		prioritySummary: { urgent: 0, high: 0, medium: 0, low: 0 },
		authorityAssignments: {},   // officerId → { name, department, count }
		errors: [],
		assignments: [],           // Detailed assignment records
	};

	// Step 1: Fetch eligible complaints
	const complaints = await fetchEligibleComplaints();
	results.totalReceived = complaints.length;

	if (complaints.length === 0) {
		// Generate empty report
		const report = await generateReport(results, adminUserId, today);
		const log = await generateLog(results, adminUserId, startTime);
		return { ...results, reportId: report.reportId, logId: log._id, duration: Date.now() - startTime };
	}

	// Step 2: Auto-detect priority and route department for each complaint
	const enrichedComplaints = complaints.map(complaint => {
		const routing = routeComplaint(complaint.category, complaint.title);
		return {
			complaint,
			department: routing.department,
			detectedPriority: routing.priority,
			// Use the higher priority between existing and detected
			effectivePriority: getHigherPriority(complaint.priority, routing.priority),
		};
	});

	// Step 3: Sort by priority (urgent first)
	enrichedComplaints.sort((a, b) => {
		const orderA = PRIORITY_ORDER[a.effectivePriority] ?? 2;
		const orderB = PRIORITY_ORDER[b.effectivePriority] ?? 2;
		return orderA - orderB;
	});

	// Step 4: Process each complaint
	for (const item of enrichedComplaints) {
		results.totalProcessed++;
		const { complaint, department, effectivePriority } = item;

		// Initialize department summary if needed
		if (!results.departmentSummary[complaint.category]) {
			results.departmentSummary[complaint.category] = { assigned: 0, pending: 0, failed: 0 };
		}

		try {
			// Step 4a: Update priority if auto-detected priority is higher
			if (complaint.priority !== effectivePriority) {
				complaint.priority = effectivePriority;
			}
			results.prioritySummary[effectivePriority] = (results.prioritySummary[effectivePriority] || 0) + 1;

			// Step 4b: Check for duplicates
			const dupResult = await checkForDuplicates(complaint);
			if (dupResult.isDuplicate) {
				results.totalDuplicates++;
				complaint.isDuplicate = true;
				if (dupResult.bestMatch) {
					complaint.originalComplaintId = dupResult.bestMatch._id;
				}
				// Mark but do NOT reject — admin will review
				// Continue with assignment
			}

			// Step 4c: Find the correct department for the officer
			// Officers in the system have their `department` field set to the category name
			// (e.g., 'Electricity', 'Roads'), so we search by the complaint's category
			const officerDepartment = complaint.category;

			// Step 4d: Find least loaded officer via load balancing
			const officerResult = await findLeastLoadedOfficer(officerDepartment);

			if (!officerResult) {
				// No available officer found for this department
				results.totalFailed++;
				results.departmentSummary[complaint.category].failed++;
				results.errors.push({
					complaintId: complaint.complaintId,
					error: `No available officer found for department: ${officerDepartment}`,
				});
				// Save any changes made (priority, duplicate flag)
				await complaint.save();
				continue;
			}

			const { officer } = officerResult;

			// Step 4e: Assign complaint to officer
			complaint.status = 'assigned';
			complaint.assignedDepartment = complaint.category;
			complaint.assignedOfficer = officer._id;
			complaint.automatedAssignment = true;
			complaint.automatedAssignmentAt = new Date();
			complaint.statusHistory.push({
				status: 'assigned',
				updatedBy: adminUserId,
				note: `Auto-assigned to ${officer.name} (${officer.department}) via automation engine. Priority: ${effectivePriority}`,
			});

			await complaint.save();

			// Step 4f: Track assignment stats
			results.totalAssigned++;
			results.departmentSummary[complaint.category].assigned++;

			const officerKey = officer._id.toString();
			if (!results.authorityAssignments[officerKey]) {
				results.authorityAssignments[officerKey] = {
					officerId: officer._id,
					officerName: officer.name,
					department: officer.department,
					count: 0,
				};
			}
			results.authorityAssignments[officerKey].count++;

			// Step 4g: Send notification to officer
			await Notification.create({
				recipient: officer._id,
				type: 'automation_assigned',
				title: 'New Automated Assignment',
				message: `Complaint ${complaint.complaintId} (${complaint.category}) has been auto-assigned to you. Priority: ${effectivePriority.toUpperCase()}.`,
				relatedComplaint: complaint._id,
			});

			// Step 4h: Notify citizen about department assignment
			if (complaint.citizen) {
				await Notification.create({
					recipient: complaint.citizen._id || complaint.citizen,
					type: 'department_assigned',
					title: 'Complaint Assigned',
					message: `Your complaint ${complaint.complaintId} has been assigned to the ${complaint.category} department.`,
					relatedComplaint: complaint._id,
				});
			}

			// Step 4i: Send emails (non-blocking)
			if (typeof sendAutomationAssignmentEmail === 'function') {
				sendAutomationAssignmentEmail(officer, complaint, effectivePriority).catch(() => {});
			} else {
				sendOfficerAssignedEmail(officer, complaint).catch(() => {});
			}

			const citizenDoc = complaint.citizen;
			if (citizenDoc && citizenDoc.email) {
				sendDepartmentAssignedEmail(citizenDoc, complaint, complaint.category).catch(() => {});
			}

			// Track for result summary
			results.assignments.push({
				complaintId: complaint.complaintId,
				category: complaint.category,
				priority: effectivePriority,
				officerName: officer.name,
				department: officer.department,
				isDuplicate: dupResult.isDuplicate,
			});

		} catch (err) {
			results.totalFailed++;
			results.departmentSummary[complaint.category].failed++;
			results.errors.push({
				complaintId: complaint.complaintId,
				error: err.message,
			});
			console.error(`[Automation] Failed to process complaint ${complaint.complaintId}:`, err.message);
		}
	}

	// Calculate pending
	results.totalPending = results.totalReceived - results.totalAssigned - results.totalFailed;

	// Step 5: Generate report and log
	const report = await generateReport(results, adminUserId, today);
	const log = await generateLog(results, adminUserId, startTime);

	const duration = Date.now() - startTime;

	return {
		...results,
		authorityAssignments: Object.values(results.authorityAssignments),
		reportId: report.reportId,
		logId: log._id,
		duration,
	};
}

/**
 * Compares two priorities and returns the higher one.
 */
function getHigherPriority(existing, detected) {
	const order = { urgent: 0, high: 1, medium: 2, low: 3 };
	const existingOrder = order[existing] ?? 2;
	const detectedOrder = order[detected] ?? 2;
	return existingOrder <= detectedOrder ? existing : detected;
}

/**
 * Generates and stores an AutomationReport document.
 */
async function generateReport(results, adminUserId, date) {
	// Get resolution snapshot
	const resolved = await Complaint.countDocuments({ status: { $in: ['completed', 'closed'] } });
	const inProgress = await Complaint.countDocuments({ status: 'in_progress' });
	const pending = await Complaint.countDocuments({ status: { $in: ['pending', 'verified'] } });

	const report = new AutomationReport({
		date,
		executedBy: adminUserId,
		totalReceived: results.totalReceived,
		totalProcessed: results.totalProcessed,
		totalAssigned: results.totalAssigned,
		totalFailed: results.totalFailed,
		totalPending: results.totalPending,
		totalDuplicates: results.totalDuplicates,
		departmentSummary: results.departmentSummary,
		prioritySummary: results.prioritySummary,
		authorityAssignments: Object.values(results.authorityAssignments),
		resolutionSummary: { resolved, inProgress, pending },
		errors: results.errors,
	});

	await report.save();
	return report;
}

/**
 * Generates and stores an AutomationLog document.
 */
async function generateLog(results, adminUserId, startTime) {
	const log = new AutomationLog({
		executionTime: new Date(startTime),
		executedBy: adminUserId,
		totalProcessed: results.totalProcessed,
		totalAssigned: results.totalAssigned,
		totalFailed: results.totalFailed,
		totalDuplicates: results.totalDuplicates,
		duration: Date.now() - startTime,
		errors: results.errors.map(e => ({ ...e, timestamp: new Date() })),
	});

	await log.save();
	return log;
}

module.exports = {
	automateComplaints,
	fetchEligibleComplaints,
};
