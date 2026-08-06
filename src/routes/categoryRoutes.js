const express = require('express');
const router = express.Router();
const { protect, editorOnly, optionalAuth } = require('../middleware/authMiddleware');
const categoryCtrl = require('../controllers/categoryController');

// --- Categories (ModelViewSet -> full CRUD) ---
router
  .route('/categories')
  .get(optionalAuth, categoryCtrl.getAll)
  .post(protect, editorOnly, categoryCtrl.createOne);
router
  .route('/categories/:id')
  .get(optionalAuth, categoryCtrl.getOne)
  .put(protect, editorOnly, categoryCtrl.updateOne)
  .patch(protect, editorOnly, categoryCtrl.updateOne)
  .delete(protect, editorOnly, categoryCtrl.deleteOne);

module.exports = router;
