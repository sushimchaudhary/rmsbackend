const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

// NO AUTH MIDDLEWARE HERE
router.get("/stats", publicController.getPublicStats);

module.exports = router;