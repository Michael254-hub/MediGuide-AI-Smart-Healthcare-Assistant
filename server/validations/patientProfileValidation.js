const { z } = require('zod');
const { PROVENANCE_SOURCES } = require('../utils/patientProfileConstants');

const provenanceSourceSchema = z.enum(PROVENANCE_SOURCES);

const optionalTrimmedString = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value.trim() : undefined));

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => !value || !Number.isNaN(Date.parse(value)),
    { message: 'Please provide a valid date' }
  );

const optionalDateTimeSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => !value || !Number.isNaN(Date.parse(value)),
    { message: 'Please provide a valid timestamp' }
  );

const demographicsSchema = z.object({
  age: z.coerce.number().int().min(0).max(120),
  sexAtBirth: z.enum(['male', 'female', 'intersex', 'unknown']),
  genderIdentity: z.string().trim().min(1, 'Gender identity is required').max(100),
  dataSource: provenanceSourceSchema.default('patient-reported'),
  recordedAt: optionalDateTimeSchema,
});

const medicationSchema = z.object({
  name: z.string().trim().min(1, 'Medication name is required').max(255),
  genericName: optionalTrimmedString(),
  rxcui: optionalTrimmedString(50),
  category: z.enum(['prescription', 'otc', 'herbal', 'supplement']),
  dosage: optionalTrimmedString(100),
  frequency: optionalTrimmedString(100),
  route: optionalTrimmedString(50),
  indication: optionalTrimmedString(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  isCurrent: z.coerce.boolean().default(true),
  dataSource: provenanceSourceSchema.default('patient-reported'),
  recordedAt: optionalDateTimeSchema,
});

const allergySchema = z.object({
  substance: z.string().trim().min(1, 'Substance is required').max(255),
  substanceCode: optionalTrimmedString(50),
  reactionType: z.enum(['allergy', 'intolerance', 'side-effect']),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']),
  category: z.enum(['food', 'medication', 'environment', 'biologic', 'other']),
  manifestations: z
    .array(z.string().trim().min(1).max(100))
    .default([])
    .transform((items) => items.map((item) => item.trim())),
  onset: z.enum(['immediate', 'delayed', 'unknown']),
  onsetDate: optionalDateSchema,
  clinicalStatus: z.enum(['active', 'inactive', 'resolved']).default('active'),
  verifiedByClinician: z.coerce.boolean().default(false),
  dataSource: provenanceSourceSchema.default('patient-reported'),
  recordedAt: optionalDateTimeSchema,
});

const patientProfileSchema = z
  .object({
    demographics: demographicsSchema,
    medications: z.array(medicationSchema).max(50).default([]),
    allergies: z.array(allergySchema).max(50).default([]),
    attestations: z.object({
      noCurrentMedications: z.coerce.boolean().default(false),
      noKnownAllergies: z.coerce.boolean().default(false),
    }),
  })
  .superRefine((payload, ctx) => {
    if (!payload.attestations.noCurrentMedications && payload.medications.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['medications'],
        message: 'Add at least one medication or confirm there are no current medications',
      });
    }

    if (!payload.attestations.noKnownAllergies && payload.allergies.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['allergies'],
        message:
          'Add at least one allergy/intolerance or confirm there are no known allergies',
      });
    }
  });

module.exports = {
  patientProfileSchema,
};
