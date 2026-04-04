const triageService = require('../services/triageService');

const submitSymptoms = async (req, res, next) => {
  try {
    const result = await triageService.processSubmission(req.user.id, req.body);
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
  submitSymptoms,
  getHistory
};
