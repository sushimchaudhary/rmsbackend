const express = require('express');
const router = express.Router();
const { protect, editorOnly, optionalAuth } = require('../middleware/authMiddleware');
const menuItemCtrl = require('../controllers/menuItemController');
const { makeUploader } = require('../middleware/upload');

const uploadMenuImage = makeUploader('menu_images');

// --- Menu Items (ModelViewSet -> full CRUD, multipart with `portions` JSON) ---
router
  .route('/menu')
  .get(optionalAuth, menuItemCtrl.getAll)
  .post(protect, editorOnly, uploadMenuImage.single('image'), menuItemCtrl.createOne);
router
  .route('/menu/:id')
  .get(optionalAuth, menuItemCtrl.getOne)
  .put(protect, editorOnly, uploadMenuImage.single('image'), menuItemCtrl.updateOne)
  .patch(protect, editorOnly, uploadMenuImage.single('image'), menuItemCtrl.updateOne)
  .delete(protect, editorOnly, menuItemCtrl.deleteOne);

module.exports = router;
