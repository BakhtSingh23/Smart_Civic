function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      res.status(403);
      return next(new Error('Forbidden'));
    }
    return next();
  };
}

module.exports = { requireRole };
