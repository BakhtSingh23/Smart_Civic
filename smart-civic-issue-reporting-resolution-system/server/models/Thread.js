const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  threadId: { type: String, unique: true },
  title: { type: String, required: true, maxLength: 150 },
  body: { type: String, required: true, maxLength: 2000 },
  category: { 
    type: String, 
    enum: ['Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'General', 'Emergency', 'Suggestion'],
    default: 'General'
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  area: String,
  city: String,
  tags: [String],
  relatedComplaint: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Complaint',
    required: false,
    set: v => (v === "" || v === undefined) ? null : v
  },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'resolved', 'archived'], default: 'active' },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

threadSchema.pre('save', async function(next) {
  if (this.isNew && !this.threadId) {
    const count = await mongoose.model('Thread').countDocuments();
    const year = new Date().getFullYear();
    this.threadId = `THR-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.models.Thread || mongoose.model('Thread', threadSchema);
