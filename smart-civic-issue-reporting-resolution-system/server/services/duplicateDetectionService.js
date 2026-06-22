'use strict';

const Complaint = require('../models/Complaint');

// ─── Duplicate Detection Service ──────────────────────────────────────────────
// Detects potential duplicate complaints based on category, geographic proximity,
// and text similarity. Extracted from adminController's autoDetectOnVerify logic
// and enhanced for the automation engine.
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Extracts keywords from text for similarity comparison.
 * Filters words shorter than 4 characters (stop words, articles, etc.).
 * @param {string} text - Input text
 * @returns {string[]} Array of keywords
 */
function getKeywords(text) {
	return text ? text.toLowerCase().split(/\W+/).filter(w => w.length > 3) : [];
}

/**
 * Calculates text similarity between two complaints using keyword overlap.
 * @param {Object} complaint1 - First complaint
 * @param {Object} complaint2 - Second complaint
 * @returns {number} Overlap ratio (0 to 1)
 */
function calculateTextSimilarity(complaint1, complaint2) {
	const keywords1 = [...new Set([
		...getKeywords(complaint1.title),
		...getKeywords(complaint1.description),
	])];
	const keywords2 = [...new Set([
		...getKeywords(complaint2.title),
		...getKeywords(complaint2.description),
	])];

	if (keywords1.length === 0) return 0;

	const intersection = keywords1.filter(k => keywords2.includes(k));
	return intersection.length / keywords1.length;
}

/**
 * Checks if a complaint has potential duplicates in the system.
 * Criteria:
 * 1. Same category
 * 2. Within 200 meters geographic radius
 * 3. Text similarity > 50% (keyword overlap)
 * 4. Existing complaint is not rejected or closed
 *
 * @param {Object} complaint - The complaint document to check
 * @returns {Promise<{isDuplicate: boolean, potentialMatches: Array, bestMatch: Object|null}>}
 */
async function checkForDuplicates(complaint) {
	const result = {
		isDuplicate: false,
		potentialMatches: [],
		bestMatch: null,
	};

	// Need valid coordinates for geo-proximity check
	if (!complaint.location || !complaint.location.coordinates || complaint.location.coordinates.length !== 2) {
		return result;
	}

	const [longitude, latitude] = complaint.location.coordinates;

	try {
		// Find nearby complaints with the same category that are still active
		const nearbyComplaints = await Complaint.find({
			_id: { $ne: complaint._id },
			category: complaint.category,
			status: { $nin: ['rejected', 'closed'] },
			location: {
				$near: {
					$geometry: { type: 'Point', coordinates: [longitude, latitude] },
					$maxDistance: 200, // 200 meters radius
				},
			},
		}).limit(10);

		// Filter by text similarity
		const matches = nearbyComplaints
			.map(dup => {
				const similarity = calculateTextSimilarity(complaint, dup);
				return { complaint: dup, similarity };
			})
			.filter(match => match.similarity > 0.5)
			.sort((a, b) => b.similarity - a.similarity);

		if (matches.length > 0) {
			result.isDuplicate = true;
			result.potentialMatches = matches.map(m => ({
				complaintId: m.complaint.complaintId,
				_id: m.complaint._id,
				title: m.complaint.title,
				category: m.complaint.category,
				status: m.complaint.status,
				similarity: Math.round(m.similarity * 100),
				location: m.complaint.location?.address,
			}));
			result.bestMatch = matches[0].complaint;
		}
	} catch (err) {
		// If geospatial query fails (e.g., no 2dsphere index), fall back to non-geo check
		console.warn('[DuplicateDetection] Geo query failed, falling back:', err.message);

		const categoryMatches = await Complaint.find({
			_id: { $ne: complaint._id },
			category: complaint.category,
			status: { $nin: ['rejected', 'closed'] },
		}).limit(20);

		const matches = categoryMatches
			.map(dup => {
				const similarity = calculateTextSimilarity(complaint, dup);
				return { complaint: dup, similarity };
			})
			.filter(match => match.similarity > 0.6) // Higher threshold without geo
			.sort((a, b) => b.similarity - a.similarity);

		if (matches.length > 0) {
			result.isDuplicate = true;
			result.potentialMatches = matches.slice(0, 5).map(m => ({
				complaintId: m.complaint.complaintId,
				_id: m.complaint._id,
				title: m.complaint.title,
				category: m.complaint.category,
				status: m.complaint.status,
				similarity: Math.round(m.similarity * 100),
				location: m.complaint.location?.address,
			}));
			result.bestMatch = matches[0].complaint;
		}
	}

	return result;
}

module.exports = {
	checkForDuplicates,
	calculateTextSimilarity,
	getKeywords,
};
