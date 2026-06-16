const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname);

const models = {
  'User.js': const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'admin', 'officer', 'worker'], default: 'citizen' },
  phone: String,
  department: String,
  employeeId: String,
  isActive: { type: Boolean, default: true },
  profileImage: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
,

  'Complaint.js': const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'Other'], required: true },
  media: [String],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    address: String,
    area: String,
    city: String,
    pincode: String
  },
  status: { type: String, enum: ['pending', 'verified', 'rejected', 'assigned', 'in_progress', 'completed', 'closed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  incidentGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentGroup', default: null },
  isDuplicate: { type: Boolean, default: false },
  assignedDepartment: String,
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNote: String,
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

complaintSchema.index({ "location": "2dsphere" });

complaintSchema.pre('save', function(next) {
  if (!this.complaintId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.complaintId = \\\CMP-\-\\\\;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
,

  'IncidentGroup.js': const mongoose = require('mongoose');

const incidentGroupSchema = new mongoose.Schema({
  incidentId: { type: String, unique: true },
  primaryComplaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  linkedComplaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
  linkedCitizens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  category: String,
  location: {
    coordinates: [Number],
    address: String
  },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  totalReporters: { type: Number, default: 1 },
  department: String,
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

incidentGroupSchema.pre('save', function(next) {
  if (!this.incidentId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.incidentId = \\\INC-\-\\\\;
  }
  next();
});

module.exports = mongoose.model('IncidentGroup', incidentGroupSchema);
,

  'WorkerTask.js': const mongoose = require('mongoose');

const workerTaskSchema = new mongoose.Schema({
  taskId: { type: String, unique: true },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  incidentGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentGroup' },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  instructions: String,
  status: { type: String, enum: ['assigned', 'accepted', 'in_progress', 'completed', 'reassigned'], default: 'assigned' },
  beforeImages: [String],
  afterImages: [String],
  completionNote: String,
  workerStartedAt: Date,
  workerCompletedAt: Date,
  officerVerifiedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

workerTaskSchema.pre('save', function(next) {
  if (!this.taskId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.taskId = \\\TSK-\-\\\\;
  }
  next();
});

module.exports = mongoose.model('WorkerTask', workerTaskSchema);
,

  'Notification.js': const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['complaint_submitted', 'complaint_verified', 'complaint_rejected', 'duplicate_linked', 'department_assigned', 'task_assigned', 'work_in_progress', 'complaint_resolved', 'feedback_request', 'general'] },
  title: String,
  message: String,
  relatedComplaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerTask' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
,

  'Feedback.js': const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  resolutionSatisfied: Boolean,
  responseTime: { type: String, enum: ['very_fast', 'fast', 'average', 'slow', 'very_slow'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);

};

for (const [filename, content] of Object.entries(models)) {
  fs.writeFileSync(path.join(modelsDir, filename), content, 'utf8');
  console.log(\Generated \\);
}
