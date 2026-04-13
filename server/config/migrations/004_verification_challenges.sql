CREATE TABLE IF NOT EXISTS verification_challenges (
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

CREATE INDEX IF NOT EXISTS idx_verification_challenges_user_id
  ON verification_challenges(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_challenges_active
  ON verification_challenges(user_id, purpose, contact_type, created_at DESC)
  WHERE consumed_at IS NULL AND invalidated_at IS NULL;
