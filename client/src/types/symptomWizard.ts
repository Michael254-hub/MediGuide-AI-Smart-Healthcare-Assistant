export interface FollowUpQuestion {
  id: string;
  question: string;
  [key: string]: unknown;
}

export interface FollowUpResponse {
  id: string;
  question: string;
  answer: string;
}

export interface UploadedImage {
  file: File;
  name: string;
  preview: string;
}

export interface DraftSubmission {
  symptoms: string;
  duration: string;
  severity: "mild" | "moderate" | "severe";
}
