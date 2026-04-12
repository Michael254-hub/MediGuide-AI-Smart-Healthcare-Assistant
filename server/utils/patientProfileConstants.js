const PROVENANCE_SOURCES = [
  'patient-reported',
  'caregiver-reported',
  'clinician-documented',
  'pharmacy-record',
  'ehr-import',
  'lab-result',
  'device-reported',
];

const SOURCE_CONFIDENCE = {
  'patient-reported': 0.7,
  'caregiver-reported': 0.65,
  'clinician-documented': 0.92,
  'pharmacy-record': 0.9,
  'ehr-import': 0.95,
  'lab-result': 0.98,
  'device-reported': 0.88,
};

const PROFILE_COMPLETION_STEPS = {
  NONE: 0,
  DEMOGRAPHICS: 1,
  MEDICATIONS: 2,
  ALLERGIES: 3,
};

module.exports = {
  PROVENANCE_SOURCES,
  SOURCE_CONFIDENCE,
  PROFILE_COMPLETION_STEPS,
};
