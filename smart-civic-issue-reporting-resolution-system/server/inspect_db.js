const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-civic-issue')
  .then(async () => {
    const ids = ['CMP-2026-863840-909', 'CMP-2026-126887-317', 'CMP-2026-3041', 'CMP-2026-8133'];
    const docs = await Complaint.find({ complaintId: { $in: ids } });
    docs.forEach(d => console.log(d.complaintId, d.createdAt, d.isDuplicate));
    mongoose.disconnect();
  })
  .catch(console.error);
