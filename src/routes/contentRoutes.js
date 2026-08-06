const express = require("express");
const router = express.Router();
const { makeUploader } = require("../middleware/upload");
const { protect, editorOnly, optionalAuth } = require("../middleware/authMiddleware");

const organizationCtrl = require("../controllers/organizationController");
const galleryCtrl = require("../controllers/galleryController");
const sliderCtrl = require("../controllers/sliderController");
const noticeCtrl = require("../controllers/noticeController");
const staffController = require("../controllers/staffController");

// Memory storage uploader (makeUploader() ले single() दिन्छ)
const uploader = makeUploader();

// --- Organization ---
router
  .route("/organization")
  .get(optionalAuth, organizationCtrl.getAll)
  .post(
    protect,
    editorOnly,
    uploader.single("logo"), // ✅ mapUploadedFile हटाइयो
    organizationCtrl.createOne
  );

router
  .route("/organization/:id")
  .get(optionalAuth, organizationCtrl.getOne)
  .put(
    protect,
    editorOnly,
    uploader.single("logo"),
    organizationCtrl.updateOne
  )
  .patch(
    protect,
    editorOnly,
    uploader.single("logo"),
    organizationCtrl.updateOne
  )
  .delete(protect, editorOnly, organizationCtrl.deleteOne);

// --- Gallery ---
router
  .route("/gallery")
  .get(protect, galleryCtrl.getAll)
  .post(
    protect,
    editorOnly,
    uploader.single("image"),
    galleryCtrl.createOne
  );

router
  .route("/gallery/:id")
  .get(protect, galleryCtrl.getOne)
  .put(
    protect,
    editorOnly,
    uploader.single("image"),
    galleryCtrl.updateOne
  )
  .patch(
    protect,
    editorOnly,
    uploader.single("image"),
    galleryCtrl.updateOne
  )
  .delete(protect, editorOnly, galleryCtrl.deleteOne);

// --- Staff ---
router
  .route("/staff")
  .get(protect, staffController.getAll)
  .post(
    protect,
    editorOnly,
    uploader.fields([
      { name: "image", maxCount: 1 },
      { name: "accountQrCode", maxCount: 1 }
    ]),
    staffController.createOne
  );

router
  .route("/staff/:id")
  .get(protect, staffController.getOne)
  .put(
    protect,
    editorOnly,
    uploader.fields([
      { name: "image", maxCount: 1 },
      { name: "accountQrCode", maxCount: 1 }
    ]),
    staffController.updateOne
  )
  .patch(
    protect,
    editorOnly,
    uploader.fields([
      { name: "image", maxCount: 1 },
      { name: "accountQrCode", maxCount: 1 }
    ]),
    staffController.updateOne
  )
  .delete(protect, editorOnly, staffController.deleteOne);






// --- Slider Images ---
router
  .route("/sliders")
  .get(protect, sliderCtrl.getAll)
  .post(
    protect,
    editorOnly,
    uploader.single("image"),
    sliderCtrl.createOne
  );

router
  .route("/sliders/:id")
  .get(protect, sliderCtrl.getOne)
  .put(
    protect,
    editorOnly,
    uploader.single("image"),
    sliderCtrl.updateOne
  )
  .patch(
    protect,
    editorOnly,
    uploader.single("image"),
    sliderCtrl.updateOne
  )
  .delete(protect, editorOnly, sliderCtrl.deleteOne);


// --- Notices ---
router
  .route("/notices")
  .get(protect, noticeCtrl.getAll)
  .post(
    protect,
    editorOnly,
    uploader.single("image"),
    noticeCtrl.createOne
  );

router.get("/notices/unseen-count", protect, noticeCtrl.getUnseenCount);
router.post("/notices/mark-seen", protect, noticeCtrl.markAllSeen);

router
  .route("/notices/:id/seen")
  .patch(protect, noticeCtrl.markAsSeen);

router
  .route("/notices/:id")
  .get(protect, noticeCtrl.getOne)
  .put(
    protect,
    editorOnly,
    uploader.single("image"),
    noticeCtrl.updateOne
  )
  .patch(
    protect,
    editorOnly,
    uploader.single("image"),
    noticeCtrl.updateOne
  )
  .delete(protect, editorOnly, noticeCtrl.deleteOne);



module.exports = router;