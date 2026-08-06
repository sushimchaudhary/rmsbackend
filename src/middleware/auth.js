const jwt = require("jsonwebtoken");
const { prisma } = require("../config/dbConnect");

// User fields selection (Excluding password & schema-compliant)
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

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ response: "Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both decoded.userId and decoded.id
    const userId = decoded.userId || decoded.id;

    // Prisma User Lookup (excluding password)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectFields,
    });

    if (!user) {
      return res.status(401).json({ response: "User not found" });
    }

    req.user = user;

    // Backward compatibility for req.user.branch & req.user.restaurant
    if (req.user) {
      if (!req.user.branch) req.user.branch = req.user.branch_id;
      if (!req.user.restaurant) req.user.restaurant = req.user.restaurant_id;
    }

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(401).json({ response: "Invalid token" });
  }
};

module.exports = auth;