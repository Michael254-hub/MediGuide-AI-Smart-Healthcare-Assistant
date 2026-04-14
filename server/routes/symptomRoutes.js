const express = require('express');
const { getFollowUpQuestions, submitSymptoms, getHistory } = require('../controllers/symptomController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { followUpQuestionSchema, submitSymptomSchema } = require('../validations/symptomValidation');

const router = express.Router();

// Handle POST with optional file uploads
router.post('/follow-up-questions', protect, validate(followUpQuestionSchema), getFollowUpQuestions);
router.post('/', protect, (req, res, next) => {
  const upload = req.app.locals.upload;
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, validate(submitSymptomSchema), submitSymptoms);
router.get('/history', protect, getHistory);

module.exports = router;
