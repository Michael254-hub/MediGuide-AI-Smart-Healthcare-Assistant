const { z } = require('zod');

const submitSymptomSchema = z.object({
  symptoms: z.string().min(5, 'Please describe your symptoms in more detail'),
  duration: z.string().min(1, 'Duration is required'),
  severity: z.enum(['mild', 'moderate', 'severe'], {
    errorMap: () => ({ message: 'Severity must be mild, moderate, or severe' })
  }),
  // Optional: images will be handled by multer as files, not in body
}).strict().passthrough(); // passthrough to allow files to be present

module.exports = {
  submitSymptomSchema
};
