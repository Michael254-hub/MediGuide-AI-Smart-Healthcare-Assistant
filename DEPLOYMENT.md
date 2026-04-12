# MediGuide Deployment Checklist

This project is deployment-ready for Vercel as two separate projects from the same repository:

- `client/` for the React frontend
- `server/` for the Express API

Use this checklist when creating or updating the Vercel projects.

## 1. Frontend Project

Create a Vercel project with these settings:

- Project root: `client`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Files already added for this setup:

- `client/vercel.json`
- `client/.env.example`

### Frontend Environment Variables

Add these in the Vercel dashboard for the `client` project:

| Variable | Source |
| --- | --- |
| `VITE_API_URL` | Copy from `client/.env` if present, otherwise use `https://<your-api-domain>/api/v1` |
| `VITE_SUPABASE_URL` | Copy from `client/.env` |
| `VITE_SUPABASE_ANON_KEY` | Copy from `client/.env` |

### Frontend Post-Deploy Check

- Open the deployed frontend URL
- Confirm login/register screens load
- Confirm requests target the deployed API, not `localhost`
- Confirm deep links such as `/login` and `/verify-phone` work on refresh

## 2. Backend Project

Create a second Vercel project with these settings:

- Project root: `server`
- Framework preset: `Express`

Files already added for this setup:

- `server/vercel.json`
- `server/.env.example`

### Backend Environment Variables

Add these in the Vercel dashboard for the `server` project:

| Variable | Source |
| --- | --- |
| `NODE_ENV` | Set to `production` |
| `APP_BASE_URL` | Your frontend production URL |
| `CORS_ORIGIN` | Your frontend production URL, or a comma-separated list of allowed frontend origins |
| `JWT_SECRET` | Copy from `server/.env` |
| `VERIFICATION_SESSION_SECRET` | Copy from `server/.env` |
| `VERIFICATION_SESSION_TTL` | Copy from `server/.env` |
| `VERIFICATION_CODE_TTL_MINUTES` | Copy from `server/.env` |
| `VERIFICATION_MAX_ATTEMPTS` | Copy from `server/.env` |
| `VERIFICATION_RESEND_COOLDOWN_SECONDS` | Copy from `server/.env` |
| `SUPABASE_URL` | Copy from `server/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Copy from `server/.env` |
| `RESEND_API_KEY` | Copy from `server/.env` |
| `RESEND_FROM_EMAIL` | Copy from `server/.env` |
| `SMS_PROVIDER` | Copy from `server/.env` |
| `SMS_WEBHOOK_URL` | Copy from `server/.env` if used |
| `SMS_WEBHOOK_AUTH_HEADER` | Copy from `server/.env` if used |
| `SMS_WEBHOOK_AUTH_TOKEN` | Copy from `server/.env` if used |
| `SMS_SENDER_ID` | Copy from `server/.env` |
| `GEMINI_API_KEY` | Copy from `server/.env` |
| `GEMINI_MODEL` | Copy from `server/.env` or use `gemini-2.5-flash` |
| `AT_API_KEY` | Copy from `server/.env` if using Africa's Talking |
| `AT_USERNAME` | Copy from `server/.env` if using Africa's Talking |
| `EMAIL_PROVIDER` | Copy from `server/.env` if set |
| `NODEMAILER_HOST` | Copy from `server/.env` if using SMTP |
| `NODEMAILER_PORT` | Copy from `server/.env` if using SMTP |
| `NODEMAILER_USER` | Copy from `server/.env` if using SMTP |
| `NODEMAILER_PASSWORD` | Copy from `server/.env` if using SMTP |
| `NODEMAILER_FROM_EMAIL` | Copy from `server/.env` if using SMTP |
| `NODEMAILER_SECURE` | Copy from `server/.env` if using SMTP |

### Backend Post-Deploy Check

- Open `https://<your-api-domain>/api/v1/health`
- Confirm the API returns a healthy response
- Confirm authentication endpoints respond
- Confirm CORS allows requests from the deployed frontend
- Confirm email, SMS, and Gemini-backed flows work with production credentials

## 3. Recommended Domain Layout

- Frontend: `https://app.yourdomain.com`
- API: `https://api.yourdomain.com`

If you use preview deployments, add preview frontend URLs to `CORS_ORIGIN` as a comma-separated list.

Example:

```env
CORS_ORIGIN=https://app.yourdomain.com,https://mediguide-web-git-main-your-team.vercel.app
```

## 4. Final Release Checklist

- Frontend project connected to `client/`
- Backend project connected to `server/`
- All required environment variables added in Vercel
- Frontend `VITE_API_URL` points to the deployed API with `/api/v1`
- Backend `CORS_ORIGIN` includes the deployed frontend
- Custom domains assigned, if using them
- Production deploy succeeds for both projects
- Login, verification, symptoms, admin, and AI consultation flows verified
