const express = require('express');
const { protect, medicalProfessional } = require('../middlewares/authMiddleware');
const { getMedicWorkspace } = require('../controllers/medicController');

const router = express.Router();

router.use(protect, medicalProfessional);

router.get('/workspace', getMedicWorkspace);

module.exports = router;
