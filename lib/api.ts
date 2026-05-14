// frontend/src/lib/api.ts 

import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          Cookies.set('accessToken', accessToken, { expires: 1/48 }); // 30 minutes
          if (newRefreshToken) {
            Cookies.set('refreshToken', newRefreshToken, { expires: 7 }); // 7 days
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API Methods
export const authApi = {
  /**
   * Login - Patient/Pharmacy/Super Admin
   */
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  /**
   * Register Patient
   */
  registerPatient: async (data: any) => {
    const response = await api.post('/auth/register/patient', data);
    return response.data;
  },

  /**
   * Register Pharmacy
   */
  registerPharmacy: async (data: any) => {
    const response = await api.post('/auth/register/pharmacy', data);
    return response.data;
  },

  /**
   * Verify email with 5-digit code
   */
  verifyEmail: async (data: { email: string; code: string }) => {
    const response = await api.post('/auth/verify-email', data);
    return response.data;
  },

  /**
   * Resend verification code
   */
  resendVerificationCode: async (data: { email: string }) => {
    const response = await api.post('/auth/resend-verification', data);
    return response.data;
  },

  /**
   * Request password reset (forgot password)
   */
  forgotPassword: async (data: { email: string }) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with code
   */
  resetPassword: async (data: { 
    email: string; 
    resetCode: string; 
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (data: { 
    currentPassword: string; 
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshTokens: async () => {
    const refreshToken = Cookies.get('refreshToken');
    const response = await api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    return response.data;
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default api;