const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-civic-issue')
  .then(async () => {
    const user = await User.findOne({ role: 'admin' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    try {
      const res = await axios.get('http://localhost:5000/api/admin/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Total:', res.data.total);
      console.log('Count returned:', res.data.complaints.length);
    } catch(err) {
      console.error(err.message);
    }
    mongoose.disconnect();
  })
  .catch(console.error);
