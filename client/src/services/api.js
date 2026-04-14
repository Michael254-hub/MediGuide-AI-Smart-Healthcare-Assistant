import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    // Zustand's getState() allows accessing the store outside of React components
    const token = useAuthStore.getState().user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const authHeader = error.config?.headers?.Authorization;
    if (error.response && error.response.status === 401 && authHeader) {
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Optional: redirect to login
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  confirmVerification: (data, verificationToken) =>
    api.post('/auth/verification/confirm', data, {
      headers: {
        'X-Verification-Token': verificationToken,
      },
    }),
  resendVerification: (verificationToken) =>
    api.post(
      '/auth/verification/resend',
      {},
      {
        headers: {
          'X-Verification-Token': verificationToken,
        },
      }
    ),
  requestPasswordReset: (data) => api.post('/auth/request-password-reset', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
};

// Symptom API methods
export const symptomAPI = {
  getFollowUpQuestions: (data) => api.post('/symptoms/follow-up-questions', data),
  submitSymptoms: (data, config = {}) => api.post('/symptoms', data, config),
  getSymptomHistory: () => api.get('/symptoms/history'),
  getSingleSymptom: (id) => api.get(`/symptoms/${id}`),
};

export const patientProfileAPI = {
  getProfile: () => api.get('/patient-profile'),
  saveProfile: (data) => api.put('/patient-profile', data),
  getDeidentifiedProfile: () => api.get('/patient-profile/de-identified'),
};

export const professionalApplicationAPI = {
  getMine: () => api.get('/professional-applications/me'),
  submit: (data) => api.post('/professional-applications', data),
};

export const medicAPI = {
  getWorkspace: () => api.get('/medic/workspace'),
};

// MediChat API methods
export const mediChatAPI = {
  getPatientData: () => api.get('/medichat/patient-data'),
  getSuggestions: () => api.get('/medichat/suggestions'),
  sendMessage: ({ question, conversationHistory = [], attachments = [] }) => {
    if (attachments.length > 0) {
      const formData = new FormData();
      formData.append('question', question || '');
      formData.append('conversationHistory', JSON.stringify(conversationHistory));
      attachments.forEach((attachment) => {
        formData.append('attachments', attachment);
      });

      return api.post('/medichat/consult', formData);
    }

    return api.post('/medichat/consult', {
      question,
      conversationHistory,
    });
  },
};

// Backward-compatible alias while the rest of the codebase migrates.
export const clinicalAPI = {
  ...mediChatAPI,
  sendMediGuideMessage: mediChatAPI.sendMessage,
};

// Admin API methods
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  getUserClinicalData: (userId) => api.get(`/admin/users/${userId}/clinical-data`),
  getSymptomSubmissions: (status, startDate, endDate) => 
    api.get('/admin/symptom-submissions', { params: { status, startDate, endDate } }),
  updateTriageStatus: (submissionId, data) => api.patch(`/admin/triage/${submissionId}`, data),
  generateReport: (reportType, dateRange) => 
    api.post('/admin/reports', { reportType, dateRange }),
  getProfessionalApplications: () => api.get('/admin/professional-applications'),
  reviewProfessionalApplication: (applicationId, data) =>
    api.patch(`/admin/professional-applications/${applicationId}`, data),
};

export default api;
