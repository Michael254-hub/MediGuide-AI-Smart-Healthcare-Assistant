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
});
