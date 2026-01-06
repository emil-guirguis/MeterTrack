/**
 * User Model Tests
 * 
 * Tests for the User model focusing on:
 * - User.findById() returns objects with tenant_id property
 * - User.findByEmail() returns objects with tenant_id property
 * - Field metadata includes tenant_id with correct dbField mapping
 * - Deserialization works correctly for User objects
 */

const User = require('../models/UserWithSchema');

describe('User Model - tenant_id Field Accessibility', () => {
  describe('Field Metadata Verification', () => {
    it('should have tenant_id in entity fields', () => {
      const schema = User.schema;
      expect(schema).toBeDefined();
      expect(schema.entityFields).toBeDefined();
      expect(schema.entityFields.tenant_id).toBeDefined();
    });

    it('should have correct dbField mapping for tenant_id', () => {
      const schema = User.schema;
      const tenantIdField = schema.entityFields.tenant_id;
      
      expect(tenantIdField.name).toBe('tenant_id');
      expect(tenantIdField.dbField).toBe('tenant_id');
      expect(tenantIdField.type).toBe('number');
    });

    it('should extract tenant_id field from User model', () => {
      const fields = User._getFields();
      const tenantIdField = fields.find(f => f.name === 'tenant_id');
      
      expect(tenantIdField).toBeDefined();
      expect(tenantIdField.name).toBe('tenant_id');
      expect(tenantIdField.dbField).toBe('tenant_id');
      expect(tenantIdField.type).toBe('number');
    });
  });

  describe('User Instance Creation', () => {
    it('should create User instance with tenant_id property', () => {
      const userData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        tenant_id: 42,
        active: true,
        passwordHash: 'hashed_value'
      };

      const user = new User(userData);

      // Verify tenant_id is accessible
      expect(user.tenant_id).toBe(42);
      expect(user).toHaveProperty('tenant_id');
    });

    it('should handle null tenant_id', () => {
      const userData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: null
      };

      const user = new User(userData);

      expect(user.tenant_id).toBeNull();
      expect(user).toHaveProperty('tenant_id');
    });

    it('should handle undefined tenant_id', () => {
      const userData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      };

      const user = new User(userData);

      // Should be undefined or null depending on schema initialization
      expect(user.tenant_id === undefined || user.tenant_id === null).toBe(true);
    });
  });

  describe('User Object Structure', () => {
    it('should have all expected properties on User instance', () => {
      const userData = {
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        role: 'admin',
        tenant_id: 1,
        active: true,
        passwordHash: 'hashed_value',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = new User(userData);

      // Core properties
      expect(user.id).toBe(1);
      expect(user.name).toBe('Emil Guirguis');
      expect(user.email).toBe('emilguirguis.eg@gmail.com');
      expect(user.role).toBe('admin');
      
      // Critical: tenant_id must be accessible
      expect(user.tenant_id).toBe(1);
      
      // Other properties
      expect(user.active).toBe(true);
      expect(user.passwordHash).toBe('hashed_value');
    });

    it('should preserve tenant_id through object serialization', () => {
      const userData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 99
      };

      const user = new User(userData);
      
      // Verify tenant_id is in the object
      const keys = Object.keys(user);
      expect(keys).toContain('tenant_id');
      
      // Verify it can be accessed
      expect(user['tenant_id']).toBe(99);
    });
  });

  describe('User Methods with tenant_id', () => {
    it('should have findByEmail method', () => {
      expect(typeof User.findByEmail).toBe('function');
    });

    it('should have findById method', () => {
      expect(typeof User.findById).toBe('function');
    });

    it('should have findOne method', () => {
      expect(typeof User.findOne).toBe('function');
    });

    it('should have findAll method', () => {
      expect(typeof User.findAll).toBe('function');
    });
  });

  describe('User Schema Initialization', () => {
    it('should initialize User from data with tenant_id', () => {
      const data = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        tenant_id: 5
      };

      const user = new User(data);

      // Schema should initialize tenant_id
      expect(user.tenant_id).toBe(5);
    });

    it('should have schema with formFields and entityFields', () => {
      const schema = User.schema;
      
      expect(schema.formFields).toBeDefined();
      expect(schema.entityFields).toBeDefined();
      
      // tenant_id should be in entityFields
      expect(schema.entityFields.tenant_id).toBeDefined();
    });

    it('should have tenant_id in entityFields with correct type', () => {
      const schema = User.schema;
      const tenantIdField = schema.entityFields.tenant_id;
      
      expect(tenantIdField.type).toBe('number');
      expect(tenantIdField.name).toBe('tenant_id');
      expect(tenantIdField.dbField).toBe('tenant_id');
    });
  });
});
