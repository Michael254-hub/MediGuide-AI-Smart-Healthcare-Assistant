export interface PatientProfileDemographics {
  age?: number | string;
  sexAtBirth?: string;
  [key: string]: unknown;
}

export interface PatientProfileSummary {
  medicationCount?: number;
  allergyCount?: number;
  [key: string]: unknown;
}

export interface PatientProfileDetails {
  profileComplete?: boolean;
  demographics?: PatientProfileDemographics;
  profileSummary?: PatientProfileSummary;
  [key: string]: unknown;
}
