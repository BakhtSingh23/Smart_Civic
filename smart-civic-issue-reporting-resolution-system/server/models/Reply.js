const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, maxLength: 1000 },
  parentReply: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply', default: null },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
  isOfficialResponse: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Reply || mongoose.model('Reply', replySchema);
