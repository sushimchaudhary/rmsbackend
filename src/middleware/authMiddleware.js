const jwt = require('jsonwebtoken');
const { prisma } = require('../config/dbConnect');

// User fields selection (Strictly matched with your Prisma User Model)
const userSelectFields = {
  id: true,
  username: true,
  first_name: true,
  last_name: true,
  email: true,
  role: true,
  is_admin: true,
  is_staff: true,
  super_user: true,
  restaurant_id: true,
  branch_id: true,
  createdAt: true,
  updatedAt: true,
};

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.userId || decoded.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: userSelectFields,
      });

      if (!user) {
        return res.status(401).json({ error: 'User no longer exists.' });
      }

      req.user = user;

      // Compatibility flags (Derived values to prevent crashes elsewhere)
      if (req.user) {
        if (!req.user.branch) req.user.branch = req.user.branch_id;
        if (!req.user.restaurant) req.user.restaurant = req.user.restaurant_id;
        
        // schema मा is_editor नभएकोले role/is_admin अनुसार automatic evaluate गरिदिने:
        req.user.is_editor = 
          req.user.is_admin || 
          req.user.super_user || 
          ['admin', 'superadmin', 'editor'].includes(req.user.role);
      }

      return next();
    } catch (err) {
      console.error("JWT Error:", err.message);
      return res.status(401).json({ error: 'Not authorized, token invalid or expired.' });
    }
  }

  return res.status(401).json({ error: 'Not authorized, no token provided.' });
};



// 🟢 Optional Auth: serve BOTH public customers and logged-in staff.
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: userSelectFields,
      });

      if (user) {
        req.user = user;
        if (!req.user.branch) req.user.branch = req.user.branch_id;
        if (!req.user.restaurant) req.user.restaurant = req.user.restaurant_id;
      }
    } catch (err) {
      // Invalid/expired token on a public route — ignore error, treat as anonymous
      console.warn("optionalAuth: ignoring invalid token:", err.message);
    }
  }

  return next();
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authorized.' });
  }

  const isAdmin =
    req.user.is_admin ||
    req.user.super_user ||
    req.user.role === 'superadmin' ||
    req.user.role === 'admin';

  if (isAdmin) return next();
  return res.status(403).json({ error: 'Admin access required.' });
};

const editorOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authorized.' });
  }

  const isEditor =
    req.user.is_editor ||
    req.user.is_admin ||
    req.user.is_staff ||
    req.user.super_user ||
    ['superadmin', 'admin', 'editor'].includes(req.user.role);

  if (isEditor) return next();
  return res.status(403).json({ error: 'Editor access required.' });
};

module.exports = { protect, adminOnly, editorOnly, optionalAuth };