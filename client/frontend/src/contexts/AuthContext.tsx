import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, AuthState, LoginCredentials, User, Permission, UserRole } from '../types/auth';
import { authService } from '../services/authService';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: User }
  | { type: 'REFRESH_TOKEN_FAILURE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'REFRESH_TOKEN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initializing authentication...');
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Check if user has a stored token
        const token = authService.getStoredToken();
        console.log('🔑 Stored token exists:', !!token);
        
        if (token) {
          // Add timeout to prevent hanging on network issues
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Token verification timeout')), 5000)
          );
          
          try {
            console.log('⏳ Verifying token...');
            // Race between token verification and timeout
            const user = await Promise.race([
              authService.verifyToken(),
              timeoutPromise
            ]);
            
            if (user) {
              console.log('✅ Token verified, user authenticated:', user.email);
              dispatch({ type: 'LOGIN_SUCCESS', payload: user });
            } else {
              console.log('❌ Token invalid, clearing...');
              // Token is invalid, clear it
              authService.clearStoredToken();
              dispatch({ type: 'SET_LOADING', payload: false });
            }
          } catch (verifyError) {
            console.warn('⚠️ Token verification failed or timed out:', verifyError);
            // Clear invalid/unverifiable token
            authService.clearStoredToken();
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          console.log('ℹ️ No stored token, user not authenticated');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        authService.clearStoredToken();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    let refreshInterval: number;

    if (state.isAuthenticated) {
      // Refresh token every 14 minutes (assuming 15-minute token expiry)
      refreshInterval = setInterval(async () => {
        try {
          await refreshToken();
        } catch (error: unknown) {
          console.error('Automatic token refresh failed:', error);
          // If refresh fails, logout user
          logout();
        }
      }, 14 * 60 * 1000); // 14 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.isAuthenticated]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      console.log('🚀 Starting login process...');
      dispatch({ type: 'LOGIN_START' });
      
      const authResponse = await authService.login(credentials);
      console.log('📦 Auth response received:', authResponse);
      
      // Store tokens
      authService.storeTokens(authResponse.token, authResponse.refreshToken, authResponse.expiresIn, credentials.rememberMe);
      console.log('💾 Tokens stored successfully');
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: authResponse.user });
      console.log('✅ Login completed successfully');
    } catch (error) {
      console.error('❌ Login failed in context:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    try {
      // Clear stored tokens
      authService.clearStoredToken();
      
      // Call logout API if needed
      authService.logout().catch((error: unknown) => {
        console.error('Logout API call failed:', error);
      });
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still dispatch logout to clear local state
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const refreshTokenValue = authService.getStoredRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const authResponse = await authService.refreshToken(refreshTokenValue);
      
      // Update stored tokens
      authService.storeTokens(authResponse.token, authResponse.refreshToken, authResponse.expiresIn);
      
      dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: authResponse.user });
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'REFRESH_TOKEN_FAILURE' });
      throw error;
    }
  };

  // Check if user has specific permission
  const checkPermission = (permission: string): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission as Permission);
  };

  // Check if user has specific role
  const hasRole = (role: UserRole): boolean => {
    if (!state.user) return false;
    return state.user.role === role;
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    checkPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;