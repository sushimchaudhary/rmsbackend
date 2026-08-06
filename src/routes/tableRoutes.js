const express = require('express');
const router = express.Router();
const { protect, editorOnly, optionalAuth } = require('../middleware/authMiddleware');
const tableCtrl = require('../controllers/tableController');

// --- Restaurant Tables (ModelViewSet -> full CRUD, auto-generates QR code) ---
router
  .route('/tables')
  .get(optionalAuth, tableCtrl.getAll)
  .post(protect, editorOnly, tableCtrl.createOne);
router
  .route('/tables/:id')
  .get(optionalAuth, tableCtrl.getOne)
  .put(protect, editorOnly, tableCtrl.updateOne)
  .patch(protect, editorOnly, tableCtrl.updateOne)
  .delete(protect, editorOnly, tableCtrl.deleteOne);

module.exports = router;
