const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true, lowercase: true },
	password: { type: String, required: true },
	role: { type: String, enum: ['citizen', 'admin', 'officer', 'worker'], default: 'citizen' },
	phone: String,
	department: String,
	employeeId: String,
	isActive: { type: Boolean, default: true },
	isAvailable: { type: Boolean, default: true },
	isOnLeave: { type: Boolean, default: false },
	availabilityStatus: { type: String, enum: ['active', 'busy', 'on_leave', 'inactive'], default: 'active' },
	profileImage: String,
	createdAt: { type: Date, default: Date.now },
});

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
