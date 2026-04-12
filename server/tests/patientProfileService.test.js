process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

const patientProfileService = require('../services/patientProfileService');

describe('patientProfileService helper output', () => {
  const user = {
    id: 'user-123',
    name: 'Ada Example',
    email: 'ada@example.com',
    phone: '+15551234567',
  };

  const profile = {
    id: 'profile-1',
    age_years: 37,
    sex_at_birth: 'female',
    data_source: 'patient-reported',
    confidence_score: 0.7,
    fhir_id: 'patient-123',
    no_current_medications: false,
    no_known_allergies: false,
    recorded_at: '2026-04-11T08:00:00.000Z',
    updated_at: '2026-04-11T09:00:00.000Z',
  };

  const medications = [
    {
      id: 'med-1',
      name: 'Metformin',
      generic_name: 'Metformin',
      rxcui: '860975',
      dosage: '500 mg',
      frequency: 'twice daily',
      route: 'oral',
      indication: 'type 2 diabetes',
      start_date: '2026-01-03',
      end_date: null,
      is_current: true,
      data_source: 'patient-reported',
      confidence_score: 0.7,
      recorded_at: '2026-04-11T08:05:00.000Z',
      updated_at: '2026-04-11T08:05:00.000Z',
    },
  ];

  const allergies = [
    {
      id: 'allergy-1',
      substance: 'Penicillin',
      substance_code: '91936005',
      reaction_type: 'allergy',
      severity: 'severe',
      category: 'medication',
      manifestations: ['rash', 'wheezing'],
      onset_date: '2024-01-10',
      clinical_status: 'active',
      data_source: 'patient-reported',
      confidence_score: 0.7,
      recorded_at: '2026-04-11T08:10:00.000Z',
      updated_at: '2026-04-11T08:10:00.000Z',
    },
  ];

  it('builds a FHIR bundle with patient, medication, and allergy resources', () => {
    const bundle = patientProfileService.buildFhirBundle(user, profile, medications, allergies);

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.total).toBe(3);
    expect(bundle.entry[0].resource.resourceType).toBe('Patient');
    expect(bundle.entry[1].resource.resourceType).toBe('MedicationStatement');
    expect(bundle.entry[2].resource.resourceType).toBe('AllergyIntolerance');
  });

  it('builds a de-identified training view without direct identifiers', () => {
    const trainingView = patientProfileService.buildDeidentifiedTrainingView(
      user.id,
      profile,
      medications,
      allergies
    );

    expect(trainingView.cohortKey).toHaveLength(16);
    expect(trainingView.demographics.ageBand).toBe('30-39');
    expect(trainingView.name).toBeUndefined();
    expect(trainingView.email).toBeUndefined();
  });
});
