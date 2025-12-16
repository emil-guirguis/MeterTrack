/**
 * User Model Tests
 * 
 * Tests for User model permissions handling
 * Verifies JSON serialization/deserialization and validation
 */

const User = require('./UserWithSchema');
const PermissionsService = require('../services/PermissionsService');

describe('User Model - Permissions Methods', () => {
  describe('validatePermissionsObject', () => {
    it('should validate correct permissions object', () => {
      const user = new User();
      const validPerms = PermissionsService.getPermissionsByRole('admin');
      
      expect(user.validatePermissionsObject(validPerms)).toBe(true);
    });

    it('should reject invalid permissions object', () => {
      const user = new User();
      const invalidPerms = { user: { create: 'yes' } }; // Should be boolean
      
      expect(user.validatePermissionsObject(invalidPerms)).toBe(false);
    });

    it('should reject null', () => {
      const user = new User();
      expect(user.validatePermissionsObject(null)).toBe(false);
    });
  });

  describe('getPermissionsAsNestedObject', () => {
    it('should parse JSON string permissions', () => {
      const user = new User();
      const adminPerms = PermissionsService.getPermissionsByRole('admin');
      
      // Store as JSON string (simulating database storage)
      user.permissions = JSON.stringify(adminPerms);
      
      const retrieved = user.getPermissionsAsNestedObject();
      expect(retrieved).toEqual(adminPerms);
    });

    it('should handle direct object permissions', () => {
      const user = new User();
      const adminPerms = PermissionsService.getPermissionsByRole('admin');
      
      // Store as direct object
      user.permissions = adminPerms;
      
      const retrieved = user.getPermissionsAsNestedObject();
      expect(retrieved).toEqual(adminPerms);
    });

    it('should convert array format to nested object', () => {
      const user = new User();
      const flatArray = ['user:create', 'user:read', 'meter:read'];
      
      // Store as array (old format)
      user.permissions = flatArray;
      
      const retrieved = user.getPermissionsAsNestedObject();
      expect(retrieved.user.create).toBe(true);
      expect(retrieved.user.read).toBe(true);
      expect(retrieved.meter.read).toBe(true);
      expect(retrieved.meter.create).toBe(false);
    });

    it('should fallback to viewer permissions for invalid data', () => {
      const user = new User();
      const viewerPerms = PermissionsService.getPermissionsByRole('viewer');
      
      // Store invalid data
      user.permissions = 'invalid json {';
      
      const retrieved = user.getPermissionsAsNestedObject();
      expect(retrieved).toEqual(viewerPerms);
    });

    it('should handle undefined permissions', () => {
      const user = new User();
      user.permissions = undefined;
      
      const retrieved = user.getPermissionsAsNestedObject();
      const viewerPerms = PermissionsService.getPermissionsByRole('viewer');
      expect(retrieved).toEqual(viewerPerms);
    });
  });

  describe('getPermissionsAsFlatArray', () => {
    it('should convert nested object to flat array', () => {
      const user = new User();
      const adminPerms = PermissionsService.getPermissionsByRole('admin');
      
      user.permissions = JSON.stringify(adminPerms);
      
      const flatArray = user.getPermissionsAsFlatArray();
      expect(Array.isArray(flatArray)).toBe(true);
      expect(flatArray).toContain('user:create');
      expect(flatArray).toContain('user:read');
      expect(flatArray).toContain('user:update');
      expect(flatArray).toContain('user:delete');
    });

    it('should return empty array for invalid permissions', () => {
      const user = new User();
      user.permissions = 'invalid';
      
      const flatArray = user.getPermissionsAsFlatArray();
      // Should fallback to viewer permissions
      expect(Array.isArray(flatArray)).toBe(true);
      expect(flatArray.length).toBeGreaterThan(0);
    });
  });

  describe('setPermissionsFromNestedObject', () => {
    it('should store valid permissions as JSON string', () => {
      const user = new User();
      const adminPerms = PermissionsService.getPermissionsByRole('admin');
      
      const result = user.setPermissionsFromNestedObject(adminPerms);
      
      expect(result).toBe(true);
      expect(typeof user.permissions).toBe('string');
      
      // Verify it can be parsed back
      const parsed = JSON.parse(user.permissions);
      expect(parsed).toEqual(adminPerms);
    });

    it('should reject invalid permissions object', () => {
      const user = new User();
      const invalidPerms = { invalid: 'structure' };
      
      const result = user.setPermissionsFromNestedObject(invalidPerms);
      
      expect(result).toBe(false);
    });

    it('should store permissions that validate correctly', () => {
      const user = new User();
      const viewerPerms = PermissionsService.getPermissionsByRole('viewer');
      
      user.setPermissionsFromNestedObject(viewerPerms);
      
      const retrieved = user.getPermissionsAsNestedObject();
      expect(user.validatePermissionsObject(retrieved)).toBe(true);
    });
  });

  describe('setPermissionsFromFlatArray', () => {
    it('should convert flat array and store as JSON', () => {
      const user = new User();
      const flatArray = ['user:create', 'user:read', 'meter:read'];
      
      const result = user.setPermissionsFromFlatArray(flatArray);
      
      expect(result).toBe(true);
      expect(typeof user.permissions).toBe('string');
      
      // Verify it can be retrieved as nested object
      const nested = user.getPermissionsAsNestedObject();
      expect(nested.user.create).toBe(true);
      expect(nested.user.read).toBe(true);
      expect(nested.meter.read).toBe(true);
    });

    it('should handle empty array', () => {
      const user = new User();
      const result = user.setPermissionsFromFlatArray([]);
      
      expect(result).toBe(true);
      const nested = user.getPermissionsAsNestedObject();
      expect(user.validatePermissionsObject(nested)).toBe(true);
    });
  });

  describe('Property 3: Permissions Storage Round Trip', () => {
    /**
     * **Feature: user-permissions-refactor, Property 3: Permissions Storage Round Trip**
     * **Validates: Requirements 1.3, 2.4**
     * 
     * For any user with permissions, storing the user to the database and retrieving it
     * should result in permissions that parse back to an equivalent nested object structure.
     */
    it('should maintain permissions through storage round trip', () => {
      const roles = ['admin', 'manager', 'technician', 'viewer'];
      
      for (const role of roles) {
        const user = new User();
        const originalPerms = PermissionsService.getPermissionsByRole(role);
        
        // Simulate storage: convert to JSON string
        user.setPermissionsFromNestedObject(originalPerms);
        
        // Simulate retrieval: parse back to nested object
        const retrievedPerms = user.getPermissionsAsNestedObject();
        
        // Verify equivalence
        expect(retrievedPerms).toEqual(originalPerms);
        expect(user.validatePermissionsObject(retrievedPerms)).toBe(true);
      }
    });

    it('should handle round trip with flat array conversion', () => {
      const user = new User();
      const originalPerms = PermissionsService.getPermissionsByRole('admin');
      
      // Store as nested object
      user.setPermissionsFromNestedObject(originalPerms);
      
      // Retrieve as flat array
      const flatArray = user.getPermissionsAsFlatArray();
      
      // Convert back to nested
      const reconstructed = PermissionsService.toNestedObject(flatArray);
      
      // Verify equivalence
      expect(reconstructed).toEqual(originalPerms);
    });

    it('should preserve permissions through multiple conversions', () => {
      const user = new User();
      const originalPerms = PermissionsService.getPermissionsByRole('manager');
      
      // Store as nested
      user.setPermissionsFromNestedObject(originalPerms);
      
      // Get as flat array
      const flat1 = user.getPermissionsAsFlatArray();
      
      // Set from flat array
      user.setPermissionsFromFlatArray(flat1);
      
      // Get as flat array again
      const flat2 = user.getPermissionsAsFlatArray();
      
      // Get as nested object
      const final = user.getPermissionsAsNestedObject();
      
      // Verify all conversions preserved the permissions
      expect(flat1).toEqual(flat2);
      expect(final).toEqual(originalPerms);
    });
  });
});
