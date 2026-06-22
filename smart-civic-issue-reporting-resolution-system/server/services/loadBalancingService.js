'use strict';

const Complaint = require('../models/Complaint');
const User = require('../models/User');

// ─── Load Balancing Service ───────────────────────────────────────────────────
// Provides dynamic workload calculation and officer selection for fair
// complaint distribution. Officers on leave or inactive are automatically
// excluded from assignment consideration.
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the active workload score for a specific officer.
 * Workload = assigned + in_progress complaints count.
 * @param {string} officerId - The officer's User _id
 * @returns {Promise<number>} The workload score
 */
async function calculateWorkload(officerId) {
	const count = await Complaint.countDocuments({
		assignedOfficer: officerId,
		status: { $in: ['assigned', 'in_progress', 'verified'] },
	});
	return count;
}

/**
 * Fetches all available officers for a department.
 * Excludes: inactive, on leave, and unavailable officers.
 * @param {string} department - The department string stored on User.department
 * @returns {Promise<Array>} Array of available officer documents
 */
async function getAvailableOfficers(department) {
	// Officers are stored with role='officer' and department matching the complaint category
	// Since we're mapping categories to departments, we need to find officers
	// whose `department` field matches the complaint category (the existing pattern)
	const officers = await User.find({
		role: 'officer',
		department: department,
		isActive: true,
		isAvailable: { $ne: false },
		isOnLeave: { $ne: true },
		$or: [
			{ availabilityStatus: { $in: ['active', 'busy'] } },
			{ availabilityStatus: { $exists: false } }
		]
	}).select('name email department employeeId isAvailable isOnLeave availabilityStatus');

	return officers;
}

/**
 * Finds the least-loaded officer in a given department.
 * Algorithm:
 * 1. Fetch all available officers in the department
 * 2. Calculate workload for each
 * 3. Sort by workload ascending
 * 4. Return the officer with the lowest workload
 * @param {string} department - The department to search in
 * @returns {Promise<{officer: Object, workload: number}|null>} The least loaded officer or null
 */
async function findLeastLoadedOfficer(department) {
	const officers = await getAvailableOfficers(department);

	if (officers.length === 0) {
		return null;
	}

	// Calculate workload for each officer in parallel
	const officersWithWorkload = await Promise.all(
		officers.map(async (officer) => {
			const workload = await calculateWorkload(officer._id);
			return { officer, workload };
		})
	);

	// Sort ascending by workload
	officersWithWorkload.sort((a, b) => a.workload - b.workload);

	return officersWithWorkload[0];
}

/**
 * Generates a comprehensive workload summary for all departments.
 * Returns per-department, per-officer workload breakdown.
 * @returns {Promise<Object>} Workload summary object
 */
async function getWorkloadSummary() {
	const allOfficers = await User.find({
		role: 'officer',
		isActive: true,
	}).select('name email department employeeId isAvailable isOnLeave availabilityStatus');

	const departments = {};

	for (const officer of allOfficers) {
		const dept = officer.department || 'Unassigned';
		if (!departments[dept]) {
			departments[dept] = {
				totalOfficers: 0,
				availableOfficers: 0,
				officers: [],
			};
		}

		const workload = await calculateWorkload(officer._id);
		const isAvailable = officer.isActive && officer.isAvailable && !officer.isOnLeave &&
			['active', 'busy'].includes(officer.availabilityStatus);

		departments[dept].totalOfficers++;
		if (isAvailable) departments[dept].availableOfficers++;

		departments[dept].officers.push({
			_id: officer._id,
			name: officer.name,
			email: officer.email,
			employeeId: officer.employeeId,
			department: officer.department,
			availabilityStatus: officer.availabilityStatus,
			isAvailable: officer.isAvailable,
			isOnLeave: officer.isOnLeave,
			workload,
		});
	}

	// Sort officers within each department by workload
	for (const dept of Object.keys(departments)) {
		departments[dept].officers.sort((a, b) => a.workload - b.workload);
	}

	return departments;
}

module.exports = {
	calculateWorkload,
	getAvailableOfficers,
	findLeastLoadedOfficer,
	getWorkloadSummary,
};
