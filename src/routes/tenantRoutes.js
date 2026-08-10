const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
// const { verifyToken } = require("../middleware/authMiddleware"); // तपाईंको Auth Middleware

// Public Route: नयाँ ओनरले स्वतः Restaurant, Branch, Admin User दर्ता गर्न पाउने
router.post("/register", tenantController.registerTenant);

// Protected Route: Subscription र Trial को बाँकी दिनहरू हेर्न
// router.get("/subscription-status", verifyToken, tenantController.getSubscriptionStatus);

module.exports = router;