const {
  MAX_FOLLOW_UP_QUESTIONS,
  generateFollowUpQuestions,
} = require('../services/followUpQuestionService');

describe('Follow-up question generation', () => {
  it('should generate symptom-specific follow-up questions for headache complaints', () => {
    const questions = generateFollowUpQuestions({
      symptoms: 'I have had a headache and dizziness since this morning',
      duration: '1-3 days',
      severity: 'moderate',
    });

    expect(questions.length).toBeGreaterThan(2);
    expect(questions.some((question) => question.id === 'headache_sudden')).toBe(true);
    expect(questions.some((question) => question.id === 'headache_neuro')).toBe(true);
  });

  it('should keep the number of follow-up questions within the supported cap', () => {
    const questions = generateFollowUpQuestions({
      symptoms:
        'I have cough, sore throat, fever, headache, dizziness, nausea, abdominal pain, diarrhea, rash, itching, urinary pain, back pain, and eye redness',
      duration: 'More than 2 weeks',
      severity: 'severe',
    });

    expect(questions.length).toBeLessThanOrEqual(MAX_FOLLOW_UP_QUESTIONS);
  });

  it('should still provide fallback clarification questions when symptoms are broad', () => {
    const questions = generateFollowUpQuestions({
      symptoms: 'I am not feeling well and something feels off',
      duration: 'Just started (less than a day)',
      severity: 'mild',
    });

    expect(questions.some((question) => question.id === 'symptoms_worsening')).toBe(true);
    expect(questions.some((question) => question.id === 'daily_activities')).toBe(true);
  });
});
