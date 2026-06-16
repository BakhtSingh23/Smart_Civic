const mongoose = require('mongoose');

const incidentGroupSchema = new mongoose.Schema({
  incidentId: { type: String, unique: true },
  primaryComplaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  linkedComplaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
  linkedCitizens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  category: String,
  location: {
    coordinates: [Number],
    address: String,
  },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  totalReporters: { type: Number, default: 1 },
  department: String,
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

incidentGroupSchema.pre('save', async function (next) {
  if (this.incidentId) return next();

  const year = new Date().getFullYear();
  let unique = false;

  while (!unique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = `INC-${year}-${randomNum}`;
    const exists = await mongoose.models.IncidentGroup.exists({ incidentId: candidate });
    if (!exists) {
      this.incidentId = candidate;
      unique = true;
    }
  }

  next();
});

module.exports = mongoose.models.IncidentGroup || mongoose.model('IncidentGroup', incidentGroupSchema);
