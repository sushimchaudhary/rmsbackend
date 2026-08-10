// const express = require("express");
// const router = express.Router();

// const {
//   createBranch,
//   getBranches,
//   updateBranch,
//   deleteBranch,
// } = require("../controllers/branchController");


// const superUserOnly = require("../middleware/superUserOnly");

// // Super user only routes
// router.post("/", superUserOnly, createBranch);
// router.get("/", superUserOnly, getBranches);
// router.patch("/:id", superUserOnly, updateBranch);
// router.delete("/:id", superUserOnly, deleteBranch);

// module.exports = router;


const express = require("express");
const router = express.Router();
const {
  createBranch,
  getBranches,
  updateBranch,
  deleteBranch,
} = require("../controllers/branchController");

const adminOrSuperUser = require("../middleware/adminOrSuperUser");

router.post("/", adminOrSuperUser, createBranch);
router.get("/", adminOrSuperUser, getBranches);
router.patch("/:id", adminOrSuperUser, updateBranch);
router.delete("/:id", adminOrSuperUser, deleteBranch);

module.exports = router;