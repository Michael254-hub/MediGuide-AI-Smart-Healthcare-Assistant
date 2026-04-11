# 🚀 Production Deployment Guide

**Status:** Refactored for production-ready email/SMS verification  
**Date:** April 11, 2026  
**Architecture:** Secure delivery-only (no console logging of codes)

---

## ✅ What Changed

### Production Safety Changes

- ✅ **Removed development OTP display** from UI
- ✅ **Blocked console logging** in production environment
- ✅ **Enforced email/SMS providers** in production
- ✅ **Added startup validation** for credentials

### Architecture Improvements

1. **Console Provider** (Development Only)
   - Logs codes to server terminal for testing
   - BLOCKED in production
   - Clearly marked as deprecated

2. **Nodemailer Provider** (Production-Ready)
   - Sends real emails via SMTP
   - Secure credential handling
   - Connection verification on startup

3. **SMS Provider** (Production-Ready)
   - Webhook-based delivery
   - External SMS service integration
   - BLOCKED in production without config

---

## 📋 Production Deployment Checklist

### Before Deploying to Production

#### ✅ Step 1: Email Provider Configuration

**Option A: Gmail (For Testing)**

```env
NODE_ENV=production
EMAIL_PROVIDER=nodemailer
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_SECURE=false
NODEMAILER_USER=your.email@gmail.com
NODEMAILER_PASSWORD=your-app-password
NODEMAILER_FROM_EMAIL=MediGuide <your.email@gmail.com>
```

**Option B: AWS SES (Production Recommended)**

```env
NODE_ENV=production
EMAIL_PROVIDER=nodemailer
NODEMAILER_HOST=email-smtp.us-east-1.amazonaws.com
NODEMAILER_PORT=587
NODEMAILER_SECURE=false
NODEMAILER_USER=AKIA...
NODEMAILER_PASSWORD=...generated-password...
NODEMAILER_FROM_EMAIL=noreply@yourdomain.com
```

**Option C: Sendgrid**

```env
NODE_ENV=production
EMAIL_PROVIDER=nodemailer
NODEMAILER_HOST=smtp.sendgrid.net
NODEMAILER_PORT=587
NODEMAILER_SECURE=false
NODEMAILER_USER=apikey
NODEMAILER_PASSWORD=SG.xxxx...
NODEMAILER_FROM_EMAIL=noreply@yourdomain.com
```

**Option D: Resend (Modern Alternative)**

```env
NODE_ENV=production
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxx...
RESEND_FROM_EMAIL=MediGuide <noreply@yourdomain.com>
```

#### ✅ Step 2: SMS Provider Configuration

**For Phone Verification, Configure SMS Webhook**

```env
SMS_PROVIDER=webhook
SMS_WEBHOOK_URL=https://your-sms-service.com/send
SMS_WEBHOOK_AUTH_HEADER=Authorization
SMS_WEBHOOK_AUTH_TOKEN=Bearer xxx...
SMS_SENDER_ID=MediGuide
```

**Supported SMS Services:**

- Twilio
- AWS SNS
- MessageBird
- Nexmo/Vonage
- Firebase Cloud Messaging
- (Any service with HTTP webhook)

#### ✅ Step 3: Security Configuration

```env
# Production security settings
NODE_ENV=production
JWT_SECRET=generate-a-long-cryptographically-secure-string
VERIFICATION_SESSION_SECRET=another-secure-random-string

# Set appropriate expiry times for production
VERIFICATION_CODE_TTL_MINUTES=10
VERIFICATION_MAX_ATTEMPTS=5
VERIFICATION_RESEND_COOLDOWN_SECONDS=60

# CORS - Set to your actual production domain
CORS_ORIGIN=https://yourapp.com
APP_BASE_URL=https://yourapp.com
```

#### ✅ Step 4: Database Configuration

```env
# Supabase credentials (use production instance, not development)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### ✅ Step 5: Validation

Before starting the server in production, it will validate:

```
✓ EMAIL_PROVIDER configured (nodemailer OR resend)
✓ SMTP credentials complete (HOST, USER, PASSWORD)
✓ Database connection working
✓ JWT secret set
✓ All required env variables present
```

If validation fails, the server **WILL NOT START**.

---

## 🔒 Security Best Practices

### 1. Never Log Codes in Production

- ✅ Codes only sent via email/SMS
- ✅ Never displayed in UI
- ✅ Never logged to console
- ✅ Console logging BLOCKED with error

### 2. Credential Management

- ✅ All credentials in `.env` (never committed to git)
- ✅ Use `.env.example` to document required vars
- ✅ Rotate credentials regularly
- ✅ Use service-specific tokens, not personal passwords

### 3. Email/SMS Security

- ✅ Use TLS encryption (port 587 with STARTTLS)
- ✅ Or SSL (port 465)
- ✅ Never send codes in email subject line
- ✅ Include expiry time in delivery

### 4. Rate Limiting

- Already configured: 100 requests per 15 minutes per IP
- Code verification: Max 5 attempts per challenge
- Code resend: 60-second cooldown

### 5. Token Management

- Session tokens expire after 1 day
- Verification codes expire after 10 minutes
- Reset tokens expire after 1 hour
- All timestamps are server-side validated

---

## 📦 Environment Variable Template

Create `.env.production` with these variables:

```env
# CORE SETTINGS
NODE_ENV=production
PORT=5000
APP_BASE_URL=https://mediguide.app
CORS_ORIGIN=https://mediguide.app

# DATABASE
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# SECURITY
JWT_SECRET=generate-secure-random-string-64-chars-minimum
VERIFICATION_SESSION_SECRET=another-secure-random-string

# EMAIL PROVIDER (Choose ONE)
# Option A: Nodemailer with SMTP
EMAIL_PROVIDER=nodemailer
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_SECURE=false
NODEMAILER_USER=noreply@mediguide.app
NODEMAILER_PASSWORD=your-app-password
NODEMAILER_FROM_EMAIL=MediGuide <noreply@mediguide.app>

# Option B: Resend (commented out if using Nodemailer)
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=re_xxxx...
# RESEND_FROM_EMAIL=MediGuide <noreply@mediguide.app>

# SMS PROVIDER (Required for phone verification)
SMS_PROVIDER=webhook
SMS_WEBHOOK_URL=https://sms-service.com/send
SMS_WEBHOOK_AUTH_HEADER=Authorization
SMS_WEBHOOK_AUTH_TOKEN=Bearer xxx...
SMS_SENDER_ID=MediGuide

# VERIFICATION SETTINGS
VERIFICATION_CODE_TTL_MINUTES=10
VERIFICATION_MAX_ATTEMPTS=5
VERIFICATION_RESEND_COOLDOWN_SECONDS=60

# OPTIONAL: API Keys
GEMINI_API_KEY=your-gemini-key
```

---

## ⚠️ Production Startup Validation

When you start the server with `NODE_ENV=production`, it will check:

```javascript
✓ NODE_ENV === 'production'
✓ Email provider configured (either nodemailer XOR resend)
✓ NODEMAILER_HOST and auth credentials present (if nodemailer)
✓ RESEND_API_KEY and email present (if resend)
✓ SMTP connection verified (for nodemailer)
✓ Database connection working
✓ JWT secrets configured
```

If any required config is missing or invalid:

```
FATAL: Email provider not configured.
You must set up EITHER Nodemailer OR Resend credentials.
Server will NOT start.
```

---

## 🧪 Testing Before Production

### Test Email Delivery

```bash
# Register with test email
POST /api/v1/auth/register
{
  "name": "Test User",
  "emailOrPhone": "test@example.com",
  "password": "TestPass123!"
}

# Check email inbox for verification code
# (Should arrive within 30 seconds)
```

### Test SMS Delivery

```bash
# Register with phone number
POST /api/v1/auth/register
{
  "name": "Test User",
  "emailOrPhone": "+254712345678",
  "password": "TestPass123!"
}

# Check phone for SMS with code
```

### Monitor Logs

```bash
# On production server, watch for delivery confirmations
tail -f logs/app.log | grep -i "email\|sms"

# Should see:
[NodemailerEmailProvider] Email sent successfully: test@example.com
[SMS Provider] SMS sent successfully: +254712345678
```

---

## 🚨 Troubleshooting Production Issues

### Issue: Server won't start in production

```
FATAL: Email provider not configured
```

**Solution:** Set EMAIL_PROVIDER, NODEMAILER_HOST/USER/PASSWORD in .env.production

### Issue: Emails not received

```
Check:
1. NODEMAILER credentials correct
2. Sender domain is trusted (may need SPF/DKIM records)
3. Recipient is checking spam folder
4. Check logs for SMTP errors
```

### Issue: Console still logging codes

```
This should NOT happen! If you see console logs, check:
1. NODE_ENV=production is SET
2. Provider factory is using nodemailer (not console)
3. Restart server after config change
```

### Issue: Rate limiting blocking users

```
By design! Users can:
- Verify: 5 attempts per code (then locked)
- Resend: Every 60 seconds
- Register: Reset after 15 minutes

This prevents brute force attacks.
```

---

## 📈 Monitoring in Production

### Key Metrics to Track

- Email delivery success rate
- SMS delivery success rate
- Verification attempt rate
- Failed login rate (possible attacks)
- Code expiry rate

### Alerts to Set Up

- Email send failures (>5% failure rate)
- SMS delivery issues (>10% failure rate)
- Excessive failed verification attempts
- Database connection errors
- SMTP connection errors

---

## 🔄 Deployment Steps

1. **Prepare environment variables**
   - Create `.env.production` with all required configs
   - Test each variable value

2. **Build and deploy**

   ```bash
   npm install --production
   npm run build
   NODE_ENV=production npm start
   ```

3. **Verify startup**
   - Server starts without errors
   - "SMTP connection verified successfully" appears
   - Health check responds: `GET /api/v1/health`

4. **Test critical paths**
   - Register with email
   - Verify with code from email
   - Login with verified account
   - Password reset flow

5. **Monitor logs**
   - Watch for errors first hour
   - Check email/SMS delivery status
   - Monitor for suspicious activity

---

## ✨ What's Disabled in Production

| Feature                      | Development | Production            |
| ---------------------------- | ----------- | --------------------- |
| Console logging of codes     | ✅ Yes      | ❌ No                 |
| OTP display in UI            | ✅ Yes      | ❌ No                 |
| Using console email provider | ✅ Yes      | ❌ Blocked with error |
| Using console SMS provider   | ✅ Yes      | ❌ Blocked with error |
| Unverified email/SMS sending | ⚠️ Allowed  | ✅ Enforced           |

---

## 📞 Support

For production deployment issues:

1. Check `.env.production` has all required variables
2. Run startup validation: `NODE_ENV=production npm start`
3. Check logs for specific error messages
4. Test SMTP connectivity: `telnet host port`
5. Verify email/SMS service credentials with provider

---

**Ready to deploy?** Follow the checklist and let me know if you hit any issues! 🚀
