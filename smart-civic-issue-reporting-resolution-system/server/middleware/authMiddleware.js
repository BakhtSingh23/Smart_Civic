const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message, data: {} });

async function protect(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return sendError(res, 401, 'Not authorized, token missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 401, 'Not authorized');
    }
    req.user = user;
    return next();
  } catch (err) {
    return sendError(res, 401, 'Not authorized, token invalid');
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'Forbidden');
    }
    return next();
  };
}

module.exports = { protect, authorizeRoles };
