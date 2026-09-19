const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All admin routes require Admin role
router.use(verifyToken, authorizeRoles('Admin'));

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/projects', adminController.getAllProjects);
router.get('/applications', adminController.getAllApplications);
router.delete('/applications/:id', adminController.deleteApplication);

module.exports = router;

