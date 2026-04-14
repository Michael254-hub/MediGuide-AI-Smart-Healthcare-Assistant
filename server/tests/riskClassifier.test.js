const { classifyRisk } = require('../utils/riskClassifier');

describe('Triage Risk Classifier Engine', () => {

  // --- Existing keyword-matching tests ---

  it('should identify EMERGENCY risk for "chest pain"', () => {
    const result = classifyRisk('I am experiencing severe chest pain');
    expect(result.level).toBe('EMERGENCY');
    expect(result.flaggedEmergency).toBe(true);
  });

  it('should identify EMERGENCY risk for "difficulty breathing"', () => {
    const result = classifyRisk('My grandmother has difficulty breathing');
    expect(result.level).toBe('EMERGENCY');
  });

  it('should identify HIGH risk for "confusion"', () => {
    const result = classifyRisk('Patient is showing signs of confusion');
    expect(result.level).toBe('HIGH');
    expect(result.flaggedEmergency).toBe(false);
  });

  it('should identify MEDIUM risk for double symptoms "fever" and "headache"', () => {
    const result = classifyRisk('I have a fever and a strong headache');
    expect(result.level).toBe('MEDIUM');
  });

  it('should default to LOW risk for mild unknown symptoms', () => {
    const result = classifyRisk('My throat is a bit scratchy and I have a runny nose');
    expect(result.level).toBe('LOW');
  });

  // --- New severity & duration promotion tests ---

  it('should promote to EMERGENCY when severity is 9, even for mild symptoms', () => {
    const result = classifyRisk('My throat is a bit scratchy', 2, 9);
    expect(result.level).toBe('EMERGENCY');
    expect(result.flaggedEmergency).toBe(true);
  });

  it('should promote to at least HIGH when severity is 8', () => {
    const result = classifyRisk('I have a runny nose', 1, 8);
    expect(result.level).toBe('HIGH');
  });

  it('should bump level by one tier when duration exceeds 7 days', () => {
    // LOW symptoms lasting 10 days → MEDIUM
    const result = classifyRisk('My throat is a bit scratchy', 10, 0);
    expect(result.level).toBe('MEDIUM');
  });

  it('should not exceed EMERGENCY when duration bumps an already-HIGH result', () => {
    // HIGH keyword + 10-day duration → EMERGENCY (capped at EMERGENCY)
    const result = classifyRisk('Patient is showing signs of confusion', 10, 0);
    expect(result.level).toBe('EMERGENCY');
    expect(result.flaggedEmergency).toBe(true);
  });

  it('should normalize the current duration labels used by the symptom form', () => {
    const result = classifyRisk('My throat is a bit scratchy', 'More than 2 weeks', 'mild');
    expect(result.level).toBe('MEDIUM');
  });

  it('should normalize severe string severity values from the symptom form', () => {
    const result = classifyRisk('I have a mild rash', '1-3 days', 'severe');
    expect(result.level).toBe('EMERGENCY');
    expect(result.flaggedEmergency).toBe(true);
  });

});
