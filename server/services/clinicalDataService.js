/**
 * Clinical Data Service
 * Generates mock patient data for the clinical decision support system
 * In production, this would pull from EHR systems via FHIR APIs
 */

const generateMockPatientData = (userId) => {
  return {
    patient: {
      id: userId,
      name: 'John Doe',
      age: 45,
      sex: 'M',
      height: '5\'10"',
      weight: '200 lbs',
      bmi: 28.7,
      medicalRecordNumber: 'MR-2024-001'
    },
    vitals: {
      temperature: { value: 98.6, unit: '°F', reference: '98.6°F', status: 'normal' },
      bloodPressure: { value: '142/92', systolic: 142, diastolic: 92, unit: 'mmHg', reference: '<120/80', status: 'elevated' },
      heartRate: { value: 78, unit: 'bpm', reference: '60-100', status: 'normal' },
      respiratoryRate: { value: 16, unit: 'breaths/min', reference: '12-20', status: 'normal' },
      oxygenSaturation: { value: 98, unit: '%', reference: '≥95%', status: 'normal' }
    },
    riskScore: {
      overallRisk: 'MODERATE',
      score: 65,
      factors: [
        { name: 'Hypertension', severity: 'high', impact: 'significant' },
        { name: 'Elevated BMI', severity: 'medium', impact: 'moderate' },
        { name: 'Age >40', severity: 'low', impact: 'minor' }
      ]
    },
    activeProblems: [
      { name: 'Hypertension', status: 'active', onset: '2020-03-15', severity: 'moderate' },
      { name: 'Type 2 Diabetes Mellitus', status: 'active', onset: '2019-06-20', severity: 'moderate' },
      { name: 'Hyperlipidemia', status: 'active', onset: '2021-01-10', severity: 'mild' }
    ],
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10 mg',
        frequency: 'Once daily',
        indication: 'Hypertension',
        route: 'Oral',
        interactions: [],
        startDate: '2020-03-15'
      },
      {
        name: 'Metformin',
        dosage: '1000 mg',
        frequency: 'Twice daily',
        indication: 'Type 2 Diabetes',
        route: 'Oral',
        interactions: ['High-risk: Contrast dye interaction'],
        startDate: '2019-06-20'
      },
      {
        name: 'Atorvastatin',
        dosage: '20 mg',
        frequency: 'Once daily',
        indication: 'Hyperlipidemia',
        route: 'Oral',
        interactions: [],
        startDate: '2021-01-10'
      },
      {
        name: 'Aspirin',
        dosage: '81 mg',
        frequency: 'Once daily',
        indication: 'Cardiovascular protection',
        route: 'Oral',
        interactions: [],
        startDate: '2020-06-01'
      }
    ],
    labResults: [
      {
        test: 'Hemoglobin A1c',
        value: 7.8,
        unit: '%',
        reference: '<5.7%',
        status: 'high',
        normalRange: { low: 4.0, high: 5.6 },
        previousValue: 7.5,
        trend: 'increasing',
        date: '2024-03-15'
      },
      {
        test: 'Total Cholesterol',
        value: 245,
        unit: 'mg/dL',
        reference: '<200',
        status: 'high',
        normalRange: { low: 0, high: 200 },
        previousValue: 260,
        trend: 'improving',
        date: '2024-03-15'
      },
      {
        test: 'LDL Cholesterol',
        value: 165,
        unit: 'mg/dL',
        reference: '<100',
        status: 'high',
        normalRange: { low: 0, high: 100 },
        previousValue: 180,
        trend: 'improving',
        date: '2024-03-15'
      },
      {
        test: 'HDL Cholesterol',
        value: 35,
        unit: 'mg/dL',
        reference: '>40',
        status: 'low',
        normalRange: { low: 40, high: 999 },
        previousValue: 35,
        trend: 'stable',
        date: '2024-03-15'
      },
      {
        test: 'Fasting Glucose',
        value: 145,
        unit: 'mg/dL',
        reference: '<100',
        status: 'high',
        normalRange: { low: 70, high: 100 },
        previousValue: 138,
        trend: 'increasing',
        date: '2024-03-15'
      },
      {
        test: 'Creatinine (Serum)',
        value: 0.95,
        unit: 'mg/dL',
        reference: '0.7-1.3',
        status: 'normal',
        normalRange: { low: 0.7, high: 1.3 },
        previousValue: 0.93,
        trend: 'stable',
        date: '2024-03-15'
      }
    ],
    differentialDiagnoses: [
      {
        diagnosis: 'Uncontrolled Type 2 Diabetes Mellitus',
        probability: 85,
        reasoning: 'Elevated HbA1c (7.8%) despite metformin therapy, fasting glucose 145 mg/dL',
        recommendations: [
          'Consider adding second antidiabetic agent (GLP-1 RA or DPP-4 inhibitor)',
          'Reinforce dietary modifications and exercise',
          'Recheck HbA1c in 3 months'
        ]
      },
      {
        diagnosis: 'Resistant Hypertension',
        probability: 72,
        reasoning: 'BP 142/92 on lisinopril monotherapy, BMI >25, possible medication non-adherence',
        recommendations: [
          'Check medication adherence and timing',
          'Consider adding second antihypertensive (CCB or thiazide)',
          '24-hour ambulatory BP monitoring',
          'Screen for secondary causes'
        ]
      },
      {
        diagnosis: 'Dyslipidemia',
        probability: 68,
        reasoning: 'Total cholesterol 245, LDL 165, HDL 35 on atorvastatin 20mg',
        recommendations: [
          'Increase atorvastatin to 40-80mg daily',
          'Add ezetimibe if LDL remains elevated',
          'Lifestyle modifications (diet, exercise, weight loss)',
          'Recheck lipid panel in 6 weeks'
        ]
      }
    ],
    actionItems: [
      {
        priority: 'HIGH',
        action: 'Intensify diabetes management',
        reason: 'A1c above goal despite monotherapy',
        dueDate: '2024-04-15',
        status: 'pending'
      },
      {
        priority: 'HIGH',
        action: 'Reassess antihypertensive regimen',
        reason: 'BP persistently elevated on monotherapy',
        dueDate: '2024-04-01',
        status: 'pending'
      },
      {
        priority: 'MEDIUM',
        action: 'Lipid optimization - increase statin dose',
        reason: 'LDL >100 despite treatment',
        dueDate: '2024-04-15',
        status: 'pending'
      },
      {
        priority: 'MEDIUM',
        action: 'Schedule follow-up labs',
        reason: 'Baseline for therapy changes',
        dueDate: '2024-04-30',
        status: 'pending'
      }
    ]
  };
};

const buildClinicalContext = (patientData) => {
  const { patient, vitals, activeProblems, medications, labResults, riskScore } = patientData;
  
  return `
PATIENT DEMOGRAPHICS:
- Age: ${patient.age} years old, ${patient.sex}
- BMI: ${patient.bmi} kg/m²
- Height: ${patient.height}, Weight: ${patient.weight}

CURRENT VITALS:
- Temperature: ${vitals.temperature.value}${vitals.temperature.unit}
- Blood Pressure: ${vitals.bloodPressure.value} mmHg (Status: ${vitals.bloodPressure.status})
- Heart Rate: ${vitals.heartRate.value} ${vitals.heartRate.unit}
- Respiratory Rate: ${vitals.respiratoryRate.value} ${vitals.respiratoryRate.unit}
- O2 Saturation: ${vitals.oxygenSaturation.value}${vitals.oxygenSaturation.unit}

RISK ASSESSMENT:
- Overall Risk: ${riskScore.overallRisk} (Score: ${riskScore.score}/100)
- Risk Factors: ${riskScore.factors.map(f => f.name).join(', ')}

ACTIVE MEDICAL PROBLEMS:
${activeProblems.map(p => `- ${p.name} (Status: ${p.status}, Severity: ${p.severity})`).join('\n')}

CURRENT MEDICATIONS:
${medications.map(m => `- ${m.name} ${m.dosage} ${m.frequency} (for ${m.indication})`).join('\n')}
${medications.some(m => m.interactions.length > 0) ? '\nDrug Interactions Noted: ' + medications.filter(m => m.interactions.length > 0).map(m => m.interactions.join('; ')).join('\n') : ''}

RECENT LAB RESULTS:
${labResults.map(l => `- ${l.test}: ${l.value} ${l.unit} (Reference: ${l.reference}) [${l.status.toUpperCase()}]`).join('\n')}

CLINICAL CONTEXT SUMMARY:
Patient is a ${patient.age}-year-old with multiple cardiovascular risk factors including hypertension (BP ${vitals.bloodPressure.value}), obesity (BMI ${patient.bmi}), and poorly controlled diabetes (A1c ${labResults[0].value}%).
`;
};

module.exports = {
  generateMockPatientData,
  buildClinicalContext
};
