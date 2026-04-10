# End-to-End Authentication Testing Plan

**Date:** April 10, 2026  
**Status:** Ready for execution  
**Priority:** Verify all auth flows work correctly before deployment

---

## 🧪 Testing Strategy

### Test Environment Setup

- **Frontend**: Vite dev server (default: http://localhost:5173)
- **Backend**: Express server (default: http://localhost:5000)
- **Database**: Supabase PostgreSQL
- **Browser**: Chrome with DevTools Network tab
- **Test Data**: Test credentials for validation

---

## ✅ Test Cases by Flow

### **FLOW 1: Registration with Email**

**Test Case 1.1: Valid Email Registration**

```
Input:
  - Name: "John Doe"
  - Email: "john.doe@example.com"
  - Password: "SecurePass123!"
  - Confirm: "SecurePass123!"

Expected Behavior:
  ✓ Form validates without errors
  ✓ Loading spinner appears on submit
  ✓ User redirected to /verify-account
  ✓ pendingVerification state populated
  ✓ User receives verification code (email/SMS)
  ✓ No user record fully created until verification

Verification:
  - [ ] Database: Check users table (not verified yet)
  - [ ] Database: Check verification_challenges table (record exists)
  - [ ] Network: POST /auth/register returns 201
```

**Test Case 1.2: Email Already Exists**

```
Input: Register with existing email

Expected Behavior:
  ✓ Form submits
  ✓ Error message: "Email already exists" or similar
  ✓ User stays on /register page
  ✓ Can modify input and try again

Verification:
  - [ ] Network: POST /auth/register returns 400
  - [ ] Response includes code: 'EMAIL_EXISTS'
```

**Test Case 1.3: Invalid Email Format**

```
Input Examples:
  - "notanemail"
  - "user@"
  - "@example.com"
  - "user @ example.com"

Expected Behavior:
  ✓ Client-side validation prevents submit
  ✓ Error message appears under field
  ✓ Error: "Please enter a valid email address or phone number"

Verification:
  - [ ] Form submit button disabled or error shown
  - [ ] No API call made
```

**Test Case 1.4: Weak Password**

```
Input:
  - Password: "123" (less than 6 chars)

Expected Behavior:
  ✓ Client-side validation triggers
  ✓ Error: "Password must be at least 6 characters"
  ✓ Submit button disabled

Verification:
  - [ ] No API call made
```

**Test Case 1.5: Password Mismatch**

```
Input:
  - Password: "SecurePass123!"
  - Confirm: "DifferentPass123!"

Expected Behavior:
  ✓ Client validation triggers
  ✓ Error: "Passwords do not match"
  ✓ Submit prevented

Verification:
  - [ ] Error appears below confirmPassword field
```

---

### **FLOW 2: Registration with Phone Number**

**Test Case 2.1: Valid Phone Registration**

```
Input:
  - Name: "Jane Smith"
  - Phone: "+254712345678"
  - Password: "SecurePass123!"
  - Confirm: "SecurePass123!"

Expected Behavior:
  ✓ Form validates phone format
  ✓ Redirects to /verify-account
  ✓ SMS verification code sent
  ✓ pendingVerification includes SMS details

Verification:
  - [ ] Network: POST /auth/register with emailOrPhone: "+254712345678"
  - [ ] Response includes verification session token
  - [ ] SMS provider called (check logs/webhook)
```

**Test Case 2.2: Phone Number Already Exists**

```
Input: Register with existing phone

Expected Behavior:
  ✓ Error: "Phone number already registered"
  ✓ Stay on /register
  ✓ Can retry with different number

Verification:
  - [ ] Network: Returns 400 with code: 'PHONE_EXISTS'
```

**Test Case 2.3: Invalid Phone Format**

```
Input Examples:
  - "123" (too short)
  - "+0712345678" (invalid country code 0)
  - "abc-def-ghij" (non-numeric)

Expected Behavior:
  ✓ Client validation rejects
  ✓ Error: "Please enter a valid email address or phone number"
  ✓ Submit prevented

Verification:
  - [ ] No API call made
```

**Test Case 2.4: Multiple Phone Formats**

```
Input Variants (should all work):
  - "+254712345678"
  - "254712345678"
  - "+1 (555) 123-4567"
  - "001-541-754-3010"

Expected Behavior:
  ✓ All valid formats accepted
  ✓ Normalized before storage
  ✓ Consistent lookup later

Verification:
  - [ ] Backend receives normalized format
  - [ ] Phone lookup works with any format variant
```

---

### **FLOW 3: Email/Phone Verification**

**Test Case 3.1: Valid Verification Code**

```
Input:
  - Complete registration flow first
  - Receive 6-digit code
  - Enter code on /verify-account

Expected Behavior:
  ✓ Form validates 6-digit format
  ✓ Loading spinner on submit
  ✓ Success: Redirected to /dashboard (or /admin for admin role)
  ✓ User marked as verified in database

Verification:
  - [ ] Network: POST /auth/verification/confirm returns 200
  - [ ] Database: user.email_verified or phone_verified = TRUE
  - [ ] AuthContext.user populated with token
  - [ ] authStore shows user as authenticated
```

**Test Case 3.2: Invalid Verification Code**

```
Input:
  - Wrong code: "000000"
  - Code from different user's session

Expected Behavior:
  ✓ Error message appears
  ✓ Error: "Invalid verification code" or "Code expired"
  ✓ Stay on /verify-account
  ✓ Can retry or request new code

Verification:
  - [ ] Network: Returns 400 or 403
  - [ ] Verification challenge attempt_count incremented
```

**Test Case 3.3: Code Expired (>24 hours)**

```
Setup:
  - Manually set verification challenge expires_at to past time

Input: Enter valid code that expired

Expected Behavior:
  ✓ Error: "Verification code has expired"
  ✓ Can click "Resend Code" button
  ✓ New code generated and sent

Verification:
  - [ ] Old challenge marked as invalidated
  - [ ] New challenge created
```

**Test Case 3.4: Max Attempts Exceeded (5 attempts)**

```
Setup:
  - Attempt verification 5 times with wrong codes

Input: 6th attempt with any code

Expected Behavior:
  ✓ Error: "Too many failed attempts"
  ✓ Must request new code
  ✓ Session reset

Verification:
  - [ ] Verification challenge blocked after 5 attempts
  - [ ] New challenge can be created via resend
```

**Test Case 3.5: Resend Verification Code**

```
Setup:
  - On /verify-account with pending code

Input: Click "Resend Code" button

Expected Behavior:
  ✓ Button disabled with countdown (e.g., "Resend in 30s")
  ✓ New code sent to email/SMS
  ✓ Success message: "Code sent to [contact]"
  ✓ Can use new code to verify

Verification:
  - [ ] Network: POST /auth/verification/resend
  - [ ] New code delivered within 10 seconds
  - [ ] Old code becomes invalid
```

---

### **FLOW 4: Login with Email**

**Test Case 4.1: Login After Verification**

```
Setup:
  - Complete registration + verification with email

Input:
  - Email: "john.doe@example.com"
  - Password: "SecurePass123!"

Expected Behavior:
  ✓ Form validates
  ✓ Loading spinner on submit
  ✓ Redirected to /dashboard
  ✓ User object in authContext
  ✓ Token in localStorage

Verification:
  - [ ] Network: POST /auth/login returns 200
  - [ ] Response includes user object + token
  - [ ] authStore.user populated
  - [ ] Authorization header set for future requests
```

**Test Case 4.2: Login with Unverified Account**

```
Setup:
  - Create user account but manually unverify in database

Input: Try to login with valid credentials

Expected Behavior:
  ✓ Error: "Please verify your email address before logging in"
  ✓ Redirected to /verify-account
  ✓ pendingVerification state set
  ✓ Can complete verification flow

Verification:
  - [ ] Network: Returns 403 with code: 'VERIFICATION_REQUIRED'
  - [ ] Response includes pendingVerification data
```

**Test Case 4.3: Invalid Password**

```
Input:
  - Email: "john.doe@example.com"
  - Password: "WrongPassword123!"

Expected Behavior:
  ✓ Error: "Invalid email/phone or password"
  ✓ Stay on /login page
  ✓ No details about which field is wrong (security best practice)

Verification:
  - [ ] Network: Returns 401 with code: 'INVALID_CREDENTIALS'
  - [ ] No user data in response
```

**Test Case 4.4: Non-existent Email**

```
Input:
  - Email: "nonexistent@example.com"
  - Password: "AnyPassword123!"

Expected Behavior:
  ✓ Error: "Invalid email/phone or password"
  ✓ Stay on /login
  ✓ Same message as wrong password (no user enumeration)

Verification:
  - [ ] Network: Returns 401
  - [ ] No indication if user exists or password is wrong
```

**Test Case 4.5: Pending Verification Alert**

```
Setup:
  - authStore has pendingVerification set

Input: User on /login page

Expected Behavior:
  ✓ Amber alert box appears: "Your account still needs verification"
  ✓ "Finish verification" link navigates to /verify-account
  ✓ Alert disappears after verification

Verification:
  - [ ] Alert visible in DOM
  - [ ] Link functional
```

---

### **FLOW 5: Login with Phone**

**Test Case 5.1: Login with Phone Number**

```
Setup:
  - Registered and verified with phone: "+254712345678"

Input:
  - emailOrPhone: "+254712345678"
  - Password: "SecurePass123!"

Expected Behavior:
  ✓ Login succeeds
  ✓ Redirected to /dashboard
  ✓ Same user data as email login

Verification:
  - [ ] Network: POST /auth/login accepts phone number
  - [ ] User lookup finds phone record
  - [ ] Token issued correctly
```

**Test Case 5.2: Phone Number Case Sensitivity**

```
Input Variants (should all find same user):
  - "+254712345678"
  - "254712345678" (without +)
  - "+254 712 345 678" (with spaces)
  - "+254-712-345-678" (with dashes)

Expected Behavior:
  ✓ All variants find the user
  ✓ Login succeeds with each variant

Verification:
  - [ ] normalizePhone() handles variants
  - [ ] User lookup uses normalized format
```

---

### **FLOW 6: Forgot Password / Password Reset**

**Test Case 6.1: Forgot Password with Email**

```
Setup:
  - On /login page
  - Registered account with email

Input:
  1. Click "Forgot your password?" link
  2. Enter email: "john.doe@example.com"
  3. Click "Continue"

Expected Behavior:
  ✓ Form appears with emailOrPhone input
  ✓ Valid email passes validation
  ✓ Loading spinner on submit
  ✓ Success message: "Password reset instructions sent..."
  ✓ Redirected to /reset-password with state:
    - emailOrPhone
    - resetToken (in dev mode)
    - resetMessage

Verification:
  - [ ] Network: POST /auth/request-password-reset
  - [ ] Email sent within 5 seconds
  - [ ] Database: password_reset_token set on user
  - [ ] Token expiry: 1 hour from now
```

**Test Case 6.2: Forgot Password with Phone**

```
Input:
  - emailOrPhone: "+254712345678"

Expected Behavior:
  ✓ Phone validation passes
  ✓ SMS sent with reset instructions
  ✓ Redirected to /reset-password

Verification:
  - [ ] SMS provider called
  - [ ] Message includes reset link or token
  - [ ] Token valid for 1 hour
```

**Test Case 6.3: Forgot Password Non-existent Account**

```
Input:
  - Email: "nonexistent@example.com"

Expected Behavior:
  ✓ No error shown (security: don't reveal user existence)
  ✓ Generic message: "If an account exists, reset instructions sent"
  ✓ Redirect to /reset-password anyway

Verification:
  - [ ] Network: Returns 200 (no 404 or 400)
  - [ ] No email sent (backend confirms)
  - [ ] No indication whether account exists
```

**Test Case 6.4: Valid Password Reset**

```
Setup:
  - Have resetToken and emailOrPhone from 6.1

Input on /reset-password:
  - emailOrPhone: "john.doe@example.com"
  - resetToken: "[token from email/SMS]"
  - newPassword: "NewSecurePass456!"
  - confirmPassword: "NewSecurePass456!"

Expected Behavior:
  ✓ All fields validate
  ✓ Loading spinner on submit
  ✓ Success message
  ✓ Redirected to /dashboard
  ✓ User can login with new password
  ✓ Old password no longer works

Verification:
  - [ ] Network: POST /auth/reset-password returns 200
  - [ ] Database: password updated + hashed
  - [ ] Database: password_reset_token cleared
  - [ ] authStore.user set (auto-login after reset)
  - [ ] Next login with old password fails
```

**Test Case 6.5: Invalid Reset Token**

```
Input:
  - Use fake/wrong token: "invalidtoken123"

Expected Behavior:
  ✓ Error: "Invalid or expired reset token"
  ✓ Stay on /reset-password
  ✓ Can go back to /login and restart

Verification:
  - [ ] Network: Returns 400 with code: 'INVALID_RESET_TOKEN'
  - [ ] Password not changed in database
```

**Test Case 6.6: Expired Reset Token (>1 hour)**

```
Setup:
  - Manually set password_reset_expires_at to past time

Input: Use valid but expired token

Expected Behavior:
  ✓ Error: "Password reset token has expired"
  ✓ User must request new reset
  ✓ Link to /login or "Forgot password?" flow

Verification:
  - [ ] Network: Returns 400 with code: 'RESET_TOKEN_EXPIRED'
```

**Test Case 6.7: Token Used for Wrong User**

```
Setup:
  - Generate reset token for User A
  - Try to use it for User B's email

Input:
  - emailOrPhone: "user.b@example.com"
  - resetToken: "[token generated for user.a@example.com]"

Expected Behavior:
  ✓ Error: "Invalid or expired reset token"
  ✓ Security: doesn't reveal token is for different user

Verification:
  - [ ] Network: Returns 400
  - [ ] User B password unchanged
```

---

### **FLOW 7: Session Persistence & Logout**

**Test Case 7.1: Session Persistence (localStorage)**

```
Setup:
  - Login successfully

Input:
  1. Browser DevTools → Application → localStorage
  2. Verify data
  3. Refresh page
  4. Check authStore

Expected Behavior:
  ✓ localStorage has key: "mediguide-auth-storage"
  ✓ Contains user object + token
  ✓ After refresh: user still logged in
  ✓ /dashboard loads without login redirect

Verification:
  - [ ] localStorage not empty after login
  - [ ] Data persists across refresh
  - [ ] PrivateRoute allows access
```

**Test Case 7.2: Logout Clears Storage**

```
Setup:
  - User logged in

Input:
  1. Click logout button/link
  2. Check localStorage

Expected Behavior:
  ✓ Redirected to /login
  ✓ localStorage cleared
  ✓ authContext.user = null
  ✓ Cannot access /dashboard (redirected to login)

Verification:
  - [ ] localStorage.mediguide-auth-storage exists but user is null
  - [ ] PrivateRoute redirects to /login
```

**Test Case 7.3: Expired Token (401 Response)**

```
Setup:
  - Logged in with valid token
  - Manually expire token in database

Input: Navigate to /dashboard (trigger API call)

Expected Behavior:
  ✓ API returns 401
  ✓ Interceptor catches 401
  ✓ Auto-logout
  ✓ Redirected to /login
  ✓ localStorage cleared

Verification:
  - [ ] Network: GET /auth/profile returns 401
  - [ ] Response interceptor triggers logout
  - [ ] User redirected to /login
```

---

### **FLOW 8: Role-Based Redirects**

**Test Case 8.1: Patient Dashboard Redirect**

```
Setup:
  - Login with user role = 'patient'

Input: Complete login flow

Expected Behavior:
  ✓ Redirected to /dashboard (not /admin)
  ✓ See patient-specific features
  ✓ Cannot access /admin

Verification:
  - [ ] AuthContext returns role: 'patient'
  - [ ] Navigate to /admin → redirected to /dashboard
```

**Test Case 8.2: Admin Dashboard Redirect**

```
Setup:
  - Login with user role = 'admin'

Input: Complete login flow

Expected Behavior:
  ✓ Redirected to /admin (not /dashboard)
  ✓ See admin-specific controls
  ✓ Can view AdminDashboard component

Verification:
  - [ ] AuthContext returns role: 'admin'
  - [ ] PrivateRoute checks role
```

---

## 📊 Test Execution Checklist

### Pre-Testing Setup

- [ ] Backend server running (`npm start` in /server)
- [ ] Frontend dev server running (`npm run dev` in /client)
- [ ] Supabase database connected and schema created
- [ ] Email provider configured (Resend or console)
- [ ] SMS provider configured (webhook or console)
- [ ] Browser DevTools open (Network + Console tabs)
- [ ] Test user accounts cleared from database

### Test Prioritization

**Must Test First** (Core Functionality):

- [ ] Registration with email
- [ ] Email verification
- [ ] Login with email
- [ ] Password reset flow
- [ ] Session persistence

**Should Test** (Phone Support):

- [ ] Registration with phone
- [ ] Phone verification
- [ ] Login with phone
- [ ] Phone password reset

**Nice to Test** (Edge Cases):

- [ ] Multiple format variants
- [ ] Error messages
- [ ] Expired tokens
- [ ] Rate limiting (if implemented)

---

## 🐛 Bug Report Template

When you find an issue, document it like this:

```
**Bug Title:** [Concise description]

**Severity:** Critical | High | Medium | Low

**Test Case:** [Reference test case number: 1.1, 3.2, etc.]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Logs:**
[Paste error from console or network tab]

**Environment:**
- OS: Windows/Mac/Linux
- Browser: Chrome 130 / Firefox 131
- Server running: Yes/No
- Database: Supabase connected
```

---

## ✨ Success Criteria

All testing is **COMPLETE** when:

- ✅ All 8 flows tested end-to-end
- ✅ No critical bugs found
- ✅ All error cases handled gracefully
- ✅ Email/SMS delivery verified
- ✅ Database state correct after each flow
- ✅ localStorage persists correctly
- ✅ 401 interceptor working
- ✅ Role-based redirects functional

---

**Next Step:** Execute test cases in order. Report any findings in the bug template above.
