'use strict';

// ─── Complaint Routing Service ────────────────────────────────────────────────
// Maps complaint categories and titles to the correct department and
// auto-detects priority based on keyword analysis of the complaint title.
// ───────────────────────────────────────────────────────────────────────────────

// Category → Department mapping
// The existing complaint categories are: Roads, Water, Sanitation, Electricity,
// Drainage, Street Lights, Public Health, Parks, Other
const CATEGORY_DEPARTMENT_MAP = {
	'Electricity': 'Electricity',
	'Street Lights': 'Electricity',
	'Water': 'Water Supply',
	'Roads': 'Roads & Infrastructure',
	'Drainage': 'Drainage',
	'Sanitation': 'Sanitation',
	'Public Health': 'Public Health',
	'Parks': 'Parks & Recreation',
	'Other': 'General',
};

// Title keywords → Priority mapping
// Priority levels: urgent (Critical), high, medium, low
const PRIORITY_RULES = [
	// Urgent / Critical priority
	{
		priority: 'urgent',
		keywords: [
			'fallen electric pole', 'collapsed', 'road collapse', 'major burst',
			'pipeline burst', 'electrocution', 'danger', 'life threatening',
			'emergency', 'fire', 'accident', 'explosion', 'flood',
			'building collapse', 'gas leak', 'sewage overflow major',
		],
	},
	// High priority
	{
		priority: 'high',
		keywords: [
			'water leakage', 'traffic signal failure', 'traffic signal issue',
			'transformer issue', 'power failure', 'electric pole damage',
			'loose electric wire', 'overflowing drain', 'drain blockage',
			'no water supply', 'sewage',
		],
	},
	// Medium priority
	{
		priority: 'medium',
		keywords: [
			'potholes', 'pothole', 'road damage', 'street light not working',
			'damaged street light', 'garbage overflow', 'waste overflow',
			'waste collection delay', 'low water pressure', 'mosquito breeding',
			'public toilet issue',
		],
	},
	// Low priority
	{
		priority: 'low',
		keywords: [
			'park maintenance', 'broken equipment', 'playground',
			'garden', 'bench', 'painting', 'minor', 'cosmetic',
		],
	},
];

/**
 * Determines the correct department for a given complaint category.
 * @param {string} category - The complaint category (e.g., 'Electricity', 'Roads')
 * @returns {string} The department name
 */
function getDepartment(category) {
	return CATEGORY_DEPARTMENT_MAP[category] || 'General';
}

/**
 * Auto-detects priority based on complaint title keywords.
 * Scans through priority rules from highest (urgent) to lowest (low).
 * Falls back to 'medium' if no keyword match is found.
 * @param {string} title - The complaint title
 * @param {string} category - The complaint category (optional, used for context)
 * @returns {string} The detected priority level
 */
function detectPriority(title, category) {
	const lowerTitle = (title || '').toLowerCase();

	for (const rule of PRIORITY_RULES) {
		for (const keyword of rule.keywords) {
			if (lowerTitle.includes(keyword)) {
				return rule.priority;
			}
		}
	}

	// Default: medium priority
	return 'medium';
}

/**
 * Routes a complaint to the correct department and detects priority.
 * @param {string} category - The complaint category
 * @param {string} title - The complaint title
 * @returns {{ department: string, priority: string }}
 */
function routeComplaint(category, title) {
	return {
		department: getDepartment(category),
		priority: detectPriority(title, category),
	};
}

/**
 * Returns the full department map for UI display purposes.
 * @returns {Object} Category to department mapping
 */
function getDepartmentMap() {
	return { ...CATEGORY_DEPARTMENT_MAP };
}

module.exports = {
	getDepartment,
	detectPriority,
	routeComplaint,
	getDepartmentMap,
	CATEGORY_DEPARTMENT_MAP,
	PRIORITY_RULES,
};
