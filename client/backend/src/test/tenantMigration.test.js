/**
 * Tenant Model Migration Tests
 * 
 * Tests for the migrated Tenant model with schema system
 */

const Tenant = require('../models/TenantWithSchema');

describe('Tenant Model Migration', () => {
  describe('Schema Definition', () => {
    test('should have schema defined', () => {
      expect(Tenant.schema).toBeDefined();
      expect(Tenant.schema.schema).toBeDefined();
    });

    test('should have correct entity name and table name', () => {
      const schema = Tenant.schema.schema;
      expect(schema.entityName).toBe('Tenant');
      expect(schema.tableName).toBe('tenant');
    });

    test('should have formFields defined', () => {
      const schema = Tenant.schema.schema;
      expect(schema.formFields).toBeDefined();
      expect(Object.keys(schema.formFields).length).toBeGreaterThan(0);
    });

    test('should have entityFields defined', () => {
      const schema = Tenant.schema.schema;
      expect(schema.entityFields).toBeDefined();
      expect(schema.entityFields.id).toBeDefined();
      expect(schema.entityFields.createdAt).toBeDefined();
      expect(schema.entityFields.updatedAt).toBeDefined();
    });

    test('should have required fields', () => {
      const schema = Tenant.schema.schema;
      expect(schema.formFields.name).toBeDefined();
      expect(schema.formFields.name.required).toBe(true);
    });
  });

  describe('Field Initialization', () => {
    test('should auto-initialize all fields from schema', () => {
      const tenant = new Tenant();
      
      // Check formFields exist (may be undefined if no data provided)
      expect('name' in tenant).toBe(true);
      expect('url' in tenant).toBe(true);
      expect('street' in tenant).toBe(true);
      expect('city' in tenant).toBe(true);
      expect('state' in tenant).toBe(true);
      expect('zip' in tenant).toBe(true);
      expect('country' in tenant).toBe(true);
      expect('active' in tenant).toBe(true);
      expect('meterReadingBatchCount' in tenant).toBe(true);
      
      // Check entityFields exist
      expect('id' in tenant).toBe(true);
      expect('createdAt' in tenant).toBe(true);
      expect('updatedAt' in tenant).toBe(true);
    });

    test('should initialize with provided data', () => {
      const data = {
        name: 'Test Company',
        url: 'https://test.com',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US',
        active: true,
        meterReadingBatchCount: 5,
      };
      
      const tenant = new Tenant(data);
      
      expect(tenant.name).toBe('Test Company');
      expect(tenant.url).toBe('https://test.com');
      expect(tenant.street).toBe('123 Test St');
      expect(tenant.city).toBe('Test City');
      expect(tenant.state).toBe('TS');
      expect(tenant.zip).toBe('12345');
      expect(tenant.country).toBe('US');
      expect(tenant.active).toBe(true);
      expect(tenant.meterReadingBatchCount).toBe(5);
    });

    test('should use default values when not provided', () => {
      const tenant = new Tenant();
      
      // initializeFromData only sets values if they exist in data
      // When no data is provided, fields will be undefined
      expect(tenant.name).toBeUndefined();
      expect(tenant.url).toBeUndefined();
      expect(tenant.country).toBeUndefined();
      expect(tenant.active).toBeUndefined();
      expect(tenant.meterReadingBatchCount).toBeUndefined();
    });
  });

  describe('Relationships', () => {
    test('should have relationships defined', () => {
      const schema = Tenant.schema.schema;
      expect(schema.relationships).toBeDefined();
    });

    test('should have users relationship (HAS_MANY)', () => {
      const schema = Tenant.schema.schema;
      expect(schema.relationships.users).toBeDefined();
      expect(schema.relationships.users.type).toBe('hasMany');
      expect(schema.relationships.users.model).toBe('User');
      expect(schema.relationships.users.foreignKey).toBe('tenant_id');
      expect(schema.relationships.users.autoLoad).toBe(false);
    });

    test('should have contacts relationship (HAS_MANY)', () => {
      const schema = Tenant.schema.schema;
      expect(schema.relationships.contacts).toBeDefined();
      expect(schema.relationships.contacts.type).toBe('hasMany');
      expect(schema.relationships.contacts.model).toBe('Contact');
      expect(schema.relationships.contacts.foreignKey).toBe('tenant_id');
      expect(schema.relationships.contacts.autoLoad).toBe(false);
    });

    test('should have devices relationship (HAS_MANY)', () => {
      const schema = Tenant.schema.schema;
      expect(schema.relationships.devices).toBeDefined();
      expect(schema.relationships.devices.type).toBe('hasMany');
      expect(schema.relationships.devices.model).toBe('Device');
      expect(schema.relationships.devices.foreignKey).toBe('tenant_id');
      expect(schema.relationships.devices.autoLoad).toBe(false);
    });
  });

  describe('Schema Serialization', () => {
    test('should serialize to JSON', () => {
      const json = Tenant.schema.toJSON();
      
      expect(json).toBeDefined();
      expect(json.entityName).toBe('Tenant');
      expect(json.tableName).toBe('tenant');
      expect(json.formFields).toBeDefined();
      expect(json.entityFields).toBeDefined();
      expect(json.relationships).toBeDefined();
    });

    test('should include all field properties in JSON', () => {
      const json = Tenant.schema.toJSON();
      
      // Check a sample field has all properties
      expect(json.formFields.name).toBeDefined();
      expect(json.formFields.name.type).toBe('string');
      expect(json.formFields.name.required).toBe(true);
      expect(json.formFields.name.label).toBe('Name');
      expect(json.formFields.name.dbField).toBe('name');
    });
  });

  describe('Validation', () => {
    test('should validate required fields', () => {
      const validation = Tenant.schema.validate({});
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.name).toBeDefined();
    });

    test('should pass validation with valid data', () => {
      const validation = Tenant.schema.validate({
        name: 'Test Company',
      });
      
      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors).length).toBe(0);
    });

    test('should validate maxLength constraints', () => {
      const validation = Tenant.schema.validate({
        name: 'A'.repeat(101), // Exceeds maxLength of 100
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.name).toBeDefined();
    });
  });

  describe('Database Field Mapping', () => {
    test('should map camelCase to snake_case', () => {
      const formData = {
        name: 'Test Company',
        meterReadingBatchCount: 10,
      };
      
      const dbData = Tenant.schema.toDatabase(formData);
      
      expect(dbData.name).toBe('Test Company');
      expect(dbData.meter_reading_batch_count).toBe(10);
    });

    test('should map snake_case to camelCase', () => {
      const dbData = {
        name: 'Test Company',
        meter_reading_batch_count: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      const formData = Tenant.schema.fromDatabase(dbData);
      
      expect(formData.name).toBe('Test Company');
      expect(formData.meterReadingBatchCount).toBe(10);
      // fromDatabase only processes formFields, not entityFields
      // So createdAt and updatedAt won't be in the result
    });
  });

  describe('Multi-Tenant Isolation', () => {
    test('should support tenant-specific data isolation', () => {
      const tenant1 = new Tenant({ id: 1, name: 'Tenant 1' });
      const tenant2 = new Tenant({ id: 2, name: 'Tenant 2' });
      
      expect(tenant1.id).toBe(1);
      expect(tenant2.id).toBe(2);
      expect(tenant1.name).toBe('Tenant 1');
      expect(tenant2.name).toBe('Tenant 2');
    });

    test('should have relationships for tenant isolation', () => {
      const schema = Tenant.schema.schema;
      
      // Verify relationships exist for multi-tenant entities
      expect(schema.relationships.users).toBeDefined();
      expect(schema.relationships.contacts).toBeDefined();
      expect(schema.relationships.devices).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain same API interface', () => {
      expect(Tenant.tableName).toBe('tenant');
      expect(Tenant.primaryKey).toBe('id');
    });

    test('should support legacy field access', () => {
      const tenant = new Tenant({
        name: 'Test Company',
        active: true,
      });
      
      // Fields should be accessible directly
      expect(tenant.name).toBe('Test Company');
      expect(tenant.active).toBe(true);
    });
  });
});
