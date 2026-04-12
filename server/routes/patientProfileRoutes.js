const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const {
  getPatientProfile,
  savePatientProfile,
  getDeidentifiedPatientProfile,
} = require('../controllers/patientProfileController');
const { patientProfileSchema } = require('../validations/patientProfileValidation');

const router = express.Router();

router.use(protect);

router.get('/', getPatientProfile);
router.get('/de-identified', getDeidentifiedPatientProfile);
router.put('/', validate(patientProfileSchema), savePatientProfile);

module.exports = router;
