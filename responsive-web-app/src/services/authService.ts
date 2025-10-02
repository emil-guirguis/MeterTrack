import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginCredentials, AuthResponse, User } from '../types/auth';
import { tokenStorage } from '../utils/tokenStorage';

// API base URL - this would typically come from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class AuthService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include auth token
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = tokenStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token expiration
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = tokenStorage.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              tokenStorage.updateTokens(response.token, response.refreshToken, response.expiresIn);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.token}`;
              return this.apiClient(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            tokenStorage.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Login method
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login with:', { email: credentials.email, baseURL: this.apiClient.defaults.baseURL });
      const response: AxiosResponse<{ success: boolean; data: AuthResponse }> = await this.apiClient.post('/auth/login', credentials);
      console.log('✅ Login successful:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        const message = error.response?.data?.message || 'Login failed';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }



  // Logout method
  async logout(): Promise<void> {
    try {
      await this.apiClient.post('/auth/logout');
    } catch (error) {
      // Log error but don't throw - logout should always succeed locally
      console.error('Logout API call failed:', error);
    }
  }

  // Refresh token method
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<{ success: boolean; data: AuthResponse }> = await this.apiClient.post('/auth/refresh', {
        refreshToken,
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Token refresh failed';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Verify token and get user data
  async verifyToken(): Promise<User | null> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { user: User } }> = await this.apiClient.get('/auth/verify');
      return response.data.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }



  // Token storage methods
  storeTokens(token: string, refreshToken: string, expiresIn: number, rememberMe: boolean = false): void {
    tokenStorage.storeTokens(token, refreshToken, expiresIn, rememberMe);
  }

  getStoredToken(): string | null {
    return tokenStorage.getToken();
  }

  getStoredRefreshToken(): string | null {
    return tokenStorage.getRefreshToken();
  }

  clearStoredToken(): void {
    tokenStorage.clearTokens();
  }

  // Check if user is authenticated (has valid token)
  isAuthenticated(): boolean {
    return tokenStorage.isTokenValid();
  }

  // Get current user from token
  getCurrentUserFromToken(): User | null {
    return tokenStorage.getUserFromToken();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;