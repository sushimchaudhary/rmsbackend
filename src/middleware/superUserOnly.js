const jwt = require("jsonwebtoken");
const { prisma } = require("../config/dbConnect");

// Schema मा भएका सही user fields मात्र छानिएका छन्
const userSelectFields = {
  id: true,
  username: true,
  first_name: true,
  last_name: true,
  email: true,
  is_admin: true,
  is_staff: true,
  super_user: true,
  restaurant_id: true,
  branch_id: true,
  is_blocked: true,
};

const superUserOnly = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ response: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both decoded.userId and decoded.id
    const userId = decoded.userId || decoded.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectFields,
    });

    if (!user) {
      return res.status(401).json({ response: "User not found" });
    }

    if (!user.super_user) {
      return res.status(403).json({ response: "Super user access only" });
    }

    req.user = user;

    // Backward compatibility for req.user.branch
    if (req.user && !req.user.branch) {
      req.user.branch = req.user.branch_id;
    }

    next();
  } catch (error) {
    console.error("SuperUser Middleware Error:", error.message);
    return res.status(401).json({ response: "Authentication failed" });
  }
};

module.exports = superUserOnly;