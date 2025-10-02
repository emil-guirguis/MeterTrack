// Auth Store Slice

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AuthStoreSlice } from '../types';
import { authService } from '../../services/authService';
import { tokenStorage } from '../../utils/tokenStorage';

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

      // Actions
      login: async (email: string, password: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authService.login({ email, password });
          
          // Store tokens
          tokenStorage.setTokens(
            response.token,
            response.refreshToken,
            response.expiresIn
          );

          set((state) => {
            state.user = response.user;
            state.isAuthenticated = true;
            state.token = response.token;
            state.refreshToken = response.refreshToken;
            state.expiresAt = Date.now() + response.expiresIn * 1000;
            state.isLoading = false;
            state.error = null;
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          
          set((state) => {
            state.isLoading = false;
            state.error = errorMessage;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.expiresAt = null;
          });

          throw error;
        }
      },

      logout: () => {
        // Clear tokens from storage
        tokenStorage.clearTokens();

        // Reset auth state
        set((state) => {
          Object.assign(state, initialState);
        });

        // Call logout service (fire and forget)
        authService.logout().catch(console.error);
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authService.refreshToken(refreshToken);
          
          // Update tokens
          tokenStorage.setTokens(
            response.token,
            response.refreshToken,
            response.expiresIn
          );

          set((state) => {
            state.token = response.token;
            state.refreshToken = response.refreshToken;
            state.expiresAt = Date.now() + response.expiresIn * 1000;
            state.isLoading = false;
            state.error = null;
          });

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
          
          // If refresh fails, logout user
          set((state) => {
            Object.assign(state, initialState);
            state.error = errorMessage;
          });

          tokenStorage.clearTokens();
          throw error;
        }
      },

      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      },

      setToken: (token, refreshToken, expiresAt) => {
        set((state) => {
          state.token = token;
          if (refreshToken !== undefined) {
            state.refreshToken = refreshToken;
          }
          if (expiresAt !== undefined) {
            state.expiresAt = expiresAt;
          }
          state.isAuthenticated = !!token;
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
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration between versions if needed
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            // Add any new fields or transform existing ones
          };
        }
        return persistedState;
      },
    }
  )
);

// Selectors
export const authSelectors = {
  user: (state: AuthStoreSlice) => state.user,
  isAuthenticated: (state: AuthStoreSlice) => state.isAuthenticated,
  isLoading: (state: AuthStoreSlice) => state.isLoading,
  error: (state: AuthStoreSlice) => state.error,
  token: (state: AuthStoreSlice) => state.token,
  
  // Computed selectors
  hasPermission: (permission: string) => (state: AuthStoreSlice) => {
    return state.user?.permissions.includes(permission as any) ?? false;
  },
  
  hasRole: (role: string) => (state: AuthStoreSlice) => {
    return state.user?.role === role;
  },
  
  isTokenExpired: (state: AuthStoreSlice) => {
    if (!state.expiresAt) return true;
    return Date.now() >= state.expiresAt;
  },
  
  needsRefresh: (state: AuthStoreSlice) => {
    if (!state.expiresAt) return false;
    // Refresh if token expires in the next 5 minutes
    return Date.now() >= (state.expiresAt - 5 * 60 * 1000);
  },
};

// Hook for easy access to auth state and actions
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    
    // Actions
    login: store.login,
    logout: store.logout,
    refreshAuth: store.refreshAuth,
    clearError: store.clearError,
    
    // Computed
    hasPermission: (permission: string) => 
      store.user?.permissions.includes(permission as any) ?? false,
    hasRole: (role: string) => store.user?.role === role,
    isTokenExpired: authSelectors.isTokenExpired(store),
    needsRefresh: authSelectors.needsRefresh(store),
  };
};