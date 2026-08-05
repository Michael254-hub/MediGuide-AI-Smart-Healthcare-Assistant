import type { RiskLevel } from "../components/RiskAlert";

export interface TriageLog {
  riskLevel?: RiskLevel;
  risk_level?: RiskLevel;
  recommendation?: string;
  flaggedEmergency?: boolean;
  flagged_emergency?: boolean;
  [key: string]: unknown;
}

export interface QuestionResponse {
  question?: string;
  response?: string;
  [key: string]: unknown;
}

export interface AssessmentSubmission {
  id?: string;
  symptoms?: string;
  submittedAt?: string;
  submitted_at?: string;
  [key: string]: unknown;
}

export interface AssessmentRecord {
  id?: string;
  assessedAt?: string;
  submittedAt?: string;
  submission?: AssessmentSubmission;
  triageLog: TriageLog;
  questionResponses?: QuestionResponse[];
  [key: string]: unknown;
}
