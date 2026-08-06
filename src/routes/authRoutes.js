const express = require("express");
const { login, changePassword, forgotPassword, resetPassword } = require("../controllers/authController");
const { protectAdmin } = require("../middleware/auth");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", auth, changePassword);



module.exports = router;
