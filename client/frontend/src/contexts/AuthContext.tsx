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
  locations: [],
};

// Auth actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; locations: any[] } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { user: User; locations: any[] } }
  | { type: 'REFRESH_TOKEN_FAILURE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOCATIONS'; payload: any[] };

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
        user: action.payload.user,
        locations: action.payload.locations,
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
        locations: [],
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        locations: [],
      };
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        locations: action.payload.locations,
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
        locations: [],
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
    case 'SET_LOCATIONS':
      return {
        ...state,
        locations: action.payload,
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
      console.log('📍 Current URL:', window.location.href);
      console.log('🗄️ LocalStorage explicit_logout:', localStorage.getItem('explicit_logout'));
      console.log('🗄️ LocalStorage auth_token:', localStorage.getItem('auth_token'));
      console.log('🗄️ SessionStorage auth_token:', sessionStorage.getItem('auth_token'));
      
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Check if user explicitly logged out - FIRST priority
        if (authService.hasLogoutFlag()) {
          console.log('🚪 User explicitly logged out, clearing any remaining tokens and skipping auto-login');
          // Ensure tokens are cleared even if logout didn't complete properly
          authService.clearStoredToken();
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
        
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
              
              // Fetch locations for the user's tenant
              const locations = await authService.fetchLocations(user.client);
              
              dispatch({ type: 'LOGIN_SUCCESS', payload: { user, locations } });
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
      
      // Tokens are already stored in authService.login()
      // Just update rememberMe flag if needed
      if (credentials.rememberMe) {
        console.log('💾 RememberMe flag set');
      }
      console.log('🔑 Token in storage:', authService.getStoredToken());
      
      console.log('📋 [AUTH] User permissions from backend:', authResponse.user.permissions);
      console.log('📋 [AUTH] User role from backend:', authResponse.user.role);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: authResponse.user,
          locations: authResponse.locations || []
        }
      });
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
      console.log('🚪 Logging out user...');
      
      // Clear stored tokens FIRST
      authService.clearStoredToken();
      console.log('🗑️ Tokens cleared');
      
      // Set logout flag to prevent auto-login
      authService.setLogoutFlag();
      console.log('🚩 Logout flag set');
      
      // Dispatch logout to clear state
      dispatch({ type: 'LOGOUT' });
      console.log('✅ Logout state updated');
      
      // Call logout API if needed (don't wait for it)
      authService.logout().catch((error: unknown) => {
        console.error('Logout API call failed:', error);
      });
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
      
      dispatch({ 
        type: 'REFRESH_TOKEN_SUCCESS', 
        payload: {
          user: authResponse.user,
          locations: authResponse.locations || []
        }
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'REFRESH_TOKEN_FAILURE' });
      throw error;
    }
  };

  // Check if user has specific permission
  const checkPermission = (permission: string): boolean => {
    if (!state.user) {
      console.warn('[AUTH] checkPermission: No user in state');
      return false;
    }
    
    // Handle permissions as array (normal case)
    if (Array.isArray(state.user.permissions)) {
      if (state.user.permissions.length === 0) {
        console.warn('[AUTH] checkPermission: User has no permissions', {
          permission,
          userRole: state.user.role,
          permissionsArray: state.user.permissions
        });
        return false;
      }
      
      const hasPermission = state.user.permissions.includes(permission);
      if (!hasPermission) {
        console.warn('[AUTH] checkPermission: Permission denied', {
          permission,
          userPermissions: state.user.permissions,
          userRole: state.user.role
        });
      }
      return hasPermission;
    }
    
    // Handle permissions as nested object: { module: { action: boolean } }
    if (typeof state.user.permissions === 'object' && state.user.permissions !== null) {
      console.log('[AUTH] checkPermission: Permissions is nested object, checking format', {
        permission,
        permissionsKeys: Object.keys(state.user.permissions)
      });
      
      // Parse permission string: "module:action"
      const [module, action] = permission.split(':');
      
      if (!module || !action) {
        console.warn('[AUTH] checkPermission: Invalid permission format (expected "module:action")', {
          permission
        });
        return false;
      }
      
      // Check if module exists and action is true
      const permissionsObj = state.user.permissions as Record<string, Record<string, boolean>>;
      const hasPermission = permissionsObj[module]?.[action] === true;
      
      if (!hasPermission) {
        console.warn('[AUTH] checkPermission: Permission denied', {
          permission,
          module,
          action,
          moduleExists: !!permissionsObj[module],
          actionValue: permissionsObj[module]?.[action],
          userRole: state.user.role
        });
      } else {
        console.log('[AUTH] checkPermission: Permission granted', {
          permission,
          module,
          action
        });
      }
      return hasPermission;
    }
    
    console.warn('[AUTH] checkPermission: Permissions in unexpected format', {
      permission,
      permissionsType: typeof state.user.permissions,
      permissions: state.user.permissions
    });
    return false;
  };

  // Check if user has specific role
  const hasRole = (role: UserRole): boolean => {
    if (!state.user) return false;
    return state.user.role === role;
  };

  // Get locations for a specific tenant
  const getLocationsByTenant = (tenantId: string | number): any[] => {
    console.log(`[AUTH] getLocationsByTenant(${tenantId}): state.locations.length=${state.locations?.length}`);
    
    if (!state.locations || state.locations.length === 0) {
      console.log('[AUTH] getLocationsByTenant: No locations in state');
      console.log('[AUTH] Full state:', { 
        user: state.user?.email, 
        isAuthenticated: state.isAuthenticated,
        locationsCount: state.locations?.length,
        locationsArray: state.locations
      });
      return [];
    }
    
    console.log(`[AUTH] getLocationsByTenant(${tenantId}): Checking ${state.locations.length} locations`);
    console.log('[AUTH] Location objects:', state.locations.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      tenant_id: loc.tenant_id,
      keys: Object.keys(loc)
    })));
    
    // Filter locations by tenant_id (handle both string and number comparisons)
    const filtered = state.locations.filter((location: any) => {
      const locationTenantId = String(location.tenant_id);
      const searchTenantId = String(tenantId);
      const matches = locationTenantId === searchTenantId;
      console.log(`[AUTH]   Location ${location.id}: tenant_id=${location.tenant_id} vs search=${tenantId} => ${matches}`);
      return matches;
    });
    
    console.log(`[AUTH] getLocationsByTenant(${tenantId}): Found ${filtered.length} locations out of ${state.locations.length}`);
    return filtered;
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    checkPermission,
    hasRole,
    getLocationsByTenant,
  };

  // Log locations in memory whenever they change
  React.useEffect(() => {
    if (state.locations && state.locations.length > 0) {
      console.log('📍 LOCATIONS IN MEMORY:', state.locations);
      console.log('📍 LOCATIONS COUNT:', state.locations.length);
      state.locations.forEach((loc: any, idx: number) => {
        console.log(`  [${idx}] ID: ${loc.id}, Name: ${loc.name}, Tenant: ${loc.tenant_id}`);
      });
    } else {
      console.log('📍 NO LOCATIONS IN MEMORY');
    }
  }, [state.locations]);

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