const express = require('express');
const { initiateEsewa, esewaPayment, esewaFailure } = require('../controllers/paymentController');
const router = express.Router();

router.post('/initiate-esewa', initiateEsewa);

// 2. eSewa Verification Callbacks
router.all('/esewa-success', esewaPayment);
router.all('/esewa-failure', esewaFailure);

module.exports = router;