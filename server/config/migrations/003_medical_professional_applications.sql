-- =============================================================
-- MediGuide: Medical Professional Applications  (Migration 003)
-- Adds role application storage and expands the user role enum.
-- =============================================================

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('patient', 'admin', 'medical_professional'));

CREATE TABLE IF NOT EXISTS medical_professional_applications (
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

CREATE INDEX IF NOT EXISTS idx_medical_professional_applications_user_id
  ON medical_professional_applications(user_id);

CREATE INDEX IF NOT EXISTS idx_medical_professional_applications_status
  ON medical_professional_applications(status);
