// /**
//  * User Model Migration Tests
//  * 
//  * Tests to verify the User model migration to schema system
//  */

// const User = require('../models/UserWithSchema');

// describe('User Model Migration', () => {
//   describe('Schema Definition', () => {
//     test('should have schema defined', () => {
//       expect(User.schema).toBeDefined();
//       expect(typeof User.schema.toJSON).toBe('function');
//     });

//     test('should have correct entity name and table name', () => {
//       const schema = User.schema.toJSON();
//       expect(schema.entityName).toBe('User');
//       expect(schema.tableName).toBe('users');
//     });

//     test('should have all required form fields', () => {
//       const schema = User.schema.toJSON();
//       const formFields = Object.keys(schema.formFields);
      
//       expect(formFields).toContain('name');
//       expect(formFields).toContain('email');
//       expect(formFields).toContain('role');
//       expect(formFields).toContain('status');
//       expect(formFields).toContain('permissions');
//     });

//     test('should have all required entity fields', () => {
//       const schema = User.schema.toJSON();
//       const entityFields = Object.keys(schema.entityFields);
      
//       expect(entityFields).toContain('id');
//       expect(entityFields).toContain('tenantId');
//       expect(entityFields).toContain('createdAt');
//       expect(entityFields).toContain('updatedAt');
//     });

//     test('should have tenant relationship', () => {
//       const schema = User.schema.toJSON();
//       expect(schema.relationships).toBeDefined();
//       expect(schema.relationships.tenant).toBeDefined();
//       expect(schema.relationships.tenant.type).toBe('belongsTo');
//       expect(schema.relationships.tenant.model).toBe('Tenant');
//       expect(schema.relationships.tenant.foreignKey).toBe('tenant_id');
//     });
//   });

//   describe('Field Definitions', () => {
//     test('name field should be required string', () => {
//       const schema = User.schema.toJSON();
//       const nameField = schema.formFields.name;
      
//       expect(nameField.type).toBe('string');
//       expect(nameField.required).toBe(true);
//       expect(nameField.maxLength).toBe(100);
//     });

//     test('email field should be required email type', () => {
//       const schema = User.schema.toJSON();
//       const emailField = schema.formFields.email;
      
//       expect(emailField.type).toBe('email');
//       expect(emailField.required).toBe(true);
//       expect(emailField.maxLength).toBe(254);
//     });

//     test('role field should have enum values', () => {
//       const schema = User.schema.toJSON();
//       const roleField = schema.formFields.role;
      
//       expect(roleField.type).toBe('string');
//       expect(roleField.enumValues).toEqual(['admin', 'manager', 'technician', 'viewer']);
//       expect(roleField.default).toBe('viewer');
//     });

//     test('status field should have enum values', () => {
//       const schema = User.schema.toJSON();
//       const statusField = schema.formFields.status;
      
//       expect(statusField.type).toBe('string');
//       expect(statusField.enumValues).toEqual(['active', 'inactive']);
//       expect(statusField.default).toBe('active');
//     });

//     test('permissions field should be array type', () => {
//       const schema = User.schema.toJSON();
//       const permissionsField = schema.formFields.permissions;
      
//       expect(permissionsField.type).toBe('array');
//       expect(permissionsField.default).toEqual([]);
//     });
//   });

//   describe('Field Initialization', () => {
//     test('should auto-initialize fields from data', () => {
//       const userData = {
//         id: 1,
//         tenant_id: 1,
//         name: 'Test User',
//         email: 'test@example.com',
//         role: 'admin',
//         status: 'active',
//         permissions: ['user:read', 'user:write'],
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       const user = new User(userData);

//       expect(user.id).toBe(1);
//       expect(user.tenantId).toBe(1);
//       expect(user.name).toBe('Test User');
//       expect(user.email).toBe('test@example.com');
//       expect(user.role).toBe('admin');
//       expect(user.active).toBe('active');
//       expect(user.permissions).toEqual(['user:read', 'user:write']);
//     });

//     test('should initialize fields as undefined when data not provided', () => {
//       const user = new User({});

//       // Fields are undefined when no data provided (defaults are for forms, not model instances)
//       expect(user.name).toBeUndefined();
//       expect(user.email).toBeUndefined();
//       expect(user.role).toBeUndefined();
//       expect(user.v).toBeUndefined();
//       expect(user.permissions).toBeUndefined();
//     });
//   });

//   describe('Database Field Mapping', () => {
//     test('should map snake_case to camelCase', () => {
//       const userData = {
//         tenant_id: 1,
//         password_hash: 'hashed',
//         last_login: new Date(),
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       const user = new User(userData);

//       expect(user.tenantId).toBe(1);
//       expect(user.passwordHash).toBe('hashed');
//       expect(user.lastLogin).toBeDefined();
//       expect(user.createdAt).toBeDefined();
//       expect(user.updatedAt).toBeDefined();
//     });
//   });

//   describe('Schema Validation', () => {
//     test('should validate required fields', () => {
//       const schema = User.schema;
//       const validation = schema.validate({});

//       expect(validation.isValid).toBe(false);
//       expect(validation.errors.name).toBeDefined();
//       expect(validation.errors.email).toBeDefined();
//     });

//     test('should accept valid email format', () => {
//       const schema = User.schema;
//       const validation = schema.validate({
//         name: 'Test User',
//         email: 'test@example.com',
//       });

//       // Email validation is done at application level, not schema level
//       // Schema only validates type, required, length, etc.
//       expect(validation.isValid).toBe(true);
//     });

//     test('should validate enum values', () => {
//       const schema = User.schema;
//       const validation = schema.validate({
//         name: 'Test User',
//         email: 'test@example.com',
//         role: 'invalid-role',
//       });

//       expect(validation.isValid).toBe(false);
//       expect(validation.errors.role).toBeDefined();
//     });

//     test('should pass validation with valid data', () => {
//       const schema = User.schema;
//       const validation = schema.validate({
//         name: 'Test User',
//         email: 'test@example.com',
//         role: 'admin',
//         status: 'active',
//       });

//       expect(validation.isValid).toBe(true);
//       expect(Object.keys(validation.errors).length).toBe(0);
//     });
//   });

//   describe('Backward Compatibility', () => {
//     test('should maintain same table name', () => {
//       expect(User.tableName).toBe('users');
//     });

//     test('should maintain same primary key', () => {
//       expect(User.primaryKey).toBe('id');
//     });

//     test('should support legacy field names', () => {
//       const userData = {
//         password_hash: 'hashed',
//         tenant_id: 1,
//       };

//       const user = new User(userData);

//       // Should be accessible via camelCase
//       expect(user.passwordHash).toBe('hashed');
//       expect(user.tenantId).toBe(1);
//     });
//   });
// });
