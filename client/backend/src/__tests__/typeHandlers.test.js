/**
 * Type Handlers Tests
 * 
 * Tests for field deserialization, particularly focusing on:
 * - Field metadata mapping (name vs dbField)
 * - Proper property name assignment in deserialized objects
 * - Type conversion during deserialization
 */

const {
  deserializeRow,
  deserializeValue,
  serializeValue
} = require('../../../../framework/backend/shared/utils/typeHandlers');

describe('typeHandlers - deserializeRow', () => {
  describe('Field Metadata Drives Property Names', () => {
    it('should use field.name as object key when field metadata exists', () => {
      // Simulate a database row with snake_case column names
      const row = {
        id: 1,
        tenant_id: 42,
        name: 'Test User',
        email: 'test@example.com'
      };

      // Field metadata with dbField mappings
      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
        { name: 'name', dbField: 'name', type: 'string' },
        { name: 'email', dbField: 'email', type: 'string' }
      ];

      const deserialized = deserializeRow(row, fields);

      // Verify that the deserialized object uses field.name as keys
      expect(deserialized).toHaveProperty('id', 1);
      expect(deserialized).toHaveProperty('tenant_id', 42);
      expect(deserialized).toHaveProperty('name', 'Test User');
      expect(deserialized).toHaveProperty('email', 'test@example.com');
    });

    it('should map tenant_id from database column to property', () => {
      const row = {
        id: 1,
        tenant_id: 99
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' }
      ];

      const deserialized = deserializeRow(row, fields);

      // The critical test: tenant_id should be accessible as a property
      expect(deserialized.tenant_id).toBe(99);
      expect(deserialized).toHaveProperty('tenant_id');
    });

    it('should handle fields with different dbField names', () => {
      const row = {
        id: 1,
        passwordhash: 'hashed_password_value',
        last_sign_in_at: '2024-01-15T10:30:00Z'
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'passwordHash', dbField: 'passwordhash', type: 'string' },
        { name: 'lastLogin', dbField: 'last_sign_in_at', type: 'Date' }
      ];

      const deserialized = deserializeRow(row, fields);

      // Verify camelCase property names are used, not database column names
      expect(deserialized).toHaveProperty('passwordHash');
      expect(deserialized).toHaveProperty('lastLogin');
      expect(deserialized.passwordHash).toBe('hashed_password_value');
      expect(deserialized.lastLogin).toBeInstanceOf(Date);
    });

    it('should preserve fallback behavior for unmapped columns', () => {
      const row = {
        id: 1,
        name: 'Test',
        extra_column: 'extra_value' // Not in field metadata
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'name', dbField: 'name', type: 'string' }
      ];

      const deserialized = deserializeRow(row, fields);

      // Unmapped columns should still be included as-is
      expect(deserialized).toHaveProperty('extra_column', 'extra_value');
    });

    it('should handle null values correctly', () => {
      const row = {
        id: 1,
        tenant_id: null,
        name: 'Test'
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
        { name: 'name', dbField: 'name', type: 'string' }
      ];

      const deserialized = deserializeRow(row, fields);

      expect(deserialized.tenant_id).toBeNull();
      expect(deserialized).toHaveProperty('tenant_id');
    });

    it('should convert types during deserialization', () => {
      const row = {
        id: 1,
        active: true,
        created_at: '2024-01-15T10:30:00Z',
        permissions: '["read","write"]'
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'active', dbField: 'active', type: 'boolean' },
        { name: 'created_at', dbField: 'created_at', type: 'Date' },
        { name: 'permissions', dbField: 'permissions', type: 'Array' }
      ];

      const deserialized = deserializeRow(row, fields);

      expect(deserialized.id).toBe(1);
      expect(deserialized.active).toBe(true);
      expect(deserialized.created_at).toBeInstanceOf(Date);
      expect(Array.isArray(deserialized.permissions)).toBe(true);
      expect(deserialized.permissions).toEqual(['read', 'write']);
    });
  });

  describe('User Model Deserialization', () => {
    it('should deserialize User row with tenant_id', () => {
      // Simulate a database row from the users table
      const row = {
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        role: 'admin',
        tenant_id: 1,
        active: true,
        passwordhash: 'hashed_value',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        last_sign_in_at: null,
        permissions: '{"admin":{"user:create":true}}'
      };

      // User model field metadata
      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'name', dbField: 'name', type: 'string' },
        { name: 'email', dbField: 'email', type: 'string' },
        { name: 'role', dbField: 'role', type: 'string' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
        { name: 'active', dbField: 'active', type: 'boolean' },
        { name: 'passwordHash', dbField: 'passwordhash', type: 'string' },
        { name: 'createdAt', dbField: 'created_at', type: 'Date' },
        { name: 'updatedAt', dbField: 'updated_at', type: 'Date' },
        { name: 'lastLogin', dbField: 'last_sign_in_at', type: 'Date' },
        { name: 'permissions', dbField: 'permissions', type: 'Object' }
      ];

      const deserialized = deserializeRow(row, fields);

      // Critical assertions for tenant_id
      expect(deserialized).toHaveProperty('tenant_id');
      expect(deserialized.tenant_id).toBe(1);

      // Other assertions
      expect(deserialized.id).toBe(1);
      expect(deserialized.name).toBe('Emil Guirguis');
      expect(deserialized.email).toBe('emilguirguis.eg@gmail.com');
      expect(deserialized.role).toBe('admin');
      expect(deserialized.active).toBe(true);
      expect(deserialized.passwordHash).toBe('hashed_value');
      expect(deserialized.createdAt).toBeInstanceOf(Date);
      expect(deserialized.updatedAt).toBeInstanceOf(Date);
      expect(deserialized.lastLogin).toBeNull();
      expect(typeof deserialized.permissions).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty row', () => {
      const row = {};
      const fields = [
        { name: 'id', dbField: 'id', type: 'number' }
      ];

      const deserialized = deserializeRow(row, fields);
      expect(deserialized).toEqual({});
    });

    it('should handle null row', () => {
      const deserialized = deserializeRow(null, []);
      expect(deserialized).toBeNull();
    });

    it('should handle undefined row', () => {
      const deserialized = deserializeRow(undefined, []);
      expect(deserialized).toBeUndefined();
    });

    it('should handle non-object row', () => {
      const deserialized = deserializeRow('not an object', []);
      expect(deserialized).toBe('not an object');
    });

    it('should handle empty fields array', () => {
      const row = {
        id: 1,
        name: 'Test'
      };

      const deserialized = deserializeRow(row, []);

      // Without field metadata, columns should be kept as-is
      expect(deserialized).toHaveProperty('id', 1);
      expect(deserialized).toHaveProperty('name', 'Test');
    });

    it('should handle deserialization with missing field metadata', () => {
      // Row has columns that don't have field metadata
      const row = {
        id: 1,
        tenant_id: 42,
        unknown_column: 'some_value',
        another_unknown: 'another_value'
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' }
        // unknown_column and another_unknown have no metadata
      ];

      const deserialized = deserializeRow(row, fields);

      // Mapped fields should use field.name as key
      expect(deserialized).toHaveProperty('id', 1);
      expect(deserialized).toHaveProperty('tenant_id', 42);

      // Unmapped columns should be preserved as-is
      expect(deserialized).toHaveProperty('unknown_column', 'some_value');
      expect(deserialized).toHaveProperty('another_unknown', 'another_value');
    });

    it('should handle row with only unmapped columns', () => {
      const row = {
        extra_field_1: 'value1',
        extra_field_2: 'value2'
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' }
      ];

      const deserialized = deserializeRow(row, fields);

      // All columns should be preserved since they're not in field metadata
      expect(deserialized).toHaveProperty('extra_field_1', 'value1');
      expect(deserialized).toHaveProperty('extra_field_2', 'value2');
    });

    it('should handle field metadata with no matching database columns', () => {
      const row = {
        id: 1
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
        { name: 'name', dbField: 'name', type: 'string' }
      ];

      const deserialized = deserializeRow(row, fields);

      // Only id should be in result
      expect(deserialized).toHaveProperty('id', 1);
      // tenant_id and name are not in the row, so they shouldn't be in result
      expect(deserialized).not.toHaveProperty('tenant_id');
      expect(deserialized).not.toHaveProperty('name');
    });

    it('should handle mixed mapped and unmapped columns', () => {
      const row = {
        id: 1,
        tenant_id: 5,
        name: 'Test',
        extra_data: 'extra',
        another_extra: 123
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
        { name: 'name', dbField: 'name', type: 'string' }
      ];

      const deserialized = deserializeRow(row, fields);

      // Mapped fields
      expect(deserialized.id).toBe(1);
      expect(deserialized.tenant_id).toBe(5);
      expect(deserialized.name).toBe('Test');

      // Unmapped fields
      expect(deserialized.extra_data).toBe('extra');
      expect(deserialized.another_extra).toBe(123);
    });

    it('should handle null values for all field types', () => {
      const row = {
        id: null,
        tenant_id: null,
        name: null,
        active: null,
        created_at: null,
        permissions: null
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
        { name: 'name', dbField: 'name', type: 'string' },
        { name: 'active', dbField: 'active', type: 'boolean' },
        { name: 'created_at', dbField: 'created_at', type: 'Date' },
        { name: 'permissions', dbField: 'permissions', type: 'Object' }
      ];

      const deserialized = deserializeRow(row, fields);

      // All fields should be null
      expect(deserialized.id).toBeNull();
      expect(deserialized.tenant_id).toBeNull();
      expect(deserialized.name).toBeNull();
      expect(deserialized.active).toBeNull();
      expect(deserialized.created_at).toBeNull();
      expect(deserialized.permissions).toBeNull();
    });

    it('should handle undefined values in row', () => {
      const row = {
        id: 1,
        tenant_id: undefined,
        name: 'Test'
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
        { name: 'name', dbField: 'name', type: 'string' }
      ];

      const deserialized = deserializeRow(row, fields);

      expect(deserialized.id).toBe(1);
      // undefined should be converted to null during deserialization
      expect(deserialized.tenant_id).toBeNull();
      expect(deserialized.name).toBe('Test');
    });

    it('should handle field with dbField different from name', () => {
      const row = {
        id: 1,
        passwordhash: 'hashed_value',
        last_sign_in_at: '2024-01-15T10:30:00Z'
      };

      const fields = [
        { name: 'id', dbField: 'id', type: 'number' },
        { name: 'passwordHash', dbField: 'passwordhash', type: 'string' },
        { name: 'lastLogin', dbField: 'last_sign_in_at', type: 'Date' }
      ];

      const deserialized = deserializeRow(row, fields);

      // Should use field.name as key, not dbField
      expect(deserialized).toHaveProperty('passwordHash');
      expect(deserialized).toHaveProperty('lastLogin');
      expect(deserialized).not.toHaveProperty('passwordhash');
      expect(deserialized).not.toHaveProperty('last_sign_in_at');

      expect(deserialized.passwordHash).toBe('hashed_value');
      expect(deserialized.lastLogin).toBeInstanceOf(Date);
    });
  });
});

describe('typeHandlers - deserializeValue', () => {
  it('should convert string to Date', () => {
    const value = '2024-01-15T10:30:00Z';
    const result = deserializeValue(value, 'Date', 'created_at');
    
    expect(result).toBeInstanceOf(Date);
    // ISO string may have milliseconds added, so just check it's a valid date
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // January is 0
    expect(result.getDate()).toBe(15);
  });

  it('should convert string to number', () => {
    const value = '42';
    const result = deserializeValue(value, 'number', 'tenant_id');
    
    expect(result).toBe(42);
    expect(typeof result).toBe('number');
  });

  it('should parse JSON string to Object', () => {
    const value = '{"admin":{"user:create":true}}';
    const result = deserializeValue(value, 'Object', 'permissions');
    
    expect(typeof result).toBe('object');
    expect(result.admin).toBeDefined();
  });

  it('should parse JSON string to Array', () => {
    const value = '["read","write"]';
    const result = deserializeValue(value, 'Array', 'permissions');
    
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['read', 'write']);
  });

  it('should handle null values', () => {
    const result = deserializeValue(null, 'number', 'field');
    expect(result).toBeNull();
  });

  it('should handle undefined values', () => {
    const result = deserializeValue(undefined, 'string', 'field');
    expect(result).toBeNull();
  });
});

describe('typeHandlers - serializeValue', () => {
  it('should serialize Date to ISO string', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = serializeValue(date, 'Date');
    
    expect(typeof result).toBe('string');
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should serialize object to JSON string', () => {
    const obj = { admin: { 'user:create': true } };
    const result = serializeValue(obj, 'Object');
    
    expect(typeof result).toBe('string');
    expect(JSON.parse(result)).toEqual(obj);
  });

  it('should serialize array to JSON string', () => {
    const arr = ['read', 'write'];
    const result = serializeValue(arr, 'Array');
    
    expect(typeof result).toBe('string');
    expect(JSON.parse(result)).toEqual(arr);
  });

  it('should handle null values', () => {
    const result = serializeValue(null, 'string');
    expect(result).toBeNull();
  });

  it('should handle undefined values', () => {
    const result = serializeValue(undefined, 'string');
    expect(result).toBeNull();
  });
});
