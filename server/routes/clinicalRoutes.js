/**
 * Clinical Decision Support Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getPatientData,
  getAIConsultation,
  getAIConsultationStream,
  getSuggestions,
  getDifferentialDiagnosis,
  getMedications,
  getLabResults
} = require('../controllers/clinicalController');

// All routes require authentication
router.use(protect);

// Clinical data endpoints
router.get('/patient-data', getPatientData);
router.get('/differential-diagnosis', getDifferentialDiagnosis);
router.get('/medications', getMedications);
router.get('/labs', getLabResults);

// AI consultation endpoints
router.get('/suggestions', getSuggestions);
router.post('/consult', getAIConsultation);
router.post('/consult-stream', getAIConsultationStream);

module.exports = router;
