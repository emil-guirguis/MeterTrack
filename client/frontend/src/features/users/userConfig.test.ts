/**
 * User Configuration Tests
 * 
 * Tests for the unified schema migration of the User entity
 */

import { describe, it, expect } from 'vitest';
import { userSchema, userFormSchema, type User, type UserRole } from './userConfig';

describe('User Schema Migration', () => {
  describe('Schema Definition', () => {
    it('should define userSchema with form and entity fields', () => {
      expect(userSchema).toBeDefined();
      expect(userSchema.form).toBeDefined();
      expect(userSchema.definition).toBeDefined();
    });

    it('should export userFormSchema for backward compatibility', () => {
      expect(userFormSchema).toBeDefined();
      expect(userFormSchema).toBe(userSchema.form);
    });

    it('should have correct form fields', () => {
      const formFieldNames = userSchema.getFormFieldNames();
      expect(formFieldNames).toContain('name');
      expect(formFieldNames).toContain('email');
    });

    it('should have correct entity fields', () => {
      const entityFieldNames = userSchema.getEntityFieldNames();
      expect(entityFieldNames).toContain('id');
      expect(entityFieldNames).toContain('client');
      expect(entityFieldNames).toContain('role');
      expect(entityFieldNames).toContain('status');
      expect(entityFieldNames).toContain('permissions');
      expect(entityFieldNames).toContain('lastLogin');
      expect(entityFieldNames).toContain('createdAt');
      expect(entityFieldNames).toContain('updatedAt');
    });
  });

  describe('Form Schema Utilities', () => {
    it('should provide getDefaults() method', () => {
      const defaults = userFormSchema.getDefaults();
      expect(defaults).toBeDefined();
      expect(defaults.name).toBe('');
      expect(defaults.email).toBe('');
    });

    it('should provide toApi() method', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      const apiData = userFormSchema.toApi(formData);
      expect(apiData).toBeDefined();
      expect(apiData.name).toBe('John Doe');
      expect(apiData.email).toBe('john@example.com');
    });

    it('should provide fromApi() method', () => {
      const apiData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
      };
      const formData = userFormSchema.fromApi(apiData);
      expect(formData).toBeDefined();
      expect(formData.name).toBe('Jane Smith');
      expect(formData.email).toBe('jane@example.com');
    });
  });

  describe('Type Inference', () => {
    it('should infer User type correctly', () => {
      const user: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        client: 'test-client',
        role: 'viewer',
        permissions: [],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('123');
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('viewer');
      expect(user.active).toBe(true);
    });

    it('should enforce UserRole enum values', () => {
      const roles: UserRole[] = ['admin', 'manager', 'technician', 'viewer'];
      roles.forEach(role => {
        const user: User = {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          client: 'test',
          role,
          permissions: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(user.role).toBe(role);
      });
    });

    it('should enforce active boolean values', () => {
      const activeStates: boolean[] = [true, false];
      activeStates.forEach(active => {
        const user: User = {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          client: 'test',
          role: 'viewer',
          permissions: [],
          active,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(user.active).toBe(active);
      });
    });

    it('should allow optional lastLogin field', () => {
      const userWithoutLogin: User = {
        id: '1',
        name: 'Test',
        email: 'test@test.com',
        client: 'test',
        role: 'viewer',
        permissions: [],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(userWithoutLogin.lastLogin).toBeUndefined();

      const userWithLogin: User = {
        ...userWithoutLogin,
        lastLogin: new Date(),
      };
      expect(userWithLogin.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('Schema Metadata', () => {
    it('should have correct entity name', () => {
      expect(userSchema.definition.entityName).toBe('User');
    });

    it('should have entity description', () => {
      expect(userSchema.definition.description).toBe('User entity for authentication and authorization');
    });
  });

  describe('Field Utilities', () => {
    it('should identify form fields correctly', () => {
      expect(userSchema.isFormField('name')).toBe(true);
      expect(userSchema.isFormField('email')).toBe(true);
      expect(userSchema.isFormField('id')).toBe(false);
      expect(userSchema.isFormField('role')).toBe(false);
    });

    it('should identify entity fields correctly', () => {
      expect(userSchema.isEntityField('id')).toBe(true);
      expect(userSchema.isEntityField('role')).toBe(true);
      expect(userSchema.isEntityField('status')).toBe(true);
      expect(userSchema.isEntityField('name')).toBe(false);
      expect(userSchema.isEntityField('email')).toBe(false);
    });

    it('should get all field names', () => {
      const allFields = userSchema.getAllFieldNames();
      expect(allFields).toContain('name');
      expect(allFields).toContain('email');
      expect(allFields).toContain('id');
      expect(allFields).toContain('role');
      expect(allFields).toContain('status');
      expect(allFields).toContain('permissions');
      expect(allFields).toContain('lastLogin');
      expect(allFields).toContain('createdAt');
      expect(allFields).toContain('updatedAt');
    });
  });
});
