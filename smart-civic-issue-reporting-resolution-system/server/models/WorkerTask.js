const mongoose = require('mongoose');

const workerTaskSchema = new mongoose.Schema({
  taskId: { type: String, unique: true },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  incidentGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentGroup' },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  instructions: String,
  status: {
    type: String,
    enum: ['assigned', 'accepted', 'in_progress', 'completed', 'verified', 'reassigned'],
    default: 'assigned',
  },
  beforeImages: [String],
  afterImages: [String],
  completionNote: String,
  workerStartedAt: Date,
  workerCompletedAt: Date,
  officerVerifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

workerTaskSchema.pre('save', async function (next) {
  if (this.taskId) return next();

  const year = new Date().getFullYear();
  let unique = false;

  while (!unique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = `TSK-${year}-${randomNum}`;
    const exists = await mongoose.models.WorkerTask.exists({ taskId: candidate });
    if (!exists) {
      this.taskId = candidate;
      unique = true;
    }
  }

  next();
});

module.exports = mongoose.models.WorkerTask || mongoose.model('WorkerTask', workerTaskSchema);
