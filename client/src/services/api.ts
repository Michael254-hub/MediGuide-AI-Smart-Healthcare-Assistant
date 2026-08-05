import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Zustand's getState() allows accessing the store outside of React components
    const token = useAuthStore.getState().user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const authHeader = error.config?.headers?.Authorization;
    if (error.response && error.response.status === 401 && authHeader) {
      useAuthStore.getState().logout();
      window.location.href = "/login"; // Optional: redirect to login
    }
    return Promise.reject(error);
  },
);

export interface RegisterPayload {
  name: string;
  emailOrPhone: string;
  password: string;
}

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

export interface ConfirmVerificationPayload {
  verificationCode: string;
}

export interface RequestPasswordResetPayload {
  emailOrPhone: string;
}

export interface ResetPasswordPayload {
  emailOrPhone: string;
  resetToken: string;
  newPassword: string;
}

// Auth API methods
export const authAPI = {
  register: (data: RegisterPayload) => api.post("/auth/register", data),
  login: (data: LoginPayload) => api.post("/auth/login", data),
  confirmVerification: (data: ConfirmVerificationPayload, verificationToken: string) =>
    api.post("/auth/verification/confirm", data, {
      headers: {
        "X-Verification-Token": verificationToken,
      },
    }),
  resendVerification: (verificationToken: string) =>
    api.post(
      "/auth/verification/resend",
      {},
      {
        headers: {
          "X-Verification-Token": verificationToken,
        },
      },
    ),
  requestPasswordReset: (data: RequestPasswordResetPayload) =>
    api.post("/auth/request-password-reset", data),
  resetPassword: (data: ResetPasswordPayload) => api.post("/auth/reset-password", data),
  getProfile: () => api.get("/auth/profile"),
};

// Symptom API methods
export const symptomAPI = {
  getFollowUpQuestions: (data: Record<string, unknown>) =>
    api.post("/symptoms/follow-up-questions", data),
  submitSymptoms: (data: FormData | Record<string, unknown>, config: AxiosRequestConfig = {}) =>
    api.post("/symptoms", data, config),
  getSymptomHistory: () => api.get("/symptoms/history"),
  deleteHistoryItem: (id: string) => api.delete(`/symptoms/history/${id}`),
  getSingleSymptom: (id: string) => api.get(`/symptoms/${id}`),
};

export const patientProfileAPI = {
  getProfile: () => api.get("/patient-profile"),
  saveProfile: (data: Record<string, unknown>) => api.put("/patient-profile", data),
  getDeidentifiedProfile: () => api.get("/patient-profile/de-identified"),
};

export const professionalApplicationAPI = {
  getMine: () => api.get("/professional-applications/me"),
  submit: (data: Record<string, unknown> | FormData) =>
    api.post("/professional-applications", data),
};

export const medicAPI = {
  getWorkspace: () => api.get("/medic/workspace"),
};

export interface MediChatMessage {
  role?: string;
  content?: string;
  [key: string]: unknown;
}

export interface SendMediChatMessageArgs {
  question?: string;
  conversationId?: string;
  conversationTitle?: string;
  conversationHistory?: MediChatMessage[];
  attachments?: File[];
}

// MediChat API methods
export const mediChatAPI = {
  getPatientData: () => api.get("/medichat/patient-data"),
  getConversationHistory: () => api.get("/medichat/history"),
  importConversationHistory: (conversations: unknown) =>
    api.post("/medichat/history/import", { conversations }),
  deleteConversation: (conversationId: string) =>
    api.delete(`/medichat/history/${conversationId}`),
  getSuggestions: () => api.get("/medichat/suggestions"),
  sendMessage: ({
    question,
    conversationId,
    conversationTitle,
    conversationHistory = [],
    attachments = [],
  }: SendMediChatMessageArgs) => {
    if (attachments.length > 0) {
      const formData = new FormData();
      formData.append("question", question || "");
      if (conversationId) {
        formData.append("conversationId", conversationId);
      }
      if (conversationTitle) {
        formData.append("conversationTitle", conversationTitle);
      }
      formData.append("conversationHistory", JSON.stringify(conversationHistory));
      attachments.forEach((attachment) => {
        formData.append("attachments", attachment);
      });

      return api.post("/medichat/consult", formData);
    }

    return api.post("/medichat/consult", {
      question,
      conversationId,
      conversationTitle,
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
  getAllUsers: () => api.get("/admin/users"),
  getUserClinicalData: (userId: string) => api.get(`/admin/users/${userId}/clinical-data`),
  getSymptomSubmissions: (status?: string, startDate?: string, endDate?: string) =>
    api.get("/admin/symptom-submissions", { params: { status, startDate, endDate } }),
  updateTriageStatus: (submissionId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/triage/${submissionId}`, data),
  generateReport: (reportType: string, dateRange: Record<string, unknown>) =>
    api.post("/admin/reports", { reportType, dateRange }),
  getProfessionalApplications: () => api.get("/admin/professional-applications"),
  reviewProfessionalApplication: (applicationId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/professional-applications/${applicationId}`, data),
};

export default api;
