import axios from 'axios';
import {
  User,
  Student,
  ClassItem,
  Interaction,
  OtpRequest,
  AuditLog,
  CoachDashboardMetrics,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Auth JWT or Temporary Access Token
api.interceptors.request.use((config) => {
  const tempToken = localStorage.getItem('temp_otp_token');
  const primaryToken = localStorage.getItem('token');

  const tokenToUse = tempToken || primaryToken;
  if (tokenToUse) {
    config.headers.Authorization = `Bearer ${tokenToUse}`;
  }
  return config;
});

export const authApi = {
  login: async (loginIdentifier: string, password: string) => {
    const res = await api.post('/auth/login', { loginIdentifier, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const adminApi = {
  getCoaches: async () => {
    const res = await api.get('/admin/coaches');
    return res.data;
  },
  addCoach: async (data: any) => {
    const res = await api.post('/admin/coaches', data);
    return res.data;
  },
  getStudents: async () => {
    const res = await api.get('/admin/students');
    return res.data;
  },
  addStudent: async (data: any) => {
    const res = await api.post('/admin/students', data);
    return res.data;
  },
  updateStudentAssignment: async (studentId: string, data: any) => {
    const res = await api.put(`/admin/students/${studentId}/assign`, data);
    return res.data;
  },
  getClasses: async () => {
    const res = await api.get('/admin/classes');
    return res.data;
  },
  createClass: async (data: any) => {
    const res = await api.post('/admin/classes', data);
    return res.data;
  },
  assignCoachToClass: async (classId: string, primaryCoachId: string) => {
    const res = await api.put(`/admin/classes/${classId}/assign-coach`, { primaryCoachId });
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
  },
};

export const coachApi = {
  getMetrics: async (): Promise<{ success: boolean; metrics: CoachDashboardMetrics }> => {
    const res = await api.get('/coach/metrics');
    return res.data;
  },
  getAssignedStudents: async () => {
    const res = await api.get('/coach/assigned-students');
    return res.data;
  },
  searchStudent: async (query: string) => {
    const res = await api.get(`/coach/search-student?query=${encodeURIComponent(query)}`);
    return res.data;
  },
  getStudentProfile: async (studentId: string) => {
    const res = await api.get(`/coach/student-profile/${studentId}`);
    return res.data;
  },
};

export const interactionApi = {
  addInteraction: async (data: any) => {
    const res = await api.post('/interactions', data);
    return res.data;
  },
  getStudentInteractions: async (studentId: string) => {
    const res = await api.get(`/interactions/student/${studentId}`);
    return res.data;
  },
};

export const otpApi = {
  requestOtp: async (studentId: string, reason?: string) => {
    const res = await api.post('/otp/request', { studentId, reason });
    return res.data;
  },
  verifyOtp: async (studentId: string, otpCode: string) => {
    const res = await api.post('/otp/verify', { studentId, otpCode });
    return res.data;
  },
  getPendingOtps: async () => {
    const res = await api.get('/otp/pending');
    return res.data;
  },
};

export const studentApi = {
  getDashboard: async () => {
    const res = await api.get('/student/dashboard');
    return res.data;
  },
};

export default api;
