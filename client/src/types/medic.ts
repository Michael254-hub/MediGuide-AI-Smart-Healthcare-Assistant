export interface MedicProfile {
  name?: string;
  email?: string;
  phone?: string;
  approvedRole?: string;
  status?: string;
  reviewerNotes?: string;
  specialties?: string[];
  [key: string]: unknown;
}

export interface MedicStats {
  totalCases?: number;
  priorityCases?: number;
  emergencyCases?: number;
  recentCases?: number;
  generatedAt?: string;
  [key: string]: unknown;
}

export interface MedicPermission {
  id: string;
  title: string;
  description: string;
}

export interface MedicCaseSubmission {
  duration?: string;
  severity?: string;
  symptoms?: string;
  submittedAt?: string;
  [key: string]: unknown;
}

export interface MedicCasePatient {
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface MedicCase {
  id: string;
  patient: MedicCasePatient;
  submission: MedicCaseSubmission;
  riskLevel?: string;
  flaggedEmergency?: boolean;
  recommendation?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface MedicWorkspace {
  professionalProfile?: MedicProfile;
  stats?: MedicStats;
  priorityQueue?: MedicCase[];
  recentCases?: MedicCase[];
  permissions?: MedicPermission[];
  [key: string]: unknown;
}
