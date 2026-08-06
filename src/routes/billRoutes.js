const express = require('express');
const router = express.Router();
const { protect, editorOnly } = require('../middleware/authMiddleware');
const billCtrl = require('../controllers/billController');

// --- Bills / Invoices (ModelViewSet, admin-only) ---
router
  .route('/bills')
  .get(protect, editorOnly, billCtrl.getAll)
  .post(protect, editorOnly, billCtrl.createOne);
router
  .route('/bills/:id')
  .get(protect, editorOnly, billCtrl.getOne)
  .put(protect, editorOnly, billCtrl.updateOne)
  .patch(protect, editorOnly, billCtrl.updateOne)
  .delete(protect, editorOnly, billCtrl.deleteOne);

module.exports = router;
