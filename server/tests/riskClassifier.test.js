const { classifyRisk } = require('../utils/riskClassifier');

describe('Triage Risk Classifier Engine', () => {

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

});
