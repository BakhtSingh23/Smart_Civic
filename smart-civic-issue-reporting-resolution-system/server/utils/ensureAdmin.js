const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const normalized = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalized });
  if (existing) return;

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name: 'Central Admin',
    email: normalized,
    phone: '9999999999',
    password: hashed,
    address: 'Admin Office',
    city: 'Smart City',
    pincode: '000000',
    role: 'admin',
    department: null,
  });
  // eslint-disable-next-line no-console
  console.log(`Seeded admin user: ${normalized}`);
};
