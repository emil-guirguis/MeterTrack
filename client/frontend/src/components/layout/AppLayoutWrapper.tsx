/**
 * AppLayoutWrapper
 * 
 * Client-specific wrapper around the framework AppLayout component.
 * This demonstrates how to configure and use the framework layout
 * with client-specific hooks, state, and configuration.
 */

import React from 'react';
import { AppLayout } from '@framework/layout';
import type { LayoutProps, MenuItem, AppLayoutConfig } from '@framework/layout';
import { registerIconMappings } from '@framework/utils/iconHelper';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { useUI } from '../../store/slices/uiSlice';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Permission } from '../../types/auth';
import { generateBreadcrumbs, getPageTitle } from '../../utils/navigationUtils';

// Application-specific icon mappings
const appIconMappings = {
  'contacts': 'contacts',
  'meter': 'electric_bolt',
  'meters': 'electric_bolt',
  'management': 'folder_managed',
  'template': 'mail',
  'templates': 'mail',
  'building': 'business',
  'users': 'people',
  'devices': 'devices',
  'location': 'location_on',
  // Menu-specific mappings (kebab-case IDs)
  'management-devices': 'devices',
  'management-locations': 'location_on',
};

// Register icon mappings once
let iconsRegistered = false;
if (!iconsRegistered) {
  registerIconMappings(appIconMappings);
  iconsRegistered = true;
}

// Client-specific menu configuration
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: 'contacts',
    path: '/contacts',
    requiredPermission: Permission.CONTACT_READ
  },
  {
    id: 'meters',
    label: 'Meters',
    icon: 'meter',
    path: '/meters',
    requiredPermission: Permission.METER_READ
  },
  {
    id: 'management',
    label: 'Management',
    icon: 'management',
    path: '/management',
    requiredPermission: Permission.TEMPLATE_READ,
    children: [
      {
        id: 'management-devices',
        label: 'Devices',
        icon: 'meter',
        path: '/devices',
        requiredPermission: Permission.DEVICE_READ
      },
      {
        id: 'templates',
        label: 'Email Templates',
        icon: 'template',
        path: '/templates',
        requiredPermission: Permission.TEMPLATE_READ
      },
      {
        id: 'management-locations',
        label: 'Locations',
        icon: 'building',
        path: '/location',
        requiredPermission: Permission.LOCATION_READ
      },
      {
        id: 'users',
        label: 'Users',
        icon: 'users',
        path: '/users',
        requiredPermission: Permission.USER_READ
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    requiredPermission: Permission.SETTINGS_READ
  }
];

/**
 * AppLayoutWrapper Component
 * 
 * Wraps the framework AppLayout with client-specific configuration.
 * Use this component instead of importing AppLayout directly.
 */
export const AppLayoutWrapper: React.FC<LayoutProps> = (props) => {
  // Mock user for testing - replace with real useAuth when backend is available
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin' as const,
    permissions: [],
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const user = mockUser;
  const { logout: authLogout } = useAuth();
  const logout = () => {
    console.log('🚪 Logout button clicked');
    
    // Call logout which clears tokens and sets logout flag
    authLogout();
    
    // Redirect to login page
    console.log('🔄 Redirecting to login page');
    window.location.href = '/login';
  };
  const checkPermission = () => true; // Mock always returns true

  // Get responsive state
  const responsive = useResponsive();

  // Get UI state
  const uiState = useUI();

  // Build configuration
  const config: AppLayoutConfig = {
    menuItems,
    sidebarBrand: {
      icon: '🏢',
      text: 'MeterIt Pro'
    },
    user: user ? {
      name: user.name,
      email: user.email
    } : undefined,
    notifications: [], // TODO: Implement notifications
    onLogout: logout,
    checkPermission,
    responsive,
    uiState,
    usePageTitle,
    generateBreadcrumbs,
    getPageTitle
  };

  return <AppLayout {...props} config={config} />;
};

// Export as default for backward compatibility
export default AppLayoutWrapper;
