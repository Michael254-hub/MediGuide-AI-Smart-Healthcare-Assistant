-- Supabase PostgreSQL Schema for MediGuide
-- This file documents the database schema created for the Supabase migration

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(6),
  verification_code_expires_at TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMP,
  role VARCHAR(50) DEFAULT 'patient' CHECK (role IN ('patient', 'admin', 'medical_professional')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE verification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('signup')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms')),
  contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('email', 'phone')),
  contact_value VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP,
  invalidated_at TIMESTAMP,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  provider VARCHAR(50),
  last_sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create symptom_submissions table
CREATE TABLE symptom_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  duration VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Create triage_logs table
CREATE TABLE triage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES symptom_submissions(id) ON DELETE CASCADE,
  detected_symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')),
  recommendation TEXT NOT NULL,
  flagged_emergency BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Create medical_professional_applications table
CREATE TABLE medical_professional_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  desired_role VARCHAR(80) NOT NULL CHECK (
    desired_role IN (
      'general_practitioner',
      'specialist_physician',
      'nurse',
      'pharmacist',
      'mental_health_professional',
      'nutrition_specialist',
      'physiotherapist'
    )
  ),
  license_number VARCHAR(120) NOT NULL,
  licensing_authority VARCHAR(255) NOT NULL,
  license_jurisdiction VARCHAR(120) NOT NULL,
  license_expiry_date DATE NOT NULL,
  education_institution VARCHAR(255) NOT NULL,
  education_qualification VARCHAR(255) NOT NULL,
  education_graduation_year INTEGER NOT NULL CHECK (
    education_graduation_year BETWEEN 1950 AND 2100
  ),
  years_of_experience INTEGER NOT NULL CHECK (
    years_of_experience BETWEEN 0 AND 60
  ),
  current_employer VARCHAR(255),
  work_experience_summary TEXT NOT NULL,
  specialties TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  supporting_documents TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  professional_statement TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_role VARCHAR(80) CHECK (
    approved_role IN (
      'general_practitioner',
      'specialist_physician',
      'nurse',
      'pharmacist',
      'mental_health_professional',
      'nutrition_specialist',
      'physiotherapist'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_verification_challenges_user_id ON verification_challenges(user_id);
CREATE INDEX idx_symptom_submissions_user_id ON symptom_submissions(user_id);
CREATE INDEX idx_triage_logs_submission_id ON triage_logs(submission_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_medical_professional_applications_user_id ON medical_professional_applications(user_id);
CREATE INDEX idx_medical_professional_applications_status ON medical_professional_applications(status);
