# Authentication System - Complete Guide

## Overview

The MediGuide app uses a **JWT token-based authentication system** with **Zustand for state management**. This provides a clean, efficient auth flow across the application.

## Architecture

### 1. State Management (`store/authStore.js`)

- Uses **Zustand** with localStorage persistence
- Stores: `user` (object with id, name, email, phone, role, token), `isAuthenticated` (boolean)
- Methods: `login(userData)`, `logout()`

```javascript
{
  user: {
    id, name, email, phone, role, token
  },
  isAuthenticated: true/false
}
```

### 2. API Client (`services/api.js`)

- Axios instance with auto-interceptors
- **Request interceptor**: Automatically adds JWT token to all requests
  ```
  Authorization: Bearer {token}
  ```
- **Response interceptor**: Handles 401 errors by logging out and redirecting to login

### 3. Route Protection (`components/PrivateRoute.jsx`)

- Wraps protected routes
- Checks `isAuthenticated` from Zustand
- Redirects to `/login` if not authenticated
- Optional `requireAdmin` prop for admin-only routes

### 4. Navigation (`components/Navbar.jsx`)

- Shows different UI based on `isAuthenticated`
- Displays user name when logged in
- "Sign Out" button clears state and redirects to login

## Authentication Flow

### Registration (`pages/Register.jsx`)

```
User fills form → Validation (Zod) → POST /api/v1/auth/register
  ↓
Server creates user, returns { user: {..., token} }
  ↓
setLogin(user) → Zustand stores auth state + token
  ↓
Navigate to /dashboard
```

**Form Fields:**

- name (min 2 chars)
- email (valid email)
- phone (optional, E.164 format)
- password (min 6 chars)
- confirmPassword (must match password)

### Login (`pages/Login.jsx`)

```
User fills form → Validation (Zod) → POST /api/v1/auth/login
  ↓
Server verifies credentials, returns { user: {..., token} }
  ↓
setLogin(user) → Zustand stores auth state + token
  ↓
Role check:
  - admin → Navigate to /admin
  - patient → Navigate to /dashboard
```

**Form Fields:**

- email (valid email)
- password (required)

### Logout (`components/Navbar.jsx`)

```
User clicks "Sign Out"
  ↓
logout() → Zustand clears auth state
  ↓
Navigate to /login
```

## Protected Routes

### User Routes

```javascript
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
<Route path="/submit" element={<PrivateRoute><SubmitSymptoms /></PrivateRoute>} />
```

### Admin Routes

```javascript
<Route
  path="/admin"
  element={
    <PrivateRoute requireAdmin={true}>
      <AdminDashboard />
    </PrivateRoute>
  }
/>
```

If user is:

- Not authenticated → Redirects to `/login`
- Authenticated but not admin → Redirects to `/dashboard`
- Admin → Grants access to `/admin`

## API Integration

### Login/Register Response Format

```javascript
{
  success: true,
  user: {
    id: "uuid-string",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    role: "patient",  // or "admin"
    token: "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Authenticated Requests

All requests to protected endpoints automatically include:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Protected Endpoints:**

- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/symptoms/submit` - Submit symptoms
- `GET /api/v1/symptoms/history` - Get user's symptom history
- `GET /api/v1/admin/*` - Admin dashboard endpoints

### Error Handling

#### 401 Unauthorized

- Response interceptor automatically detects 401 errors
- Calls `logout()` to clear auth state
- Redirects to `/login` page
- Clears token from subsequent requests

#### Other Errors

- Caught by form-level error handlers
- Display user-friendly messages
- Do not clear auth state

## Token Storage

**Storage Location:** `localStorage`
**Storage Key:** `mediguide-auth-storage`
**Persistence:** Automatic with Zustand's persist middleware

**Data Structure:**

```json
{
  "state": {
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "token": "..."
    },
    "isAuthenticated": true
  }
}
```

## Security Considerations

✅ **Implemented:**

- JWT tokens with expiration (30 days from backend)
- Password validation (min 6 chars)
- Email validation
- Phone number validation (E.164 format)
- Automatic 401 error handling
- localStorage for token persistence
- Role-based route protection (admin vs patient)

⚠️ **Important:**

- Never store sensitive data clients-side except JWT
- JWT is sent via localStorage (not JSON in Headers for CSRF protection)
- Backend should verify token on every request
- Implement refresh token rotation on backend for production

## Common Patterns

### Accessing Auth State in Components

```javascript
import { useAuthStore } from "../store/authStore";

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <>
      {isAuthenticated && <p>Hello, {user.name}</p>}
      {user?.role === "admin" && <AdminTools />}
    </>
  );
}
```

### Making Authenticated Requests

```javascript
import api from "../services/api";

// Token is automatically added by interceptor
const response = await api.post("/symptoms/submit", {
  symptoms: "headache",
  duration: "2 hours",
  severity: "moderate",
});
```

### Handling Auth Changes

```javascript
const handleLogout = () => {
  logout(); // Zustand manages redirect via Navbar
};
```

## File Structure

```
client/src/
├── store/
│   └── authStore.js                 # Zustand state management
├── services/
│   └── api.js                       # Axios instance with interceptors
├── components/
│   ├── PrivateRoute.jsx             # Route protection wrapper
│   └── Navbar.jsx                   # Navigation & logout
├── pages/
│   ├── Login.jsx                    # Login form & logic
│   ├── Register.jsx                 # Registration form & logic
│   ├── Logout.jsx                   # Logout redirect page (optional)
│   ├── Dashboard.jsx                # Protected: User dashboard
│   ├── SubmitSymptoms.jsx           # Protected: Submit symptoms
│   └── AdminDashboard.jsx           # Protected: Admin panel
└── App.jsx                          # Main app with routes
```

## Testing Auth

### Test Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Test Protected Endpoint

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/auth/profile
```

### Test Token Expiry

Tokens expire in 30 days. After expiry:

- 401 response from server
- Client automatically logs out and redirects to login

## Troubleshooting

### "Not authenticated, token failed"

- Token may be expired (30 days)
- Solution: Log in again to get new token

### "User not found"

- User account was deleted
- Solution: Re-register with same email

### Token not sent with requests

- Check browser DevTools → Network
- Verify `Authorization` header is present
- Check localStorage for token

### Infinite redirect loop

- Check if `isAuthenticated` is consistent
- Verify Zustand store is persisting correctly
- Clear localStorage and log in again

## Future Enhancements

- [ ] Refresh token rotation
- [ ] OAuth/Social login
- [ ] Two-factor authentication
- [ ] Email verification
- [ ] Password reset flow
- [ ] Session timeout
- [ ] Remember me option
