const jwt = require("jsonwebtoken");
const { prisma } = require("../config/dbConnect");

// Password र unnecessary fields बाहेकका आवश्यक Schema fields हरू
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

module.exports = async (req, res, next) => {
  try {
    // 1. Authorization header बाट Token लिने
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ response: "Token missing" });
    }

    const token = authHeader.split(" ")[1];

    // 2. Token Verify गर्ने
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.userId वा decoded.id दुवैलाई handle गर्ने
    const userId = decoded.userId || decoded.id;

    // 3. MongoDB 'User.findById' को सट्टा Prisma 'findUnique' प्रयोग गरिएको
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectFields,
    });

    // 4. User नभेटिएमा वा super_user नभएमा Block गर्ने
    if (!user || !user.super_user) {
      return res.status(403).json({ response: "Super user access only" });
    }

    // 5. Blocked User Check
    if (user.is_blocked) {
      return res.status(403).json({ response: "Account is blocked" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("SuperUser Middleware Error:", err.message);
    return res.status(401).json({ response: "Authentication failed" });
  }
};