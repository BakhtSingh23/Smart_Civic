const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in environment');
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(mongoUri);
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection failed:', err.message || err);
    throw err;
  }
};
