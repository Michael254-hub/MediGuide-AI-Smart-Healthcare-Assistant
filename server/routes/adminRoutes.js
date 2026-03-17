const express = require('express');
const { getDashboardStats, getAllSubmissions } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/submissions', getAllSubmissions);

module.exports = router;
