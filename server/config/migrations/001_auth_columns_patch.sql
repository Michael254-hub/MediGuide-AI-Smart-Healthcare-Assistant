-- Apply this to an existing Supabase database if the users table was created
-- before the auth verification and password-recovery fields were added.

ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP;

UPDATE users
SET
  phone_verified = COALESCE(phone_verified, FALSE),
  email_verified = COALESCE(email_verified, FALSE)
WHERE phone_verified IS NULL
   OR email_verified IS NULL;

ALTER TABLE users
  ALTER COLUMN phone_verified SET DEFAULT FALSE,
  ALTER COLUMN email_verified SET DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
  ON users(phone)
  WHERE phone IS NOT NULL;
