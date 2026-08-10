// const express = require("express");
// const router = express.Router();
// const {
//   createRestaurant,
//   getRestaurants,
//   getRestaurantById,
//   updateRestaurant,
//   deleteRestaurant,
// } = require("../controllers/restaurantController");
// const superUserOnly = require("../middleware/superUserOnly");

// // 1. Import the function correctly using destructuring
// const { makeUploader } = require("../middleware/upload");

// // 2. Initialize the upload instance
// const upload = makeUploader('logo');

// // Now you can use upload.single("logo")
// router.post("/", superUserOnly, upload.single("logo"), createRestaurant);

// router.get("/", superUserOnly, getRestaurants);
// router.get("/:id", superUserOnly, getRestaurantById);

// // This will now work correctly because upload is the multer instance
// router.patch("/:id", superUserOnly, upload.single("logo"), updateRestaurant);

// // DELETE
// router.delete("/:id", superUserOnly, deleteRestaurant);

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");

const adminOrSuperUser = require("../middleware/adminOrSuperUser");
const { makeUploader } = require("../middleware/upload");

const upload = makeUploader('logo');

// POST (Controlled inside controller: only Super User actually creates)
router.post("/", adminOrSuperUser, upload.single("logo"), createRestaurant);

// GET (Super user sees all, Admin sees only their assigned restaurant)
router.get("/", adminOrSuperUser, getRestaurants);
router.get("/:id", adminOrSuperUser, getRestaurantById);

// PATCH (Admin can update their assigned restaurant, Super user can update any)
router.patch("/:id", adminOrSuperUser, upload.single("logo"), updateRestaurant);

// DELETE (Controlled inside controller: only Super User can delete)
router.delete("/:id", adminOrSuperUser, deleteRestaurant);

module.exports = router;