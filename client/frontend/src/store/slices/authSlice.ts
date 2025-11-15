// Auth Store Slice

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AuthStoreSlice } from '../types';
import type { User, Permission } from '../../types/auth';

// Mock auth service for testing
const mockAuthService = {
  login: async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'test@example.com' && password === 'password') {
      return {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin' as const,
          permissions: [],
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      };
    }
    
    throw new Error('Invalid credentials');
  },
  
  refreshToken: async (refreshToken: string) => {
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token',
      expiresIn: 3600
    };
  }
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
  refreshToken: null,
  expiresAt: null,
};

export const useAuthStore = create<AuthStoreSlice>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      login: async (email: string, password: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await mockAuthService.login(email, password);
          const expiresAt = Date.now() + (response.expiresIn * 1000);

          set((state) => {
            state.user = response.user;
            state.token = response.token;
            state.refreshToken = response.refreshToken;
            state.expiresAt = expiresAt;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
          });
        } catch (error) {
          set((state) => {
            state.isLoading = false;
            state.error = error instanceof Error ? error.message : 'Login failed';
          });
          throw error;
        }
      },

      logout: () => {
        set((state) => {
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.expiresAt = null;
          state.isAuthenticated = false;
          state.error = null;
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await mockAuthService.refreshToken(refreshToken);
          const expiresAt = Date.now() + (response.expiresIn * 1000);

          set((state) => {
            state.token = response.token;
            state.refreshToken = response.refreshToken;
            state.expiresAt = expiresAt;
          });

          return response;
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      },

      setToken: (token: string | null, refreshToken?: string | null, expiresAt?: number | null) => {
        set((state) => {
          state.token = token;
          if (refreshToken !== undefined) {
            state.refreshToken = refreshToken;
          }
          if (expiresAt !== undefined) {
            state.expiresAt = expiresAt;
          }
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 1,
    }
  )
);

// Hook for easy access to auth state and actions
export const useAuth = () => {
  const store = useAuthStore();
  
  const checkPermission = (permission: Permission): boolean => {
    if (!store.user) return false;
    return store.user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!store.user) return false;
    return store.user.role === role;
  };

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    token: store.token,
    
    // Actions
    login: store.login,
    logout: store.logout,
    refreshAuth: store.refreshAuth,
    setUser: store.setUser,
    clearError: store.clearError,
    
    // Helpers
    checkPermission,
    hasRole,
  };
};

// Auth slice for Redux Toolkit (for testing compatibility)
export const authSlice = {
  name: 'auth',
  reducer: (state = initialState, action: any) => {
    switch (action.type) {
      case 'auth/setUser':
        return {
          ...state,
          user: action.payload,
          isAuthenticated: !!action.payload,
        };
      case 'auth/setLoading':
        return {
          ...state,
          isLoading: action.payload,
        };
      case 'auth/setError':
        return {
          ...state,
          error: action.payload,
        };
      case 'auth/logout':
        return initialState;
      default:
        return state;
    }
  },
  actions: {
    setUser: (user: User | null) => ({ type: 'auth/setUser', payload: user }),
    setLoading: (loading: boolean) => ({ type: 'auth/setLoading', payload: loading }),
    setError: (error: string | null) => ({ type: 'auth/setError', payload: error }),
    logout: () => ({ type: 'auth/logout' }),
  },
};