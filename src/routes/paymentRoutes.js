// const express = require('express');
// const { initiateEsewa, esewaPayment, esewaFailure } = require('../controllers/paymentController');
// const router = express.Router();

// router.post('/initiate-esewa', initiateEsewa);

// // 2. eSewa Verification Callbacks
// router.all('/esewa-success', esewaPayment);
// router.all('/esewa-failure', esewaFailure);

// module.exports = router;

const express = require('express');
const {
  initiateEsewa,
  esewaPayment,
  esewaFailure,
  initiateKhalti,
  khaltiPayment,
} = require('../controllers/paymentController');
const router = express.Router();

// eSewa
router.post('/initiate-esewa', initiateEsewa);
router.all('/esewa-success', esewaPayment);

router.all('/esewa-failure', esewaFailure);

// Khalti
router.post('/initiate-khalti', initiateKhalti);
router.all('/khalti-success', khaltiPayment);

module.exports = router;