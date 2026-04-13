const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const {
  getMyApplication,
  submitMyApplication,
} = require('../controllers/medicalProfessionalApplicationController');
const {
  submitMedicalProfessionalApplicationSchema,
} = require('../validations/medicalProfessionalApplicationValidation');

const router = express.Router();

router.use(protect);

router.get('/me', getMyApplication);
router.post('/', validate(submitMedicalProfessionalApplicationSchema), submitMyApplication);

module.exports = router;
