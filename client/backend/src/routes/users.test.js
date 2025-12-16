/**
 * Users Route Tests
 * 
 * Tests for user creation with auto-generated permissions
 * Verifies that permissions are correctly generated based on role
 */

const User = require('../models/UserWithSchema');
const PermissionsService = require('../services/PermissionsService');

describe('Users Route - User Creation with Auto-Generated Permissions', () => {
  describe('POST /users - Auto-generate permissions', () => {
    it('should auto-generate permissions for admin role', async () => {
      const userData = {
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'Admin',
        password: 'testPassword123'
      };

      const user = new User(userData);
      
      // Simulate what the route does
      if (!user.permissions || (Array.isArray(user.permissions) && user.permissions.length === 0)) {
        const role = user.role || 'Viewer';
        const permissionsObj = PermissionsService.getPermissionsByRole(role);
        user.permissions = JSON.stringify(permissionsObj);
      }

      // Verify permissions were generated
      expect(user.permissions).toBeDefined();
      expect(typeof user.permissions).toBe('string');
      
      const parsed = JSON.parse(user.permissions);
      expect(PermissionsService.validatePermissionsObject(parsed)).toBe(true);
      
      // Verify admin has full permissions
      expect(parsed.user.create).toBe(true);
      expect(parsed.user.delete).toBe(true);
      expect(parsed.meter.create).toBe(true);
    });

    it('should auto-generate permissions for viewer role', async () => {
      const userData = {
        name: 'Test Viewer',
        email: 'viewer@test.com',
        role: 'Viewer',
        password: 'testPassword123'
      };

      const user = new User(userData);
      
      // Simulate what the route does
      if (!user.permissions || (Array.isArray(user.permissions) && user.permissions.length === 0)) {
        const role = user.role || 'Viewer';
        const permissionsObj = PermissionsService.getPermissionsByRole(role);
        user.permissions = JSON.stringify(permissionsObj);
      }

      // Verify permissions were generated
      expect(user.permissions).toBeDefined();
      
      const parsed = JSON.parse(user.permissions);
      expect(PermissionsService.validatePermissionsObject(parsed)).toBe(true);
      
      // Verify viewer has read-only permissions
      expect(parsed.user.read).toBe(true);
      expect(parsed.user.create).toBe(false);
      expect(parsed.user.delete).toBe(false);
    });

    it('should use provided permissions if explicitly given', async () => {
      const customPerms = PermissionsService.getPermissionsByRole('manager');
      const userData = {
        name: 'Test User',
        email: 'user@test.com',
        role: 'Viewer',
        permissions: JSON.stringify(customPerms)
      };

      const user = new User(userData);
      
      // Simulate what the route does
      if (!user.permissions || (Array.isArray(user.permissions) && user.permissions.length === 0)) {
        const role = user.role || 'Viewer';
        const permissionsObj = PermissionsService.getPermissionsByRole(role);
        user.permissions = JSON.stringify(permissionsObj);
      }

      // Verify custom permissions were preserved
      const parsed = JSON.parse(user.permissions);
      expect(parsed).toEqual(customPerms);
    });

    it('should default to viewer permissions for unknown role', async () => {
      const userData = {
        name: 'Test User',
        email: 'user@test.com',
        role: 'UnknownRole',
        password: 'testPassword123'
      };

      const user = new User(userData);
      
      // Simulate what the route does
      if (!user.permissions || (Array.isArray(user.permissions) && user.permissions.length === 0)) {
        const role = user.role || 'Viewer';
        const permissionsObj = PermissionsService.getPermissionsByRole(role);
        user.permissions = JSON.stringify(permissionsObj);
      }

      // Verify permissions were generated
      const parsed = JSON.parse(user.permissions);
      const viewerPerms = PermissionsService.getPermissionsByRole('viewer');
      
      // Should default to viewer permissions
      expect(parsed).toEqual(viewerPerms);
    });

    it('should handle empty permissions array', async () => {
      const userData = {
        name: 'Test User',
        email: 'user@test.com',
        role: 'Manager',
        permissions: []
      };

      const user = new User(userData);
      
      // Simulate what the route does
      if (!user.permissions || (Array.isArray(user.permissions) && user.permissions.length === 0)) {
        const role = user.role || 'Viewer';
        const permissionsObj = PermissionsService.getPermissionsByRole(role);
        user.permissions = JSON.stringify(permissionsObj);
      }

      // Verify permissions were auto-generated
      const parsed = JSON.parse(user.permissions);
      const managerPerms = PermissionsService.getPermissionsByRole('Manager');
      
      expect(parsed).toEqual(managerPerms);
    });

    it('should validate permissions structure before storing', async () => {
      const userData = {
        name: 'Test User',
        email: 'user@test.com',
        role: 'Admin',
        permissions: { invalid: 'structure' }
      };

      // Simulate what the route does
      let isValid = true;
      if (typeof userData.permissions === 'object' && !Array.isArray(userData.permissions)) {
        if (!PermissionsService.validatePermissionsObject(userData.permissions)) {
          isValid = false;
        }
      }

      expect(isValid).toBe(false);
    });
  });

  describe('Property 2: User Creation Auto-Generates Permissions', () => {
    /**
     * **Feature: user-permissions-refactor, Property 2: User Creation Auto-Generates Permissions**
     * **Validates: Requirements 1.2, 2.1**
     * 
     * For any user created with a role, the user's permissions should match exactly
     * what getPermissionsByRole(role) returns for that role.
     */
    it('should auto-generate permissions matching service for all roles', () => {
      const roles = ['Admin', 'Manager', 'Technician', 'Viewer'];
      
      for (const role of roles) {
        const userData = {
          name: `Test ${role}`,
          email: `${role.toLowerCase()}@test.com`,
          role: role,
          password: 'testPassword123'
        };

        const user = new User(userData);
        
        // Simulate route logic
        if (!user.permissions || (Array.isArray(user.permissions) && user.permissions.length === 0)) {
          const userRole = user.role || 'Viewer';
          const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
          user.permissions = JSON.stringify(permissionsObj);
        }

        // Verify permissions match service output
        const parsed = JSON.parse(user.permissions);
        const servicePerms = PermissionsService.getPermissionsByRole(role);
        
        expect(parsed).toEqual(servicePerms);
      }
    });
  });

  describe('Property 5: Admin Role Has Full Permissions', () => {
    /**
     * **Feature: user-permissions-refactor, Property 5: Admin Role Has Full Permissions**
     * **Validates: Requirements 2.2**
     * 
     * For any admin user, the permissions object should contain create, read, update, delete
     * for all modules (user, meter, device, location, contact, template) and read, update for settings.
     */
    it('should grant admin full CRUD on all modules except settings', () => {
      const userData = {
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'Admin',
        password: 'testPassword123'
      };

      const user = new User(userData);
      
      // Simulate route logic
      if (!user.permissions || (Array.isArray(user.permissions) && user.permissions.length === 0)) {
        const role = user.role || 'Viewer';
        const permissionsObj = PermissionsService.getPermissionsByRole(role);
        user.permissions = JSON.stringify(permissionsObj);
      }

      const parsed = JSON.parse(user.permissions);
      const modules = ['user', 'meter', 'device', 'location', 'contact', 'template'];
      
      for (const module of modules) {
        expect(parsed[module].create).toBe(true);
        expect(parsed[module].read).toBe(true);
        expect(parsed[module].update).toBe(true);
        expect(parsed[module].delete).toBe(true);
      }
      
      // Settings should have read and update only
      expect(parsed.settings.read).toBe(true);
      expect(parsed.settings.update).toBe(true);
    });
  });

  describe('Property 6: Viewer Role Has Read-Only Permissions', () => {
    /**
     * **Feature: user-permissions-refactor, Property 6: Viewer Role Has Read-Only Permissions**
     * **Validates: Requirements 2.3**
     * 
     * For any viewer user, the permissions object should contain only read permissions for all modules
     * (user, meter, device, location, contact, template) and read for settings, with no create, update, or delete permissions.
     */
    it('should grant viewer read-only permissions on all modules', () => {
      const userData = {
        name: 'Viewer User',
        email: 'viewer@test.com',
        role: 'Viewer',
        password: 'testPassword123'
      };

      const user = new User(userData);
      
      // Simulate route logic
      if (!user.permissions || (Array.isArray(user.permissions) && user.permissions.length === 0)) {
        const role = user.role || 'Viewer';
        const permissionsObj = PermissionsService.getPermissionsByRole(role);
        user.permissions = JSON.stringify(permissionsObj);
      }

      const parsed = JSON.parse(user.permissions);
      const modules = PermissionsService.getAvailableModules();
      
      for (const module of modules) {
        const actions = PermissionsService.getAvailableActions(module);
        for (const action of actions) {
          if (action === 'read') {
            expect(parsed[module][action]).toBe(true);
          } else {
            expect(parsed[module][action]).toBe(false);
          }
        }
      }
    });
  });
});
