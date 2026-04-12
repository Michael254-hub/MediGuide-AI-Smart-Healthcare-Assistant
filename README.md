# MediGuide

MediGuide is a web-based healthcare assistance platform that functions as a Decision Support System (DSS) to assist users with symptom guidance.

> **Disclaimer:** MediGuide provides informational health guidance and does not replace professional medical advice, diagnosis, or treatment.

## Tech Stack
- **Frontend**: React (Vite), TailwindCSS, React Router, Zustand, React Hook Form + Zod
- **Backend**: Node.js, Express.js, Supabase, JWT Auth, Zod Validation, Google Gemini

## Features
- Secure Authentication (Patient & Admin Roles)
- Symptom Submission with duration and severity tracking
- Automated Triage Engine classifying risk levels (LOW, MEDIUM, HIGH, EMERGENCY)
- Admin Dashboard for monitoring submissions and risk distribution

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase

### Installation

1. Clone the repository
2. Setup Backend:
   ```bash
   cd server
   copy .env.example .env
   # Edit .env with your Supabase, JWT, email/SMS, and Gemini settings
   npm install
   npm run dev
   ```
3. Setup Frontend:
   ```bash
   cd client
   copy .env.example .env
   npm install
   npm run dev
   ```

### Default Ports
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### API Documentation (Swagger)
The API documentation is available via standard OpenAPI specification comments in the routes files. Key endpoints include:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/symptoms`
- `GET /api/v1/admin/stats`

## Deploying To Vercel

Deploy this monorepo as **two Vercel projects** from the same Git repository:

1. `client/` for the React frontend
2. `server/` for the Express API

### Files Added For Deployment

- `client/vercel.json` configures the Vite frontend and rewrites SPA routes to `index.html`
- `server/vercel.json` marks the backend as an Express project
- `client/.env.example` documents the required frontend environment variables

### Frontend Project (`client/`)

Create a Vercel project with:

- **Root Directory:** `client`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Set these environment variables in the Vercel dashboard:

- `VITE_API_URL=https://your-api-project.vercel.app/api/v1`
- `VITE_SUPABASE_URL=your_supabase_url`
- `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`

### Backend Project (`server/`)

Create a second Vercel project with:

- **Root Directory:** `server`
- **Framework Preset:** `Express`

Set these environment variables in the Vercel dashboard:

- `NODE_ENV=production`
- `APP_BASE_URL=https://your-frontend-project.vercel.app`
- `CORS_ORIGIN=https://your-frontend-project.vercel.app`
- `JWT_SECRET=...`
- `VERIFICATION_SESSION_SECRET=...`
- `VERIFICATION_SESSION_TTL=1d`
- `VERIFICATION_CODE_TTL_MINUTES=10`
- `VERIFICATION_MAX_ATTEMPTS=5`
- `VERIFICATION_RESEND_COOLDOWN_SECONDS=60`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `RESEND_API_KEY=...`
- `RESEND_FROM_EMAIL=...`
- `SMS_PROVIDER=console` or your production provider
- `SMS_WEBHOOK_URL=...` if using the webhook provider
- `SMS_WEBHOOK_AUTH_HEADER=...` if using the webhook provider
- `SMS_WEBHOOK_AUTH_TOKEN=...` if using the webhook provider
- `SMS_SENDER_ID=...`
- `GEMINI_API_KEY=...`
- `GEMINI_MODEL=gemini-2.5-flash`

### CORS And Preview Deployments

The backend now supports comma-separated `CORS_ORIGIN` values. That lets you allow more than one frontend origin, for example:

```env
CORS_ORIGIN=https://mediguide-web.vercel.app,https://mediguide-web-git-main-your-team.vercel.app
```

For production, a custom domain is the simplest setup. If you rely on Vercel preview deployments, add the preview frontend domain to `CORS_ORIGIN` as needed.

### Recommended Domain Layout

- Frontend: `https://app.yourdomain.com`
- API: `https://api.yourdomain.com`

After both projects are deployed, point the frontend `VITE_API_URL` at your deployed API URL including `/api/v1`.

## Project Structure
This application enforces Clean Architecture on the backend (Separation of Routes, Controllers, Services, and Repositories) and modern React practices on the frontend.
