const express = require('express');
const { adminDashboard, userDashboard } = require('../controllers/dashboardController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', authenticate, requireAdmin, adminDashboard);
router.get('/user', authenticate, userDashboard);

module.exports = router;
