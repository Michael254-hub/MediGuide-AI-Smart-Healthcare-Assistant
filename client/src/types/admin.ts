export interface AdminStats {
  totalUsers?: number;
  totalSubmissions?: number;
  emergencyCases?: number;
  pendingProfessionalApplications?: number;
  approvedProfessionalApplications?: number;
  rejectedProfessionalApplications?: number;
  medicalProfessionalUsers?: number;
  assessmentsLast24Hours?: number;
  generatedAt?: string;
  riskDistribution?: Record<string, number> | { _id: string; count: number }[];
  recentSubmissions?: SubmissionRecord[];
  [key: string]: unknown;
}

export interface SubmissionRecord {
  id?: string;
  _id?: string;
  userName?: string;
  userEmail?: string;
  assessmentTitle?: string;
  symptoms?: string;
  riskLevel?: string;
  risk_level?: string;
  submittedAt?: string;
  assessedAt?: string;
  createdAt?: string;
  created_at?: string;
  submissionId?: Record<string, unknown>;
  submission_id?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NormalizedSubmission {
  id: string;
  userName: string;
  userEmail: string;
  assessmentTitle: string;
  symptoms: string;
  riskLevel: string;
  submittedAt: string | null;
  assessedAt: string | null;
}

export interface ProfessionalApplicant {
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface ProfessionalApplication {
  id: string;
  createdAt?: string;
  applicant?: ProfessionalApplicant;
  status: "pending" | "approved" | "rejected" | string;
  approvedRole?: string;
  desiredRole: string;
  yearsOfExperience: number;
  licenseNumber: string;
  licensingAuthority: string;
  licenseJurisdiction: string;
  licenseExpiryDate?: string;
  educationInstitution: string;
  educationQualification: string;
  educationGraduationYear: number;
  currentEmployer?: string;
  workExperienceSummary: string;
  professionalStatement?: string;
  specialties: string[];
  supportingDocuments: string[];
  reviewerNotes?: string;
  reviewedAt?: string;
  reviewer?: { name?: string };
  [key: string]: unknown;
}
