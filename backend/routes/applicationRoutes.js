const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', verifyToken, authorizeRoles('Freelancer'), applicationController.applyForProject);
router.get('/my', verifyToken, authorizeRoles('Freelancer'), applicationController.getMyApplications);
router.get('/client', verifyToken, authorizeRoles('Client'), applicationController.getClientApplications);
router.put('/:id/status', verifyToken, authorizeRoles('Client', 'Admin'), applicationController.updateApplicationStatus);

module.exports = router;

