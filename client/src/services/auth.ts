import api from './api';
import type { User, LoginCredentials, SignupCredentials } from '../types/auth';
import type { ApiResponse } from './api';

// API endpoints for authentication
export const authApi = {
  // Custom signup/login
  signup: async (credentials: SignupCredentials): Promise<ApiResponse<{ user: User; token: string; requiresVerification: boolean }>> => {
    const response = await api.post('/auth/signup', credentials);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Email verification
  verifyEmail: async (token: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Password reset
  requestPasswordReset: async (email: string): Promise<ApiResponse<{ resetToken?: string }>> => {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // Profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Data migration
  migrateDeviceData: async (deviceId: string): Promise<ApiResponse<{ deviceId: string; userId: string }>> => {
    const response = await api.post('/auth/migrate-device-data', { deviceId });
    return response.data;
  },
};

// Google OAuth2 helpers
export const googleAuth = {
  // Get Google OAuth2 URL with current device ID for migration
  getGoogleAuthUrl: (deviceId?: string): string => {
    const baseUrl = `${import.meta.env.VITE_API_URL || ''}/auth/google`;
    return deviceId ? `${baseUrl}?deviceId=${deviceId}` : baseUrl;
  },

  // Handle OAuth2 callback (called from redirect)
  handleCallback: (urlParams: URLSearchParams): { token?: string; error?: string } => {
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    // Debug logging to understand what parameters we're receiving
    console.log('OAuth callback parameters:', {
      token: token ? '***' : null,
      error,
      success,
      allParams: Object.fromEntries(urlParams.entries())
    });
    
    // Only treat as error if there's an explicit error parameter
    if (error) {
      return { token: undefined, error };
    }
    
    // If we have a token, return it (success case)
    if (token) {
      return { token, error: undefined };
    }
    
    // If no token and no explicit error, treat as a generic error
    return { token: undefined, error: 'No authentication token received' };
  },
};

// Token management
export const tokenManager = {
  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  clearToken: (): void => {
    localStorage.removeItem('auth_token');
  },

  // Set up axios interceptor for auth token
  setupInterceptors: (): void => {
    // Request interceptor to add auth token
    api.interceptors.request.use((config) => {
      const token = tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle auth errors
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          tokenManager.clearToken();
          
          // Only redirect to login if we're not already on auth pages
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/auth')) {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  },
};