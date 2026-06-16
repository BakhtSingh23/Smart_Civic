const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-civic-issue')
  .then(async () => {
    const counts = await Complaint.aggregate([
      { $match: { complaintId: /CMP-2026-\d+-\d+/ } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log(counts);
    mongoose.disconnect();
  })
  .catch(console.error);
