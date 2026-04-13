const { z } = require('zod');
const { APPLICATION_ROLE_OPTIONS } = require('../services/medicalProfessionalApplicationService');

const currentYear = new Date().getUTCFullYear();
const roleEnum = z.enum(APPLICATION_ROLE_OPTIONS);
const dedupeArray = (values) => [...new Set(values)];

const requiredText = (label, minimum = 2, maximum = 255) =>
  z
    .string()
    .trim()
    .min(minimum, `${label} is required`)
    .max(maximum, `${label} must be ${maximum} characters or fewer`);

const optionalText = (maximum = 255) =>
  z
    .string()
    .trim()
    .max(maximum, `Must be ${maximum} characters or fewer`)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || null);

const dateString = (label) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be in YYYY-MM-DD format`);

const stringListSchema = (label, maxItems) =>
  z
    .array(requiredText(label, 2, 500))
    .max(maxItems, `You can add up to ${maxItems} ${label.toLowerCase()} entries`)
    .transform((values) => dedupeArray(values.map((value) => value.trim()).filter(Boolean)));

const submitMedicalProfessionalApplicationSchema = z.object({
  desiredRole: roleEnum,
  licenseNumber: requiredText('License number', 3, 120),
  licensingAuthority: requiredText('Licensing authority', 2, 255),
  licenseJurisdiction: requiredText('License jurisdiction', 2, 120),
  licenseExpiryDate: dateString('License expiry date'),
  educationInstitution: requiredText('Education institution', 2, 255),
  educationQualification: requiredText('Education qualification', 2, 255),
  educationGraduationYear: z.coerce
    .number()
    .int()
    .min(1950, 'Graduation year must be 1950 or later')
    .max(currentYear + 1, `Graduation year cannot be later than ${currentYear + 1}`),
  yearsOfExperience: z.coerce
    .number()
    .int()
    .min(0, 'Years of experience cannot be negative')
    .max(60, 'Years of experience must be 60 or fewer'),
  currentEmployer: optionalText(255),
  workExperienceSummary: requiredText('Work experience summary', 40, 5000),
  specialties: stringListSchema('Specialty', 10).refine(
    (values) => values.length > 0,
    'At least one specialty is required'
  ),
  supportingDocuments: stringListSchema('Supporting document', 6).optional().default([]),
  professionalStatement: optionalText(2000),
});

const reviewMedicalProfessionalApplicationSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    reviewerNotes: optionalText(2000),
    approvedRole: roleEnum.optional(),
  })
  .superRefine((value, context) => {
    if (value.status === 'rejected' && (!value.reviewerNotes || value.reviewerNotes.length < 10)) {
      context.addIssue({
        code: 'custom',
        path: ['reviewerNotes'],
        message: 'Please include at least 10 characters explaining why the application was rejected',
      });
    }
  });

module.exports = {
  submitMedicalProfessionalApplicationSchema,
  reviewMedicalProfessionalApplicationSchema,
};
