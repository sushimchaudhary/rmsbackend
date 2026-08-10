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
  verifyAndPurchaseSubscription,
  seedDefaultPlans,
  getAllSubscriptions,      // new
  extendSubscription,       // new
  getPaymentHistory,        // new
} = require("../controllers/subscriptionController");

router.get("/plans", getSubscriptionPlans);
router.post("/plans", auth, superUserOnly, createSubscriptionPlan);
router.patch("/plans/:id", auth, superUserOnly, updateSubscriptionPlan);
router.post("/seed-plans", auth, superUserOnly, seedDefaultPlans);

router.get("/branch/:branch_id", auth, adminOrSuperUser, getBranchSubscription);
router.post("/assign", auth, adminOrSuperUser, assignBranchSubscription);
router.post("/purchase", auth, verifyAndPurchaseSubscription);

// New — admin oversight + billing
router.get("/", auth, superUserOnly, getAllSubscriptions);
router.post("/extend", auth, superUserOnly, extendSubscription);
router.get("/history/:restaurant_id", auth, adminOrSuperUser, getPaymentHistory);

module.exports = router;