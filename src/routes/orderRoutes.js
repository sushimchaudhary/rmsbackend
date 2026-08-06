// const express = require('express');
// const router = express.Router();
// const { protect, editorOnly, optionalAuth } = require('../middleware/authMiddleware');
// const orderCtrl = require('../controllers/orderController');

// // --- Orders (ModelViewSet + custom @action endpoints) ---
// router
//   .route('/orders')
//   .get(optionalAuth, editorOnly, orderCtrl.getAll) // kitchen/admin dashboard
//   .post(optionalAuth, orderCtrl.createOne); // public: customer places order via QR scan

// router.get('/orders/unseen-count', protect, editorOnly, orderCtrl.getUnseenCount);
// router.post('/orders/mark-seen', protect, editorOnly, orderCtrl.markAllSeen);

// router
//   .route('/orders/:id')
//   .get(optionalAuth, orderCtrl.getOne)
//   .put(protect, editorOnly, orderCtrl.updateOne)
//   .patch(protect, editorOnly, orderCtrl.updateOne)
//   .delete(protect, editorOnly, orderCtrl.deleteOne);

// // Custom actions (mirror the @action(detail=True, ...) decorators)
// router.post('/orders/:id/accept', protect, editorOnly, orderCtrl.acceptOrder);
// router.post('/orders/:id/reject', protect, editorOnly, orderCtrl.rejectOrder); // 🟢 Added missing route
// router.post('/orders/:id/payment-choice', protect, orderCtrl.selectPaymentChoice); // customer-facing
// router.post('/orders/:id/set-status', protect, editorOnly, orderCtrl.setStatus);
// router.post('/orders/:id/append-items', protect, orderCtrl.appendItems); // customer-facing
// router.post('/orders/:id/rating', protect, orderCtrl.submitRating); // customer-facing


// module.exports = router;



const express = require('express');
const router = express.Router();
const { protect, editorOnly, optionalAuth } = require('../middleware/authMiddleware');
const orderCtrl = require('../controllers/orderController');

// --- Orders ---
router
  .route('/orders')
  .get(optionalAuth, orderCtrl.getAll) // 🟢 editorOnly हटाइयो! (Public/Customer र Admin दुवैले access गर्न मिल्ने)
  .post(optionalAuth, orderCtrl.createOne);

router.get('/orders/unseen-count', protect, editorOnly, orderCtrl.getUnseenCount);
router.post('/orders/mark-seen', protect, editorOnly, orderCtrl.markAllSeen);

router
  .route('/orders/:id')
  .get(optionalAuth, orderCtrl.getOne)
  .put(protect, editorOnly, orderCtrl.updateOne)
  .patch(protect, editorOnly, orderCtrl.updateOne)
  .delete(protect, editorOnly, orderCtrl.deleteOne);

// Custom actions
router.post('/orders/:id/accept', protect, editorOnly, orderCtrl.acceptOrder);
router.post('/orders/:id/reject', protect, editorOnly, orderCtrl.rejectOrder);
router.post('/orders/:id/payment-choice', optionalAuth, orderCtrl.selectPaymentChoice); 
router.post('/orders/:id/set-status', protect, editorOnly, orderCtrl.setStatus);
router.post('/orders/:id/append-items', optionalAuth, orderCtrl.appendItems); 
router.post('/orders/:id/rating', optionalAuth, orderCtrl.submitRating); 
router.post('/orders/:id/payment-success', optionalAuth, orderCtrl.handlePaymentSuccess); 
module.exports = router;