/**
 * Role-gating middleware factory.
 * Usage: router.get('/route', auth, requireRole('admin', 'super_admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden – insufficient role' });
  }
  next();
};

module.exports = requireRole;
