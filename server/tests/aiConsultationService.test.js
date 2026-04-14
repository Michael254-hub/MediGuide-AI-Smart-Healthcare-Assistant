process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(),
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'harassment',
    HARM_CATEGORY_HATE_SPEECH: 'hate',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'sexual',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'danger',
  },
  HarmBlockThreshold: {
    BLOCK_NONE: 'block_none',
  },
}));

const {
  createSymptomAssessmentMessage,
  ensureMediChatClosing,
  MEDICHAT_MANDATORY_CLOSING,
} = require('../services/aiConsultationService');

describe('aiConsultationService MediChat safety helpers', () => {
  it('should append the mandatory MediChat disclaimer when missing', () => {
    const result = ensureMediChatClosing('Overview\n\nThis is general educational information.');

    expect(result).toContain('Overview');
    expect(result).toContain(MEDICHAT_MANDATORY_CLOSING);
    expect(result.endsWith(MEDICHAT_MANDATORY_CLOSING)).toBe(true);
  });

  it('should avoid duplicating the mandatory MediChat disclaimer when already present', () => {
    const original = `Educational answer.\n\n${MEDICHAT_MANDATORY_CLOSING}`;
    const result = ensureMediChatClosing(original);

    expect(result).toBe(original);
  });

  it('should include evidence-based non-critical guidance in the symptom assessment prompt', () => {
    const message = createSymptomAssessmentMessage(
      'No major chronic disease history provided.',
      {
        symptoms: 'Runny nose, sore throat, and cough',
        duration: '3 days',
        severity: 'mild',
        followUpResponses: [{ question: 'Do you have shortness of breath?', answer: 'no' }],
      },
      {
        level: 'LOW',
        recommendation: 'Rest, monitor symptoms, and seek care if things worsen.',
        flaggedEmergency: false,
      }
    );

    expect(message).toContain('EVIDENCE-BASED NON-CRITICAL GUIDANCE REFERENCE:');
    expect(message).toContain('- Common cold:');
    expect(message).toContain('Safety-net anchors:');
    expect(message).toContain('Matched cues: runny nose, sore throat, cough.');
    expect(message).toContain('For LOW or MEDIUM baseline cases, keep the recommendations home-based and provide 3 to 5 practical self-care or monitoring steps.');
    expect(message).toContain('Only recommend emergency care when there are red-flag symptoms or serious-condition cues such as cancer.');
  });
});
