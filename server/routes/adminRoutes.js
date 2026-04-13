const express = require('express');
const {
  getDashboardStats,
  getAllSubmissions,
  getProfessionalApplications,
  reviewProfessionalApplication,
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const {
  reviewMedicalProfessionalApplicationSchema,
} = require('../validations/medicalProfessionalApplicationValidation');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/submissions', getAllSubmissions);
router.get('/professional-applications', getProfessionalApplications);
router.patch(
  '/professional-applications/:applicationId',
  validate(reviewMedicalProfessionalApplicationSchema),
  reviewProfessionalApplication
);

module.exports = router;
