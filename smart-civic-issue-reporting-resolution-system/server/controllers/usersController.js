const User = require('../models/User');

async function getMe(req, res) {
  res.json({ user: req.user });
}

async function listUsers(req, res, next) {
  try {
    const { role, department } = req.query;
    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, listUsers };
