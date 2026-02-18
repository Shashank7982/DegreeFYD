const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

router.get('/stats', authenticate, isAdmin, dashboardController.getDashboardStats);

module.exports = router;
