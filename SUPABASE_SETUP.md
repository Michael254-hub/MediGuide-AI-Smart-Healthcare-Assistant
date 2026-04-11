# 🔧 Supabase Database Setup Guide

**Status:** Database schema needs to be created  
**Required Tables:** 5 tables + 5 indexes  
**Estimated Time:** 2-3 minutes

---

## ✅ Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project (`icigeeoaoogjxjfzimfh`)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

## ✅ Step 2: Copy & Paste This SQL Script

Copy the entire SQL script below and paste it into the Supabase SQL Editor:

```sql
-- MediGuide Database Schema Setup
-- Supabase PostgreSQL Tables

-- Drop existing tables if they exist (optional - for fresh setup)
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS triage_logs CASCADE;
-- DROP TABLE IF EXISTS symptom_submissions CASCADE;
-- DROP TABLE IF EXISTS verification_challenges CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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
  role VARCHAR(50) DEFAULT 'patient' CHECK (role IN ('patient', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verification_challenges table
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

-- Create symptom_submissions table
CREATE TABLE IF NOT EXISTS symptom_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  duration VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Create triage_logs table
CREATE TABLE IF NOT EXISTS triage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES symptom_submissions(id) ON DELETE CASCADE,
  detected_symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')),
  recommendation TEXT NOT NULL,
  flagged_emergency BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(submission_id) REFERENCES symptom_submissions(id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_verification_challenges_user_id ON verification_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_challenges_expires ON verification_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_symptom_submissions_user_id ON symptom_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_triage_logs_submission_id ON triage_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Success message (will appear in execution results)
SELECT 'Database schema created successfully!' as status;
```

---

## ✅ Step 3: Execute the Script

1. **Click** the blue **Run** button (or press Ctrl+Enter)
2. **Wait** for the query to complete (30-60 seconds)
3. **Verify** you see success message at the bottom

### Expected Output:

```
Successfully executed 1 statement
status
--
Database schema created successfully!
```

---

## ✅ Step 4: Verify Tables Were Created

In **Supabase Dashboard**:

1. Go to **Table Editor** (left sidebar)
2. You should see these 5 tables:
   - ✅ `users`
   - ✅ `verification_challenges`
   - ✅ `symptom_submissions`
   - ✅ `triage_logs`
   - ✅ `tasks`

Click each table to verify columns are present.

---

## ✅ Step 5: Enable Row Level Security (Optional but Recommended)

If you want to add RLS policies (for production security):

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own data
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can see their own verification challenges"
  ON verification_challenges FOR SELECT
  USING (auth.uid() = user_id);
```

_(Optional - only needed if using Supabase Auth integration)_

---

## 🧪 Quick Test After Setup

Once tables are created, **go back to your app** at http://localhost:5174 and try registration again. You should get:

✅ Registration form submits  
✅ Redirected to /verify-account  
✅ No more "table not found" error

---

## ❌ Troubleshooting

### Issue: "Table already exists" error

- **Solution:** This is fine - script uses `IF NOT EXISTS`, so it won't recreate
- Just continue with verification

### Issue: Foreign Key errors

- **Solution:** Make sure `users` table is created FIRST (it is in the script)
- If error occurs, drop and recreate in order shown

### Issue: Still getting table not found after 5 minutes

- **Solution:**
  1. Close and reopen your app (http://localhost:5174)
  2. The server may have cached the schema
  3. Restart the backend server: Kill `npm run dev` and restart it

### Issue: Can't see tables in Table Editor

- **Solution:**
  1. Refresh the page
  2. Go to browser DevTools → Application → Clear all site data
  3. Navigate back to Supabase dashboard

---

## ✨ What Happens Next

After tables are created:

1. **Users can register** with email or phone
2. **Verification codes stored** in verification_challenges table
3. **Account verification** works end-to-end
4. **Login flow** completes successfully
5. **Password reset** tokens stored and validated

---

## 📍 Ready?

1. Open your Supabase project
2. Copy the SQL script above
3. Run it in SQL Editor
4. Verify the 5 tables appear in Table Editor
5. Tell me when done, and we'll test registration again! 🚀
