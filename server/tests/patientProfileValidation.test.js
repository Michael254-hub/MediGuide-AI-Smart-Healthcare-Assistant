const { patientProfileSchema } = require('../validations/patientProfileValidation');

describe('patientProfileSchema', () => {
  it('requires medications unless the no-medications attestation is set', () => {
    const result = patientProfileSchema.safeParse({
      demographics: {
        age: 34,
        sexAtBirth: 'female',
        genderIdentity: 'woman',
        dataSource: 'patient-reported',
      },
      medications: [],
      allergies: [
        {
          substance: 'Penicillin',
          reactionType: 'allergy',
          severity: 'severe',
          category: 'medication',
          manifestations: ['rash'],
          onset: 'immediate',
          dataSource: 'patient-reported',
        },
      ],
      attestations: {
        noCurrentMedications: false,
        noKnownAllergies: false,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.path.join('.') === 'medications')).toBe(true);
  });

  it('accepts a complete payload and preserves structured arrays', () => {
    const result = patientProfileSchema.safeParse({
      demographics: {
        age: 52,
        sexAtBirth: 'male',
        genderIdentity: 'man',
        dataSource: 'patient-reported',
      },
      medications: [
        {
          name: 'Lisinopril',
          category: 'prescription',
          dosage: '10 mg',
          frequency: 'daily',
          route: 'oral',
          indication: 'hypertension',
          dataSource: 'patient-reported',
          isCurrent: true,
        },
      ],
      allergies: [
        {
          substance: 'Peanuts',
          reactionType: 'allergy',
          severity: 'life-threatening',
          category: 'food',
          manifestations: ['anaphylaxis'],
          onset: 'immediate',
          dataSource: 'patient-reported',
        },
      ],
      attestations: {
        noCurrentMedications: false,
        noKnownAllergies: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.data.allergies[0].manifestations).toEqual(['anaphylaxis']);
  });
});
