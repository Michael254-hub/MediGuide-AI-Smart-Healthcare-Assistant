# ⚙️ MediGuide Clinical System - Configuration Checklist

## Pre-Launch Verification (30 minutes)

Use this checklist to ensure everything is properly configured before launching the clinical system with Gemini 3 integration.

---

## 🔑 Step 1: Google Gemini API Key Setup

### Task: Obtain and Configure API Key

- [ ] **Visit Google AI Studio**
  - Go to: https://aistudio.google.com/app/apikeys
  - Sign in with your Google account
  - Ensure account has access to Gemini API

- [ ] **Create API Key**
  - Click: "Create API Key" or "Create new API Key"
  - Select project (create if needed)
  - Copy the key (format: `AIza...`)
  - ⚠️ SAVE IT! You won't see it again

- [ ] **Add to Environment**
  - Open: `server/.env`
  - Find: `GEMINI_API_KEY=your_gemini_api_key_here`
  - Replace with: `GEMINI_API_KEY=AIza-YOUR_ACTUAL_KEY`
  - Save the file

- [ ] **Verify Installation**
  ```bash
  cd server
  npm install
  npm run dev
  # Should see: "✓ Supabase Connected Successfully"
  # and: "Server running in development mode on port 5000"
  ```

---

## 📚 Step 2: Dependencies Verification

### Task: Ensure All Required Packages Are Installed

#### Server Dependencies

```bash
cd server
npm list | grep -E "google|generative|pg|express"
```

Should show:

- [ ] `@google/generative-ai@latest`
- [ ] `pg@latest` (PostgreSQL client)
- [ ] `express@4.x`
- [ ] `bcrypt@latest`
- [ ] `jsonwebtoken@latest`

Missing packages?

```bash
npm install @google/generative-ai pg
```

#### Client Dependencies

```bash
cd client
npm list | grep -E "react|axios|lucide"
```

Should show:

- [ ] `react@19.x`
- [ ] `axios@latest`
- [ ] `lucide-react@latest` (includes new icons: Mic, MicOff, Upload, Image)
- [ ] `zustand@latest`

---

## 🗄️ Step 3: Database Configuration

### Task: Verify Supabase Connection

- [ ] **Check .env Variables**

  ```bash
  # In server/.env, verify these exist:
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=eyJhbGc...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
  ```

- [ ] **Test Connection at Startup**

  ```bash
  cd server
  npm run dev
  # Check for success message:
  # ✓ Supabase Connected Successfully
  ```

- [ ] **Verify Tables Exist**
  - Log into https://app.supabase.com
  - Navigate to: SQL Editor
  - Run: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`
  - Should see: `users`, `symptom_submissions`, `triage_logs`, `tasks`

---

## 🔐 Step 4: Authentication Verification

### Task: Ensure JWT Token System Works

- [ ] **Check JWT Secret**

  ```bash
  # In server/.env:
  JWT_SECRET=your_secret_key_here_min_32_chars
  # Should be unique and at least 32 characters
  ```

- [ ] **Test Login Flow**
  1. Start server & client
  2. Go to `http://localhost:5173/register`
  3. Create test account
  4. Should redirect to dashboard
  5. Check browser console → Application → localStorage
  6. Look for: `mediguide-auth-storage`
  7. Should contain: `token`, `email`, `user_id`

- [ ] **Verify Token Injection**
  1. Open DevTools → Network tab
  2. Make API call to `/api/v1/clinical/patient-data`
  3. Check request headers → Authorization
  4. Should see: `Bearer eyJhbGc...`

---

## ✨ Step 5: New Gemini Features Verification

### Task: Test Voice and Image Input Capabilities

#### Voice Input (Web Speech API)

- [ ] **Test Voice Recording**
  1. Go to `http://localhost:5173/submit-symptoms`
  2. Click "Start Voice Input" button
  3. Speak naturally (e.g., "I have a sore throat and fever")
  4. Verify text appears in symptoms textarea
  5. Stop recording
  6. Text should be added to textarea

- [ ] **Browser Compatibility Check**
  - Voice API requires: Chrome, Edge, Safari (mobile)
  - Firefox: Limited support
  - Check browser console for Speech Recognition API availability

#### Image Upload

- [ ] **Test Image Upload**
  1. Go to `http://localhost:5173/submit-symptoms`
  2. Click "Upload Images of Symptoms"
  3. Select 2-3 symptom images
  4. Verify preview thumbnails appear
  5. Test image removal (X button)
  6. Submit form with images attached

- [ ] **Supported Formats**
  - JPEG, PNG, WebP, GIF accepted
  - Max file size: 10MB per image (Gemini API default)
  - Multiple images supported

#### Gemini Multimodal Processing

- [ ] **Test Text + Image Submission**
  1. Type symptom description
  2. Add symptom images
  3. Submit symptoms
  4. Verify API receives both text and images
  5. Check server logs for Gemini API calls

- [ ] **Check Gemini API Response**
  1. Monitor browser Network tab
  2. Look for POST to `/api/v1/symptoms`
  3. Response should include AI analysis (FormData multipart)

---

## 🚀 Step 6: Service Launch

### Task: Start All Services in Correct Order

#### Terminal 1: Start Backend

```bash
cd server
npm run dev

# ✅ Expected output:
# ✓ Supabase Connected Successfully
# Server running in development mode on port 5000
```

- [ ] Server started successfully
- [ ] No error messages in console
- [ ] Waiting on port 5000

#### Terminal 2: Start Frontend

```bash
cd client
npm run dev

# ✅ Expected output:
# VITE v5.x.x built in XXXms
# ➜ Local: http://localhost:5173
```

- [ ] Frontend started successfully
- [ ] No compilation errors
- [ ] Available at `http://localhost:5173`

#### Terminal 3: Monitor Logs (Optional but Recommended)

```bash
# Keep this open to watch all API calls and errors
# Both server and client will log here if you set it up
```

---

## 🧪 Step 6: Clinical Dashboard Test

### Task: Verify Core Functionality

#### Test Navigation

- [ ] Open `http://localhost:5173`
- [ ] Login with test credentials
- [ ] See navbar with **🧠 Clinical AI** link
- [ ] Click link → navigate to `/clinical` page
- [ ] Page loads without 404 error

#### Test Data Loading

- [ ] **Dashboard Tab** loads
  - [ ] Patient name displays (John Doe)
  - [ ] Vital signs appear (BP, HR, etc.)
  - [ ] Risk score visible (0-100 number)
  - [ ] Action items listed below

- [ ] **Differential Diagnosis Tab** shows
  - [ ] 3+ diagnoses listed
  - [ ] Probability percentages visible
  - [ ] Recommendations shown

- [ ] **Medications Tab** displays
  - [ ] Multiple medication cards
  - [ ] Each card is expandable
  - [ ] Can see interaction alerts (if any)

- [ ] **Lab Results Tab** shows
  - [ ] Table with test names and values
  - [ ] Reference ranges shown
  - [ ] Some results highlighted (abnormal)

#### Test AI Consultation

- [ ] Click **AI Consultation Tab**
- [ ] Message input field visible
- [ ] Suggested questions appear in sidebar
- [ ] Type test question: "What is the BMI status?"
- [ ] Submit message
- [ ] **Watch server logs** for Anthropic API call
  - [ ] Should see message: "Consulting with Claude..."
  - [ ] Should see response streaming in
- [ ] Response appears in chat
- [ ] Message preserves conversation history
- [ ] Can ask follow-up questions

---

## ⚠️ Step 7: Error Handling Verification

### Task: Ensure System Handles Errors Gracefully

#### Test Missing API Key

- [ ] Temporarily remove `ANTHROPIC_API_KEY` from `.env`
- [ ] Try to send message
- [ ] Should see error message in UI
- [ ] Should NOT crash the application
- [ ] Restore API key

#### Test Network Disconnect

- [ ] Disable internet temporarily
- [ ] Try to load `/clinical` page
- [ ] Should show error about Supabase
- [ ] Re-enable internet
- [ ] Page refreshes and works

#### Test Invalid Token

- [ ] Open DevTools → Application → localStorage
- [ ] Find `mediguide-auth-storage`
- [ ] Edit token to invalid value
- [ ] Refresh page
- [ ] Should redirect to login
- [ ] Login again with valid credentials

---

## 📊 Step 8: Performance Baseline

### Task: Document System Performance

#### Measure Response Times

- [ ] Dashboard tab loads in < 1 second
- [ ] AI consultation responds in 2-5 seconds (streaming)
- [ ] Differential Dx tab loads in < 1 second
- [ ] Medications tab loads in < 1 second
- [ ] Labs tab loads in < 1 second

#### Monitor Resource Usage

```bash
# Check server memory
top | grep node

# Should be < 100MB RAM
```

- [ ] Server memory usage: **\_** MB
- [ ] Server CPU usage: **\_** %
- [ ] Frontend bundle size: **\_** KB

---

## 🔒 Step 9: Security Verification

### Task: Ensure Sensitive Data Is Protected

- [ ] **API Keys Protection**
  - [ ] `.env` file is in `.gitignore`
  - [ ] No API keys logged in console
  - [ ] No API keys exposed in browser DevTools

- [ ] **JWT Security**
  - [ ] Token stored in localStorage (used for XSS protection)
  - [ ] Token includes expiration (30 days)
  - [ ] Token validated on every request

- [ ] **HTTPS Readiness**
  - [ ] Routes designed for HTTPS deployment
  - [ ] API calls are HTTPS-ready
  - [ ] CORS configured correctly

---

## 📋 Step 10: Documentation Review

### Task: Ensure You Have All Documentation

- [ ] `CLINICAL_QUICK_START.md` - This quick start guide ✅
- [ ] `CLINICAL_SYSTEM_GUIDE.md` - Complete system documentation
- [ ] `MIGRATION_GUIDE.md` - Database migration from MongoDB
- [ ] `AUTH_SYSTEM.md` - Authentication system details
- [ ] `README.md` - Project overview

**Location:** `mediguide-ai-healthcare-assistant/` root directory

---

## 🎯 Final Checklist

Before considering the system "launch ready":

### Backend (server/)

- [ ] `npm run dev` starts without errors
- [ ] Supabase connection confirmed
- [ ] All 7 clinical endpoints accessible
- [ ] JWT middleware protecting routes
- [ ] Anthropic API key configured
- [ ] Rate limiting in place
- [ ] Error handling functional

### Frontend (client/)

- [ ] `npm run dev` starts successfully
- [ ] All pages load without 404 errors
- [ ] ClinicalDashboard component mounts
- [ ] Navbar shows "Clinical AI" link
- [ ] All 5 tabs render properly
- [ ] Zustand auth store working
- [ ] API interceptors attaching tokens

### Integration

- [ ] Authenticated requests succeed
- [ ] AI consultation returns responses
- [ ] Suggested questions load properly
- [ ] Patient data displays correctly
- [ ] No console errors when using

### Documentation

- [ ] All guide files present
- [ ] Quick start guide reviewed
- [ ] System architecture understood
- [ ] Common issues documented
- [ ] Setup steps verified

---

## 🚨 Troubleshooting Quick Reference

| Issue                         | Check                | Solution                         |
| ----------------------------- | -------------------- | -------------------------------- |
| "API key not found"           | `server/.env`        | Add ANTHROPIC_API_KEY            |
| "Supabase connection failed"  | Database config      | Verify SUPABASE_URL, credentials |
| "401 Unauthorized"            | Browser localStorage | Log out and log back in          |
| "Cannot find module"          | Install dependencies | Run `npm install`                |
| "Port 5000 already in use"    | Other processes      | Kill process on port 5000        |
| "ClinicalDashboard not found" | Routes config        | Check App.jsx has import + route |

---

## ✅ Launch Sign-Off

Once all checkboxes above are completed, **your system is ready for:**

- ✅ **Development Use** - Testing and iteration
- ✅ **Demo/PoC** - Showing to stakeholders
- ✅ **Internal Alpha** - Small team testing
- ⚠️ **Production** - Requires additional preparation:
  - [ ] HIPAA compliance review
  - [ ] Security audit
  - [ ] Performance load testing
  - [ ] Backup strategy
  - [ ] Monitoring/alerting setup
  - [ ] Legal review of AI limitations

---

## 📞 Next Steps After Launch

1. **Customize Patient Data** (~2-3 hours)
   - Update `clinicalDataService.generateMockPatientData()`
   - Add real patient attributes
   - Adjust vital sign ranges

2. **Optimize Prompts** (~4-6 hours)
   - Update `aiConsultationService.CLINICAL_SYSTEM_PROMPT`
   - Test with real clinical scenarios
   - Refine based on feedback

3. **Connect Real EHR** (~2-3 days)
   - Integrate with FHIR APIs
   - Replace mock data with real patient records
   - Handle authentication with EHR system

4. **Add Specialty Support** (~1 week)
   - Create specialty-specific prompts
   - Add specialty-specific data models
   - Test with domain experts

---

**Date Started:** **\*\***\_**\*\***

**Date Completed:** **\*\***\_**\*\***

**Verified By:** **\*\***\_**\*\***

**Notes/Issues Encountered:**

```
[Use this space to document any issues found during setup]
```

---

**System Status:** 🟢 Ready to Use | 🟡 Needs Work | 🔴 Blocked

**Ready for Next Phase?** [ ] Yes [ ] No
