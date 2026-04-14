const triageService = require('../services/triageService');

const getFollowUpQuestions = async (req, res, next) => {
  try {
    const result = await triageService.getFollowUpQuestions(req.user.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const submitSymptoms = async (req, res, next) => {
  try {
    // Prepare submission data with optional files
    const submissionData = {
      symptoms: req.body.symptoms,
      duration: req.body.duration,
      severity: req.body.severity,
      followUpResponses: req.body.followUpResponses || [],
      images: req.files || [] // Array of uploaded files from multer
    };
    
    const result = await triageService.processSubmission(req.user.id, submissionData);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await triageService.getUserHistory(req.user.id);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFollowUpQuestions,
  submitSymptoms,
  getHistory
};
