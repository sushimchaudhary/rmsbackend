// routes/merchantAccountRoutes.js
const express = require("express");
const router = express.Router();
const {
  upsertAccount,
  getAccounts,
  deactivateAccount,
} = require("../controllers/merchantaccountController");

const adminOrSuperUser = require("../middleware/adminOrSuperUser");

// All routes require an authenticated restaurant admin or super user.
// Tenant isolation is enforced inside the controller (assertOwnsTarget).

router.post("/", adminOrSuperUser, upsertAccount);          // create/update esewa or khalti
router.get("/", adminOrSuperUser, getAccounts);              // list this restaurant's accounts
router.get("/:restaurant_id", adminOrSuperUser, getAccounts); // super_user: list for a specific restaurant
router.patch("/:id/deactivate", adminOrSuperUser, deactivateAccount);

module.exports = router;