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

const superUserOnly = require("../middleware/superUserOnly");
const auth = require("../middleware/auth");

// GET all admins
router.get("/admins", superUserOnly, getAdmins);

// POST create admin
router.post("/admins", superUserOnly, createAdmin);

// PUT update admin
router.put("/admins/:id", superUserOnly, updateAdmin);

// DELETE admin
router.delete("/admins/:id", superUserOnly, deleteAdmin);

// PATCH block/unblock admin (super user only)
router.patch("/admins/:id/block", superUserOnly, toggleBlockAdmin);

// GET profile (authenticated user)
router.get("/profile", auth, getProfile);

module.exports = router;