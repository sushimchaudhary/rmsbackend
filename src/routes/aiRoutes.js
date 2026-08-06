const express = require('express');
const router = express.Router();
const { getDashboardAIInsight } = require('../controllers/aiController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Auth and Protect middleware pass garera matra call hune
router.get('/sales-insight', protect, adminOnly, getDashboardAIInsight);

module.exports = router;