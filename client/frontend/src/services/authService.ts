import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { LoginCredentials, AuthResponse, User } from '../types/auth';
import type { Location } from '../types/entities';
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
      
      const authResponse = response.data.data;
      
      console.log('📋 [AUTH SERVICE] Login response user:', {
        id: authResponse.user.id,
        email: authResponse.user.email,
        role: authResponse.user.role,
        permissions: authResponse.user.permissions,
        permissionsCount: authResponse.user.permissions?.length || 0
      });
      
      // Store tenant ID in localStorage for form validation field options
      const tenantId = authResponse.user.client;
      localStorage.setItem('tenantId', tenantId);
      console.log('💾 Tenant ID stored in localStorage:', tenantId);
      
      // IMPORTANT: Store token FIRST before fetching locations
      // The location endpoint requires authentication
      console.log('💾 [AUTH] Storing token before fetching locations');
      this.storeTokens(authResponse.token, authResponse.refreshToken, authResponse.expiresIn);
      
      // Fetch locations for the user's tenant
      try {
        console.log('📍 [AUTH] Fetching locations for tenant:', tenantId);
        console.log('📍 [AUTH] API Base URL:', this.apiClient.defaults.baseURL);
        
        // Note: tenant filtering is automatic in the backend via req.user.tenantId
        // We don't need to pass filter.tenant_id as a query parameter
        const locationsResponse: AxiosResponse<{ success: boolean; data: { items: Location[]; pagination: any } }> = await this.apiClient.get(
          `/location`
        );
        
        console.log('📍 [AUTH] Location response received:', locationsResponse.status);
        console.log('📍 [AUTH] Location response data:', locationsResponse.data);
        
        if (locationsResponse.data.success && locationsResponse.data.data?.items) {
          authResponse.locations = locationsResponse.data.data.items;
          console.log('✅ [AUTH] Locations fetched successfully:', authResponse.locations.length, 'locations');
          authResponse.locations.forEach((loc: any, idx: number) => {
            console.log(`  [${idx}] ID: ${loc.id}, Name: ${loc.name}, Tenant: ${loc.tenant_id}`);
          });
        } else {
          console.warn('⚠️ [AUTH] Location response missing items:', locationsResponse.data);
          authResponse.locations = [];
        }
      } catch (locationError) {
        // Don't block login if location fetch fails
        console.warn('⚠️ [AUTH] Failed to fetch locations, continuing with login:', locationError);
        if (axios.isAxiosError(locationError)) {
          console.error('❌ [AUTH] Location fetch error details:', {
            status: locationError.response?.status,
            data: locationError.response?.data,
            message: locationError.message
          });
        }
        authResponse.locations = [];
      }
      
      return authResponse;
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
      // Clear tenant ID from localStorage
      localStorage.removeItem('tenantId');
      console.log('🗑️ Tenant ID cleared from localStorage');
      
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

  // Fetch locations for a specific tenant
  async fetchLocations(tenantId: string): Promise<Location[]> {
    try {
      console.log('📍 [AUTH] fetchLocations() called for tenant:', tenantId);
      console.log('📍 [AUTH] API Base URL:', this.apiClient.defaults.baseURL);
      
      // Note: tenant filtering is automatic in the backend via req.user.tenantId
      // We don't need to pass filter.tenant_id as a query parameter
      const response: AxiosResponse<{ success: boolean; data: { items: Location[]; pagination: any } }> = await this.apiClient.get(
        `/location`
      );
      
      console.log('📍 [AUTH] Location response status:', response.status);
      console.log('📍 [AUTH] Location response data:', response.data);
      
      if (response.data.success && response.data.data?.items) {
        console.log('✅ [AUTH] Locations fetched successfully:', response.data.data.items.length, 'locations');
        response.data.data.items.forEach((loc: any, idx: number) => {
          console.log(`  [${idx}] ID: ${loc.id}, Name: ${loc.name}, Tenant: ${loc.tenant_id}`);
        });
        return response.data.data.items;
      } else {
        console.warn('⚠️ [AUTH] Location response missing items:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ [AUTH] Failed to fetch locations:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ [AUTH] Location fetch error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      return [];
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

  // Set logout flag to prevent auto-login
  setLogoutFlag(): void {
    tokenStorage.setLogoutFlag();
  }

  // Check if user explicitly logged out
  hasLogoutFlag(): boolean {
    return tokenStorage.hasLogoutFlag();
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