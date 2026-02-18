const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', collegeController.getColleges);
router.get('/:slug', collegeController.getCollegeBySlug);

// Admin routes (protected)
router.get('/admin/all', authenticate, isAdmin, collegeController.getAllCollegesAdmin);
router.get('/admin/:id', authenticate, collegeController.getCollegeById);
router.post('/', authenticate, isAdmin, collegeController.createCollege);
router.put('/:id', authenticate, isAdmin, collegeController.updateCollege);
router.delete('/:id', authenticate, isAdmin, collegeController.deleteCollege);
router.patch('/:id/status', authenticate, isAdmin, collegeController.toggleCollegeStatus);

module.exports = router;
