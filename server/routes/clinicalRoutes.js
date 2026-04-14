/**
 * MediChat Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getPatientData,
  getAIConsultation,
  getAIConsultationStream,
  getConversationHistory,
  importConversationHistory,
  deleteConversationHistory,
  getSuggestions,
  getDifferentialDiagnosis,
  getMedications,
  getLabResults
} = require('../controllers/clinicalController');

// All routes require authentication
router.use(protect);

const handleMediChatAttachments = (req, res, next) => {
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

// MediChat context endpoints
router.get('/patient-data', getPatientData);
router.get('/differential-diagnosis', getDifferentialDiagnosis);
router.get('/medications', getMedications);
router.get('/labs', getLabResults);

// MediChat conversation endpoints
router.get('/history', getConversationHistory);
router.post('/history/import', importConversationHistory);
router.delete('/history/:conversationId', deleteConversationHistory);
router.get('/suggestions', getSuggestions);
router.post('/consult', handleMediChatAttachments, getAIConsultation);
router.post('/consult-stream', handleMediChatAttachments, getAIConsultationStream);

module.exports = router;
