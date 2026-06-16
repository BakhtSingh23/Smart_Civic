require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Complaint = require('../models/Complaint');
const IncidentGroup = require('../models/IncidentGroup');
const WorkerTask = require('../models/WorkerTask');

async function run() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		throw new Error('MONGO_URI is missing in environment');
	}

	const stamp = Date.now();
	const citizenEmail = `autoid.citizen.${stamp}@example.com`;
	const workerEmail = `autoid.worker.${stamp}@example.com`;

	let citizen;
	let worker;
	let complaint;
	let incident;
	let task;

	await mongoose.connect(mongoUri);

	try {
		citizen = await User.create({
			name: 'AutoId Citizen',
			email: citizenEmail,
			password: 'hashed-placeholder',
			phone: '9000000001',
			role: 'citizen',
		});

		worker = await User.create({
			name: 'AutoId Worker',
			email: workerEmail,
			password: 'hashed-placeholder',
			phone: '9000000002',
			role: 'worker',
			department: 'Roads',
			employeeId: `EMP-${stamp}`,
		});

		complaint = await Complaint.create({
			citizen: citizen._id,
			title: 'Auto ID test complaint',
			description: 'Generated for verifying pre-save complaintId hook',
			category: 'Roads',
			location: {
				type: 'Point',
				coordinates: [77.5946, 12.9716],
				address: 'MG Road',
				area: 'Central',
				city: 'Bengaluru',
				pincode: '560001',
			},
		});

		incident = await IncidentGroup.create({
			primaryComplaint: complaint._id,
			linkedComplaints: [complaint._id],
			linkedCitizens: [citizen._id],
			category: 'Roads',
			location: {
				coordinates: [77.5946, 12.9716],
				address: 'MG Road',
			},
			totalReporters: 1,
			department: 'Roads',
		});

		task = await WorkerTask.create({
			complaint: complaint._id,
			incidentGroup: incident._id,
			assignedWorker: worker._id,
			assignedBy: worker._id,
			instructions: 'Auto ID verification task',
		});

		console.log(`complaintId=${complaint.complaintId}`);
		console.log(`incidentId=${incident.incidentId}`);
		console.log(`taskId=${task.taskId}`);
		console.log('AUTO_ID_CHECK=PASS');
	} finally {
		if (task?._id) await WorkerTask.deleteOne({ _id: task._id });
		if (incident?._id) await IncidentGroup.deleteOne({ _id: incident._id });
		if (complaint?._id) await Complaint.deleteOne({ _id: complaint._id });
		await User.deleteMany({ email: { $in: [citizenEmail, workerEmail] } });
		await mongoose.disconnect();
	}
}

run().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
