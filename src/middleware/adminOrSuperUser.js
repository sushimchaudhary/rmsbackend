const jwt = require("jsonwebtoken");
const { prisma } = require("../config/dbConnect");

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
  is_blocked: true,
};

const adminOrSuperUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ response: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId || decoded.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectFields,
    });

    if (!user) {
      return res.status(401).json({ response: "User not found" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ response: "Account is blocked" });
    }

    // Role, super_user or is_admin Check
    const isSuper = user.super_user || user.role === "super_admin";
    const isAdmin = user.is_admin || user.role === "admin";

    if (!isSuper && !isAdmin) {
      return res.status(403).json({ response: "Access denied" });
    }

    req.user = {
      ...user,
      super_user: isSuper, // Normalizing flag for controllers
    };

    if (req.user && !req.user.branch) {
      req.user.branch = req.user.branch_id;
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ response: "Authentication failed" });
  }
};

module.exports = adminOrSuperUser;