const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOrSuperUser = require("../middleware/adminOrSuperUser");
const superUserOnly = require("../middleware/superUserOnly");

const {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getBranchSubscription,
  assignBranchSubscription,
  initiateEsewaSubscription,
  initiateKhaltiSubscription,
  verifyAndPurchaseSubscription,
  seedDefaultPlans,
  getAllSubscriptions,
  extendSubscription,
  getPaymentHistory,
} = require("../controllers/subscriptionController");

// Plan routes
router.get("/plans", getSubscriptionPlans);
router.post("/plans", auth, superUserOnly, createSubscriptionPlan);
router.patch("/plans/:id", auth, superUserOnly, updateSubscriptionPlan);
router.post("/seed-plans", auth, superUserOnly, seedDefaultPlans);

// Branch subscription & manual purchase routes
router.get("/branch/:branch_id", auth, adminOrSuperUser, getBranchSubscription);
router.post("/assign", auth, adminOrSuperUser, assignBranchSubscription);
router.post("/purchase", auth, verifyAndPurchaseSubscription);

// Payment Gateway Initiation Routes (Fixes 404 Error)
router.post("/initiate-esewa", auth, adminOrSuperUser, initiateEsewaSubscription);
router.post("/initiate-khalti", auth, adminOrSuperUser, initiateKhaltiSubscription);

// Admin oversight + billing routes
router.get("/", auth, superUserOnly, getAllSubscriptions);
router.post("/extend", auth, superUserOnly, extendSubscription);
router.get("/history/:restaurant_id", auth, adminOrSuperUser, getPaymentHistory);

module.exports = router;