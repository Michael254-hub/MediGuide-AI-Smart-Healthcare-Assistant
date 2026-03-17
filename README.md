# MediGuide

MediGuide is a MERN stack web-based healthcare assistance platform that functions as a Decision Support System (DSS) to assist users with symptom guidance.

> **Disclaimer:** MediGuide provides informational health guidance and does not replace professional medical advice, diagnosis, or treatment.

## Tech Stack
- **Frontend**: React (Vite), TailwindCSS, React Router, Zustand, React Hook Form + Zod
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT Auth, Zod Validation

## Features
- Secure Authentication (Patient & Admin Roles)
- Symptom Submission with duration and severity tracking
- Automated Triage Engine classifying risk levels (LOW, MEDIUM, HIGH, EMERGENCY)
- Admin Dashboard for monitoring submissions and risk distribution

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

### Installation

1. Clone the repository
2. Setup Backend:
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your specific MongoDB URI and JWT_SECRET
   npm install
   npm run dev
   ```
3. Setup Frontend:
   ```bash
   cd client
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

## Project Structure
This application enforces Clean Architecture on the backend (Separation of Routes, Controllers, Services, and Repositories) and modern React practices on the frontend.
