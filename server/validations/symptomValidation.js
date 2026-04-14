const { z } = require('zod');

const followUpResponseAnswerSchema = z.enum(['yes', 'no', 'i_dont_know'], {
  errorMap: () => ({ message: 'Answer must be yes, no, or i_dont_know' }),
});

const parseJsonIfString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const baseSymptomSchema = {
  symptoms: z.string().min(5, 'Please describe your symptoms in more detail'),
  duration: z.string().min(1, 'Duration is required'),
  severity: z.enum(['mild', 'moderate', 'severe'], {
    errorMap: () => ({ message: 'Severity must be mild, moderate, or severe' })
  }),
};

const submitSymptomSchema = z.object({
  ...baseSymptomSchema,
  followUpResponses: z.preprocess(
    parseJsonIfString,
    z
      .array(
        z.object({
          id: z.string().min(1, 'Follow-up question id is required'),
          question: z.string().min(3, 'Follow-up question text is required'),
          answer: followUpResponseAnswerSchema,
        })
      )
      .max(15, 'No more than 15 follow-up responses are allowed')
      .default([])
  ),
}).strict().passthrough(); // passthrough to allow files to be present

const followUpQuestionSchema = z.object(baseSymptomSchema).strict();

module.exports = {
  submitSymptomSchema,
  followUpQuestionSchema,
  followUpResponseAnswerSchema,
};
