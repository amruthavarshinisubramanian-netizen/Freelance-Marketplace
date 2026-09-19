const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', optionalAuth, projectController.getAllProjects);
router.get('/client/my', verifyToken, authorizeRoles('Client'), projectController.getClientProjects);
router.get('/:id', optionalAuth, projectController.getProjectById);
router.post('/', verifyToken, authorizeRoles('Client'), projectController.createProject);
router.put('/:id', verifyToken, authorizeRoles('Client', 'Admin'), projectController.updateProject);
router.delete('/:id', verifyToken, authorizeRoles('Client', 'Admin'), projectController.deleteProject);

module.exports = router;

