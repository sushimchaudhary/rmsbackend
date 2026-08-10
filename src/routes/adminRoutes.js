// const express = require("express");
// const router = express.Router();
// const {
//   createAdmin,
//   getAdmins,
//   deleteAdmin,
//   updateAdmin,
//   getProfile,
//   toggleBlockAdmin,
// } = require("../controllers/adminController");

// const superUserOnly = require("../middleware/superUserOnly");
// const auth = require("../middleware/auth");

// // GET all admins
// router.get("/admins", superUserOnly, getAdmins);

// // POST create admin
// router.post("/admins", superUserOnly, createAdmin);

// // PUT update admin
// router.put("/admins/:id", superUserOnly, updateAdmin);

// // DELETE admin
// router.delete("/admins/:id", superUserOnly, deleteAdmin);

// // PATCH block/unblock admin (super user only)
// router.patch("/admins/:id/block", superUserOnly, toggleBlockAdmin);

// // GET profile (authenticated user)
// router.get("/profile", auth, getProfile);

// module.exports = router;


const express = require("express");
const router = express.Router();
const {
  createAdmin,
  getAdmins,
  deleteAdmin,
  updateAdmin,
  getProfile,
  toggleBlockAdmin,
} = require("../controllers/adminController");

const adminOrSuperUser = require("../middleware/adminOrSuperUser");
const auth = require("../middleware/auth");

// GET profile (authenticated user)
router.get("/profile", auth, getProfile);

// Admin Routes (Accessible by both Super User & Regular Admin, filtered by restaurant_id)
router.get("/admins", adminOrSuperUser, getAdmins);
router.post("/admins", adminOrSuperUser, createAdmin);
router.put("/admins/:id", adminOrSuperUser, updateAdmin);
router.delete("/admins/:id", adminOrSuperUser, deleteAdmin);
router.patch("/admins/:id/block", adminOrSuperUser, toggleBlockAdmin);

module.exports = router;