const {
  buildNonCriticalGuidanceContext,
  findRelevantConditionGuidance,
} = require('../services/nonCriticalGuidanceService');

describe('nonCriticalGuidanceService', () => {
  it('matches the most relevant evidence-based condition guidance from symptom text', () => {
    const matches = findRelevantConditionGuidance({
      symptoms: 'Burning when peeing with frequent urination and cloudy urine',
      duration: '2 days',
      severity: 'mild',
      followUpResponses: [
        { question: 'Do you have flank pain?', answer: 'no' },
        { question: 'Do you feel feverish?', answer: 'no' },
      ],
    });

    expect(matches[0].condition.id).toBe('lower-uti');
    expect(matches[0].hits).toEqual(
      expect.arrayContaining(['burning when peeing', 'frequent urination', 'cloudy urine'])
    );
  });

  it('falls back to representative examples when there is no direct condition match', () => {
    const guidance = buildNonCriticalGuidanceContext({
      symptoms: 'Mild vague discomfort after gardening',
      duration: '1 day',
      severity: 'mild',
    });

    expect(guidance).toContain(
      'Evidence-based non-critical adult guidance examples to use as analogies if this case appears non-critical:'
    );
    expect(guidance).toContain('- Common cold:');
    expect(guidance).toContain('- Viral gastroenteritis:');
    expect(guidance).toContain('- Ankle sprain:');
  });
});
