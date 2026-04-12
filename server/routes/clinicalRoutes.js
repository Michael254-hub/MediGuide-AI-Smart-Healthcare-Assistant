/**
 * MediGuide AI Routes
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

const handleMediGuideAttachments = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    return next();
  }

  const upload = req.app.locals.aiUpload;
  upload.array('attachments', 4)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Clinical data endpoints
router.get('/patient-data', getPatientData);
router.get('/differential-diagnosis', getDifferentialDiagnosis);
router.get('/medications', getMedications);
router.get('/labs', getLabResults);

// AI consultation endpoints
router.get('/suggestions', getSuggestions);
router.post('/consult', handleMediGuideAttachments, getAIConsultation);
router.post('/consult-stream', handleMediGuideAttachments, getAIConsultationStream);

module.exports = router;
