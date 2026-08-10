const express = require("express");
const router = express.Router();
const { checkSubscriptionStatus } = require("../middleware/checkSubscription");
const { protect } = require("../middleware/authMiddleware"); // 👈 verifyToken को सट्टा protect प्रयोग गर्नुहोस्

// Protected Dashboard API Endpoint
router.get("/dashboard-data", protect, checkSubscriptionStatus, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Welcome to Dashboard! Your subscription is active.",
      user: req.user,
    });
  } catch (err) {
    console.error("DASHBOARD DATA ERROR:", err);
    res.status(500).json({ response: "Failed to load dashboard data." });
  }
});

module.exports = router;