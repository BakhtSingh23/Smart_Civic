const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-civic-issue')
  .then(async () => {
    try {
      const complaints = await Complaint.find({ complaintId: /CMP-2026-\d+-\d+/ });
      let bulkOps = [];
      for (const c of complaints) {
        if (!c.assignedDepartment || c.assignedDepartment !== c.category) {
          bulkOps.push({
            updateOne: {
              filter: { _id: c._id },
              update: { $set: { assignedDepartment: c.category } }
            }
          });
        }
      }
      if (bulkOps.length > 0) {
        const result = await Complaint.bulkWrite(bulkOps);
        console.log('Bulk updated:', result.modifiedCount);
      } else {
        console.log('No records needed updating');
      }
    } catch(err) {
      console.error(err);
    }
    mongoose.disconnect();
  })
  .catch(console.error);
