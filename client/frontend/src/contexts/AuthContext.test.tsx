/**
 * Tests for AuthContext
 * 
 * Tests the authentication context functionality including:
 * - Locations loaded at login
 * - Cache cleared on logout
 * - Location retrieval by tenant
 * 
 * Requirements: 1.1, 1.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authService from '../services/authService';
import type { ReactNode } from 'react';

// Mock the authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    verifyToken: vi.fn(),
    storeTokens: vi.fn(),
    getStoredToken: vi.fn(),
    getStoredRefreshToken: vi.fn(),
    clearStoredToken: vi.fn(),
    setLogoutFlag: vi.fn(),
    hasLogoutFlag: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUserFromToken: vi.fn(),
  },
}));

describe('AuthContext', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    client: 'tenant-1',
    role: 'admin' as const,
    permissions: [],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLocations = [
    {
      id: '1',
      name: 'Location 1',
      tenant_id: 'tenant-1',
      address: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', country: 'Country' },
      contactInfo: { email: 'loc1@example.com', phone: '555-1234' },
      status: 'active' as const,
      type: 'office' as const,
      meterCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Location 2',
      tenant_id: 'tenant-1',
      address: { street: '456 Oak Ave', city: 'City', state: 'State', zipCode: '12345', country: 'Country' },
      contactInfo: { email: 'loc2@example.com', phone: '555-5678' },
      status: 'active' as const,
      type: 'warehouse' as const,
      meterCount: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Location 3',
      tenant_id: 'tenant-2',
      address: { street: '789 Pine Rd', city: 'City', state: 'State', zipCode: '12345', country: 'Country' },
      contactInfo: { email: 'loc3@example.com', phone: '555-9999' },
      status: 'active' as const,
      type: 'retail' as const,
      meterCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock hasLogoutFlag to return false by default
    vi.mocked(authService.authService.hasLogoutFlag).mockReturnValue(false);
    // Mock getStoredToken to return null by default
    vi.mocked(authService.authService.getStoredToken).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Locations Loaded at Login', () => {
    it('should load locations from auth service during login', async () => {
      // Requirement 1.1: WHEN the meter form loads THEN the system SHALL fetch all locations and populate the location_id dropdown with location names
      // Requirement 1.2: WHEN the location dropdown is displayed THEN the system SHALL show location names as the selectable options
      
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: mockLocations,
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.locations).toEqual([]);

      // Perform login
      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      // After login, locations should be loaded
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.locations).toHaveLength(3);
      expect(result.current.locations).toEqual(mockLocations);
    });

    it('should handle login when locations fetch fails gracefully', async () => {
      // Requirement 1.1: Handle location fetch errors gracefully (don't block login)
      
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: undefined, // No locations returned
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Perform login
      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      // Login should succeed even without locations
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.locations).toEqual([]);
    });

    it('should store locations in auth context after login', async () => {
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: mockLocations,
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      // Verify locations are stored
      expect(result.current.locations).toBeDefined();
      expect(result.current.locations.length).toBeGreaterThan(0);
      expect(result.current.locations[0]).toHaveProperty('name');
      expect(result.current.locations[0]).toHaveProperty('tenant_id');
    });
  });

  describe('Cache Cleared on Logout', () => {
    it('should clear locations from cache on logout', async () => {
      // Requirement 1.1, 1.2: Cache Cleared on Logout
      
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: mockLocations,
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login
      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.locations).toHaveLength(3);
      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      act(() => {
        result.current.logout();
      });

      // After logout, locations should be cleared
      expect(result.current.locations).toEqual([]);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should clear locations when logout flag is set', async () => {
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: mockLocations,
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login
      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.locations).toHaveLength(3);

      // Logout
      act(() => {
        result.current.logout();
      });

      // Verify logout flag was set
      expect(authService.authService.setLogoutFlag).toHaveBeenCalled();
      expect(result.current.locations).toEqual([]);
    });
  });

  describe('getLocationsByTenant', () => {
    it('should return locations filtered by tenant_id', async () => {
      // Requirement 1.1, 1.2: Tenant-Filtered Location Dropdown
      
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: mockLocations,
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      // Get locations for tenant-1
      const tenant1Locations = result.current.getLocationsByTenant('tenant-1');
      expect(tenant1Locations).toHaveLength(2);
      expect(tenant1Locations[0].name).toBe('Location 1');
      expect(tenant1Locations[1].name).toBe('Location 2');

      // Get locations for tenant-2
      const tenant2Locations = result.current.getLocationsByTenant('tenant-2');
      expect(tenant2Locations).toHaveLength(1);
      expect(tenant2Locations[0].name).toBe('Location 3');
    });

    it('should return empty array when no locations match tenant_id', async () => {
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: mockLocations,
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      // Get locations for non-existent tenant
      const noLocations = result.current.getLocationsByTenant('tenant-999');
      expect(noLocations).toEqual([]);
    });

    it('should return empty array when no locations are loaded', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Before login, no locations
      const locations = result.current.getLocationsByTenant('tenant-1');
      expect(locations).toEqual([]);
    });

    it('should return empty array after logout', async () => {
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: mockLocations,
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.getLocationsByTenant('tenant-1')).toHaveLength(2);

      // Logout
      act(() => {
        result.current.logout();
      });

      // After logout, should return empty array
      const locations = result.current.getLocationsByTenant('tenant-1');
      expect(locations).toEqual([]);
    });
  });

  describe('Token Refresh with Locations', () => {
    it('should update locations when token is refreshed', async () => {
      const mockAuthResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        locations: mockLocations,
      };

      vi.mocked(authService.authService.login).mockResolvedValue(mockAuthResponse);
      vi.mocked(authService.authService.getStoredRefreshToken).mockReturnValue('test-refresh-token');

      const newLocations = [
        {
          ...mockLocations[0],
          name: 'Updated Location 1',
        },
      ];

      const refreshResponse = {
        user: mockUser,
        token: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        locations: newLocations,
      };

      vi.mocked(authService.authService.refreshToken).mockResolvedValue(refreshResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login
      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.locations).toHaveLength(3);

      // Refresh token
      await act(async () => {
        await result.current.refreshToken();
      });

      // Locations should be updated
      expect(result.current.locations).toHaveLength(1);
      expect(result.current.locations[0].name).toBe('Updated Location 1');
    });
  });
});
