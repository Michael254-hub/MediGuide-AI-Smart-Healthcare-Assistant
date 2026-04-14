jest.mock('../repositories/symptomRepository', () => ({}));
jest.mock('../repositories/userRepository', () => ({}));
jest.mock('../services/patientProfileService', () => ({}));
jest.mock('../services/followUpQuestionService', () => ({
  generateFollowUpQuestions: jest.fn(),
}));
jest.mock('../services/clinicalDataService', () => ({
  generateMockPatientData: jest.fn(),
  mergeProfileIntoClinicalData: jest.fn(),
  buildClinicalContext: jest.fn(),
}));
jest.mock('../services/aiConsultationService', () => ({
  assessSymptomsWithAI: jest.fn(),
}));

const triageService = require('../services/triageService');

describe('TriageService grounded recommendation formatting', () => {
  it('should lead non-emergency assessments with home-care guidance', () => {
    const recommendation = triageService.formatEnhancedRecommendation(
      {
        level: 'MEDIUM',
        recommendation: 'Home-based care may be appropriate for now. Rest, stay hydrated, and monitor your symptoms closely. Seek medical review if things worsen or do not improve.',
        flaggedEmergency: false,
      },
      {
        patientSummary: 'Symptoms fit a likely non-critical upper respiratory pattern.',
        clinicalImpression: 'The pattern is most consistent with a self-limited illness without immediate danger signs.',
        recommendations: ['Rest', 'Drink fluids', 'Use warm drinks for comfort'],
        redFlags: ['trouble breathing'],
        followUpPlan: 'Seek review within 48 hours if symptoms are not improving.',
      }
    );

    expect(recommendation).toContain('Home-based care is appropriate at this stage.');
    expect(recommendation).toContain('Recommended next steps: Rest | Drink fluids | Use warm drinks for comfort');
  });

  it('should keep the baseline urgent guidance while adding grounded AI details', () => {
    const recommendation = triageService.formatEnhancedRecommendation(
      {
        level: 'HIGH',
        recommendation: 'Please seek medical attention from a doctor as soon as possible.',
        flaggedEmergency: false,
      },
      {
        patientSummary: 'Symptoms are persistent and affecting normal activity.',
        clinicalImpression: 'The pattern may reflect an inflammatory or infectious process, but in-person review is still needed.',
        recommendations: ['Arrange same-day review', 'Stay hydrated'],
        redFlags: ['trouble breathing', 'worsening pain'],
        followUpPlan: 'If symptoms do not improve within 24 hours, seek urgent reassessment.',
      }
    );

    expect(recommendation).toContain('Please seek medical attention from a doctor as soon as possible.');
    expect(recommendation).toContain('Assessment summary: Symptoms are persistent and affecting normal activity.');
    expect(recommendation).toContain('Recommended next steps: Arrange same-day review | Stay hydrated');
    expect(recommendation).toContain('Seek urgent care sooner if you develop: trouble breathing | worsening pain');
    expect(recommendation).toContain('Follow-up: If symptoms do not improve within 24 hours, seek urgent reassessment.');
  });
});
