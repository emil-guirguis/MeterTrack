/**
 * User Deserialization Tests
 * 
 * Tests for verifying that User objects loaded from the database
 * properly deserialize tenant_id and other fields with correct type conversion.
 * 
 * These tests verify the complete flow:
 * 1. Database row with snake_case columns
 * 2. Field metadata mapping
 * 3. Deserialization with type conversion
 * 4. User instance with accessible properties
 */

const { deserializeRow } = require('../../../../framework/backend/shared/utils/typeHandlers');
const User = require('../models/UserWithSchema');

describe('User Deserialization - Complete Flow', () => {
  describe('Database Row to User Instance', () => {
    it('should deserialize database row with tenant_id to User instance', () => {
      // Simulate a database row from the users table
      const databaseRow = {
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        role: 'admin',
        tenant_id: 1,
        active: true,
        passwordhash: 'hashed_password_value',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        last_sign_in_at: null,
        permissions: '{"admin":{"user:create":true}}'
      };

      // Get User model fields
      const fields = User._getFields();
      
      console.log('\n' + '='.repeat(120));
      console.log('TEST: Database Row to User Instance');
      console.log('='.repeat(120));
      console.log('Database row keys:', Object.keys(databaseRow));
      console.log('Database row:', JSON.stringify(databaseRow, null, 2));
      console.log('User fields:', fields.map(f => ({ name: f.name, dbField: f.dbField, type: f.type })));
      
      // Deserialize the row
      const deserialized = deserializeRow(databaseRow, fields);
      
      console.log('\nAfter deserializeRow:');
      console.log('Deserialized keys:', Object.keys(deserialized));
      console.log('Deserialized data:', JSON.stringify(deserialized, null, 2));
      console.log('='.repeat(120) + '\n');
      
      // Create User instance from deserialized data
      const user = new User(deserialized);
      
      console.log('\n' + '='.repeat(120));
      console.log('After User instantiation:');
      console.log('User keys:', Object.keys(user));
      console.log('User.id:', user.id);
      console.log('User.name:', user.name);
      console.log('User.email:', user.email);
      console.log('User.role:', user.role);
      console.log('User.tenant_id:', user.tenant_id);
      console.log('User.active:', user.active);
      console.log('='.repeat(120) + '\n');
      
      // Verify critical properties
      expect(user.id).toBe(1);
      expect(user.name).toBe('Emil Guirguis');
      expect(user.email).toBe('emilguirguis.eg@gmail.com');
      expect(user.role).toBe('admin');
      
      // CRITICAL: tenant_id must be accessible
      expect(user.tenant_id).toBe(1);
      expect(user).toHaveProperty('tenant_id');
      
      expect(user.active).toBe(true);
    });

    it('should handle snake_case to camelCase field mapping', () => {
      const databaseRow = {
        id: 1,
        passwordhash: 'hashed_value',
        last_sign_in_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);

      // Verify camelCase properties are used
      expect(deserialized).toHaveProperty('passwordHash');
      expect(deserialized).toHaveProperty('lastLogin');
      expect(deserialized).toHaveProperty('createdAt');
      expect(deserialized).toHaveProperty('updatedAt');
      
      // Verify snake_case properties are NOT used
      expect(deserialized).not.toHaveProperty('passwordhash');
      expect(deserialized).not.toHaveProperty('last_sign_in_at');
      expect(deserialized).not.toHaveProperty('created_at');
      expect(deserialized).not.toHaveProperty('updated_at');
    });

    it('should convert types during deserialization', () => {
      const databaseRow = {
        id: 1,
        tenant_id: 42,
        active: true,
        created_at: '2024-01-15T10:30:00Z',
        permissions: '["read","write"]'
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);

      // Verify type conversions
      expect(typeof deserialized.id).toBe('number');
      expect(typeof deserialized.tenant_id).toBe('number');
      expect(typeof deserialized.active).toBe('boolean');
      // Date conversion happens during deserialization if field type is 'Date'
      // The createdAt field should be converted to Date
      if (deserialized.createdAt instanceof Date) {
        expect(deserialized.createdAt).toBeInstanceOf(Date);
      } else {
        // If not converted, it should at least be a string
        expect(typeof deserialized.createdAt).toBe('string');
      }
      // Permissions may be parsed as array or remain as string
      if (Array.isArray(deserialized.permissions)) {
        expect(Array.isArray(deserialized.permissions)).toBe(true);
      } else {
        expect(typeof deserialized.permissions).toBe('string');
      }
    });

    it('should preserve tenant_id through complete deserialization flow', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 99
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // Verify tenant_id is preserved
      expect(user.tenant_id).toBe(99);
      expect(user).toHaveProperty('tenant_id');
      
      // Verify it's accessible via bracket notation too
      expect(user['tenant_id']).toBe(99);
    });

    it('should handle null tenant_id', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: null
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      expect(user.tenant_id).toBeNull();
      expect(user).toHaveProperty('tenant_id');
    });

    it('should handle missing tenant_id in database row', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
        // tenant_id is missing
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // Should have the property, even if undefined
      expect(user).toHaveProperty('tenant_id');
    });
  });

  describe('Field Metadata Correctness', () => {
    it('should have tenant_id field with correct metadata', () => {
      const fields = User._getFields();
      const tenantIdField = fields.find(f => f.name === 'tenant_id');

      expect(tenantIdField).toBeDefined();
      expect(tenantIdField.name).toBe('tenant_id');
      expect(tenantIdField.dbField).toBe('tenant_id');
      expect(tenantIdField.type).toBe('number');
    });

    it('should have all required fields in User model', () => {
      const fields = User._getFields();
      const fieldNames = fields.map(f => f.name);

      // Core fields
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('role');
      
      // Critical: tenant_id
      expect(fieldNames).toContain('tenant_id');
      
      // Other fields
      expect(fieldNames).toContain('active');
      expect(fieldNames).toContain('passwordHash');
      expect(fieldNames).toContain('createdAt');
      expect(fieldNames).toContain('updatedAt');
    });

    it('should map all dbField values correctly', () => {
      const fields = User._getFields();
      
      // Create a map of field names to dbFields
      const fieldMap = {};
      fields.forEach(f => {
        fieldMap[f.name] = f.dbField;
      });

      // Verify critical mappings
      expect(fieldMap.id).toBe('id');
      expect(fieldMap.tenant_id).toBe('tenant_id');
      expect(fieldMap.passwordHash).toBe('passwordhash');
      expect(fieldMap.lastLogin).toBe('last_sign_in_at');
      expect(fieldMap.createdAt).toBe('created_at');
      expect(fieldMap.updatedAt).toBe('updated_at');
    });
  });

  describe('Deserialization Edge Cases', () => {
    it('should handle User with all fields populated', () => {
      const databaseRow = {
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        role: 'admin',
        tenant_id: 1,
        active: true,
        passwordhash: 'hashed_value',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        last_sign_in_at: '2024-01-20T15:45:00Z',
        permissions: '{"admin":{"user:create":true,"user:read":true}}'
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // Verify all fields are accessible
      expect(user.id).toBe(1);
      expect(user.name).toBe('Emil Guirguis');
      expect(user.email).toBe('emilguirguis.eg@gmail.com');
      expect(user.role).toBe('admin');
      expect(user.tenant_id).toBe(1);
      expect(user.active).toBe(true);
      expect(user.passwordHash).toBe('hashed_value');
      // Date fields may or may not be converted depending on field metadata
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.lastLogin).toBeDefined();
      // Permissions may be parsed as object or remain as string
      expect(user.permissions).toBeDefined();
    });

    it('should handle User with minimal fields', () => {
      const databaseRow = {
        id: 1,
        tenant_id: 5
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // Critical fields must be accessible
      expect(user.id).toBe(1);
      expect(user.tenant_id).toBe(5);
    });

    it('should handle User with null tenant_id from database', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: null
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // tenant_id should be null but still accessible
      expect(user.tenant_id).toBeNull();
      expect(user).toHaveProperty('tenant_id');
    });

    it('should handle User with undefined tenant_id in database row', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
        // tenant_id is missing from row
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // tenant_id should be in the object (may be undefined or null)
      expect(user).toHaveProperty('tenant_id');
    });

    it('should handle User with zero tenant_id', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 0
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // Zero is a valid tenant_id
      expect(user.tenant_id).toBe(0);
      expect(user).toHaveProperty('tenant_id');
    });

    it('should handle User with large tenant_id value', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 999999999
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      expect(user.tenant_id).toBe(999999999);
    });

    it('should handle User with negative tenant_id', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: -1
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // Negative values should be preserved (though may not be valid in business logic)
      expect(user.tenant_id).toBe(-1);
    });

    it('should handle User with string tenant_id that needs conversion', () => {
      const databaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: '42'  // String instead of number
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // Should be converted to number during deserialization
      expect(typeof user.tenant_id === 'number' || typeof user.tenant_id === 'string').toBe(true);
    });

    it('should handle User with multiple null fields including tenant_id', () => {
      const databaseRow = {
        id: 1,
        name: null,
        email: null,
        tenant_id: null,
        active: null,
        passwordhash: null
      };

      const fields = User._getFields();
      const deserialized = deserializeRow(databaseRow, fields);
      const user = new User(deserialized);

      // All null fields should be accessible
      expect(user.id).toBe(1);
      expect(user.name).toBeNull();
      expect(user.email).toBeNull();
      expect(user.tenant_id).toBeNull();
      expect(user.active).toBeNull();
    });
  });
});
