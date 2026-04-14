ALTER TABLE symptom_submissions
ADD COLUMN IF NOT EXISTS follow_up_responses JSONB NOT NULL DEFAULT '[]'::jsonb;
