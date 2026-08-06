const express = require('express');
const router = express.Router();

// This file plays the role of `apps/urls.py`, mounted at /api/apps
// (mirrors path('api/apps/', include('apps.urls')) in the root urls.py).
router.use('/', require('./authRoutes'));
router.use('/', require('./menuRoutes'));
router.use('/', require('./categoryRoutes'));
router.use('/', require('./tableRoutes'));
router.use('/', require('./orderRoutes'));
router.use('/', require('./billRoutes'));
router.use('/', require('./contentRoutes'));



module.exports = router;
