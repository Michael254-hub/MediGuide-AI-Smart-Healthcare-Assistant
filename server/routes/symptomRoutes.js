const express = require('express');
const { submitSymptoms, getHistory } = require('../controllers/symptomController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { submitSymptomSchema } = require('../validations/symptomValidation');

const router = express.Router();

router.post('/', protect, validate(submitSymptomSchema), submitSymptoms);
router.get('/history', protect, getHistory);

module.exports = router;
