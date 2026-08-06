const express = require("express");
const router = express.Router();
const {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");
const superUserOnly = require("../middleware/superUserOnly");

// 1. Import the function correctly using destructuring
const { makeUploader } = require("../middleware/upload");

// 2. Initialize the upload instance
const upload = makeUploader('logo');

// Now you can use upload.single("logo")
router.post("/", superUserOnly, upload.single("logo"), createRestaurant);

router.get("/", superUserOnly, getRestaurants);
router.get("/:id", superUserOnly, getRestaurantById);

// This will now work correctly because upload is the multer instance
router.patch("/:id", superUserOnly, upload.single("logo"), updateRestaurant);

// DELETE
router.delete("/:id", superUserOnly, deleteRestaurant);

module.exports = router;