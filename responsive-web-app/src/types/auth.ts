// Authentication and User Management Types

export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TECHNICIAN: 'technician',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const Permission = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Building Management
  BUILDING_CREATE: 'building:create',
  BUILDING_READ: 'building:read',
  BUILDING_UPDATE: 'building:update',
  BUILDING_DELETE: 'building:delete',
  
  // Equipment Management
  EQUIPMENT_CREATE: 'equipment:create',
  EQUIPMENT_READ: 'equipment:read',
  EQUIPMENT_UPDATE: 'equipment:update',
  EQUIPMENT_DELETE: 'equipment:delete',
  
  // Contact Management
  CONTACT_CREATE: 'contact:create',
  CONTACT_READ: 'contact:read',
  CONTACT_UPDATE: 'contact:update',
  CONTACT_DELETE: 'contact:delete',
  
  // Meter Management
  METER_CREATE: 'meter:create',
  METER_READ: 'meter:read',
  METER_UPDATE: 'meter:update',
  METER_DELETE: 'meter:delete',
  
  // Settings Management
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  
  // Email Template Management
  TEMPLATE_CREATE: 'template:create',
  TEMPLATE_READ: 'template:read',
  TEMPLATE_UPDATE: 'template:update',
  TEMPLATE_DELETE: 'template:delete'
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
}

// Role-based permission validation
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Full access to all permissions
    ...Object.values(Permission)
  ],
  [UserRole.MANAGER]: [
    // User management (limited)
    Permission.USER_READ,
    Permission.USER_UPDATE,
    
    // Full building management
    Permission.BUILDING_CREATE,
    Permission.BUILDING_READ,
    Permission.BUILDING_UPDATE,
    Permission.BUILDING_DELETE,
    
    // Full equipment management
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_READ,
    Permission.EQUIPMENT_UPDATE,
    Permission.EQUIPMENT_DELETE,
    
    // Full contact management
    Permission.CONTACT_CREATE,
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,
    Permission.CONTACT_DELETE,
    
    // Full meter management
    Permission.METER_CREATE,
    Permission.METER_READ,
    Permission.METER_UPDATE,
    Permission.METER_DELETE,
    
    // Settings read/update
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
    
    // Full template management
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE
  ],
  [UserRole.TECHNICIAN]: [
    // Read-only user access
    Permission.USER_READ,
    
    // Read-only building access
    Permission.BUILDING_READ,
    
    // Full equipment management
    Permission.EQUIPMENT_CREATE,
    Permission.EQUIPMENT_READ,
    Permission.EQUIPMENT_UPDATE,
    Permission.EQUIPMENT_DELETE,
    
    // Read-only contact access
    Permission.CONTACT_READ,
    
    // Full meter management
    Permission.METER_CREATE,
    Permission.METER_READ,
    Permission.METER_UPDATE,
    Permission.METER_DELETE,
    
    // Read-only settings
    Permission.SETTINGS_READ,
    
    // Read-only template access
    Permission.TEMPLATE_READ
  ],
  [UserRole.VIEWER]: [
    // Read-only access to most entities
    Permission.USER_READ,
    Permission.BUILDING_READ,
    Permission.EQUIPMENT_READ,
    Permission.CONTACT_READ,
    Permission.METER_READ,
    Permission.SETTINGS_READ,
    Permission.TEMPLATE_READ
  ]
};

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface LoginValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// Utility functions for permission checking
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  return user.permissions.includes(permission);
};

export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.role === role;
};

export const validateLoginCredentials = (credentials: LoginCredentials): LoginValidation => {
  const errors: ValidationError[] = [];
  
  if (!credentials.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  
  if (!credentials.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (credentials.password.length < 4) {
    errors.push({ field: 'password', message: 'Password must be at least 4 characters long' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};