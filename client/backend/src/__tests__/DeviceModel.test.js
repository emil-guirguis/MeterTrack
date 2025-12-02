/**
 * Device Model Tests
 * 
 * Tests verify that the Device model with schema definition works correctly
 */

const Device = require('../models/Device');

describe('Device Model with Schema', () => {
  describe('Schema Definition', () => {
    it('should have a valid schema', () => {
      const schema = Device.schema;
      
      expect(schema).toBeDefined();
      expect(schema.schema.entityName).toBe('Device');
      expect(schema.schema.tableName).toBe('device');
    });

    it('should have all required form fields', () => {
      const schema = Device.schema;
      const formFieldNames = schema.getFormFieldNames();
      
      expect(formFieldNames).toContain('description');
      expect(formFieldNames).toContain('manufacturer');
      expect(formFieldNames).toContain('modelNumber');
      expect(formFieldNames).toContain('type');
      expect(formFieldNames).toContain('registerMap');
      expect(formFieldNames).toContain('active');
    });

    it('should have all required entity fields', () => {
      const schema = Device.schema;
      const entityFieldNames = schema.getEntityFieldNames();
      
      expect(entityFieldNames).toContain('id');
      expect(entityFieldNames).toContain('createdAt');
      expect(entityFieldNames).toContain('updatedAt');
      expect(entityFieldNames).toContain('tenantId');
    });

    it('should have tenant relationship', () => {
      const schema = Device.schema;
      const relationships = schema.schema.relationships;
      
      expect(relationships.tenant).toBeDefined();
      expect(relationships.tenant.type).toBe('belongsTo');
      expect(relationships.tenant.model).toBe('Tenant');
      expect(relationships.tenant.foreignKey).toBe('tenant_id');
    });

    it('should have meters relationship', () => {
      const schema = Device.schema;
      const relationships = schema.schema.relationships;
      
      expect(relationships.meters).toBeDefined();
      expect(relationships.meters.type).toBe('hasMany');
      expect(relationships.meters.model).toBe('Meter');
      expect(relationships.meters.foreignKey).toBe('device_id');
    });
  });

  describe('Field Validation', () => {
    it('should validate device data with all fields', () => {
      const schema = Device.schema;
      const result = schema.validate({
        description: 'Test Device',
        manufacturer: 'Acme Corp',
        modelNumber: 'MODEL-123',
        type: 'electric',
        registerMap: { register1: 'value1' },
        active: true,
      });
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should validate device data with minimal fields', () => {
      const schema = Device.schema;
      const result = schema.validate({
        // All fields are optional
      });
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should enforce maxLength constraints', () => {
      const schema = Device.schema;
      const result = schema.validate({
        description: 'A'.repeat(256), // exceeds maxLength of 255
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBeDefined();
    });

    it('should validate boolean field type', () => {
      const schema = Device.schema;
      const result = schema.validate({
        active: 'not-a-boolean', // should be boolean
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.active).toBeDefined();
    });
  });

  describe('Auto-initialization', () => {
    it('should auto-initialize fields from data', () => {
      const data = {
        description: 'Test Device',
        manufacturer: 'Acme Corp',
        model_number: 'MODEL-123',
        type: 'electric',
        register_map: { register1: 'value1' },
        active: true,
        id: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        tenant_id: 1,
      };

      const device = new Device(data);

      expect(device.description).toBe('Test Device');
      expect(device.manufacturer).toBe('Acme Corp');
      expect(device.modelNumber).toBe('MODEL-123');
      expect(device.type).toBe('electric');
      expect(device.registerMap).toEqual({ register1: 'value1' });
      expect(device.active).toBe(true);
      expect(device.id).toBe(1);
      expect(device.createdAt).toBe('2024-01-01');
      expect(device.updatedAt).toBe('2024-01-02');
      expect(device.tenantId).toBe(1);
    });

    it('should initialize with empty data', () => {
      const device = new Device({});

      // Fields will be undefined when not provided in data
      // This is expected behavior - defaults are only used when creating new records
      expect(device.description).toBeUndefined();
      expect(device.manufacturer).toBeUndefined();
      expect(device.modelNumber).toBeUndefined();
      expect(device.type).toBeUndefined();
      expect(device.registerMap).toBeUndefined();
      expect(device.active).toBeUndefined();
    });

    it('should initialize with partial data', () => {
      const device = new Device({
        manufacturer: 'Acme Corp',
        type: 'electric',
      });

      expect(device.manufacturer).toBe('Acme Corp');
      expect(device.type).toBe('electric');
      // Fields not provided will be undefined
      expect(device.description).toBeUndefined();
      expect(device.active).toBeUndefined();
    });
  });

  describe('Data Transformation', () => {
    it('should transform form data to database format', () => {
      const schema = Device.schema;
      const formData = {
        description: 'Test Device',
        manufacturer: 'Acme Corp',
        modelNumber: 'MODEL-123',
        type: 'electric',
        registerMap: { register1: 'value1' },
        active: true,
      };

      const dbData = schema.toDatabase(formData);

      expect(dbData.description).toBe('Test Device');
      expect(dbData.manufacturer).toBe('Acme Corp');
      expect(dbData.model_number).toBe('MODEL-123'); // camelCase to snake_case
      expect(dbData.type).toBe('electric');
      expect(dbData.register_map).toEqual({ register1: 'value1' }); // camelCase to snake_case
      expect(dbData.active).toBe(true);
    });

    it('should transform database data to form format', () => {
      const schema = Device.schema;
      const dbData = {
        description: 'Test Device',
        manufacturer: 'Acme Corp',
        model_number: 'MODEL-123',
        type: 'electric',
        register_map: { register1: 'value1' },
        active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        tenant_id: 1,
      };

      const formData = schema.fromDatabase(dbData);

      expect(formData.description).toBe('Test Device');
      expect(formData.manufacturer).toBe('Acme Corp');
      expect(formData.modelNumber).toBe('MODEL-123'); // snake_case to camelCase
      expect(formData.type).toBe('electric');
      expect(formData.registerMap).toEqual({ register1: 'value1' }); // snake_case to camelCase
      expect(formData.active).toBe(true);
    });
  });

  describe('Schema Serialization', () => {
    it('should serialize to JSON for API', () => {
      const schema = Device.schema;
      const json = schema.toJSON();

      expect(json.entityName).toBe('Device');
      expect(json.tableName).toBe('device');
      expect(json.formFields).toBeDefined();
      expect(json.entityFields).toBeDefined();
      expect(json.relationships).toBeDefined();
      
      // Verify no functions in JSON
      const jsonString = JSON.stringify(json);
      expect(jsonString).not.toContain('[Function');
      expect(jsonString).not.toContain('function(');
    });

    it('should include all field properties in JSON', () => {
      const schema = Device.schema;
      const json = schema.toJSON();

      const manufacturerField = json.formFields.manufacturer;
      expect(manufacturerField.type).toBe('string');
      expect(manufacturerField.required).toBe(false);
      expect(manufacturerField.label).toBe('Manufacturer');
      expect(manufacturerField.maxLength).toBe(255);

      const activeField = json.formFields.active;
      expect(activeField.type).toBe('boolean');
      expect(activeField.required).toBe(false);
      expect(activeField.label).toBe('Active');
      expect(activeField.default).toBe(false);
    });

    it('should include relationships in JSON', () => {
      const schema = Device.schema;
      const json = schema.toJSON();

      expect(json.relationships.tenant).toBeDefined();
      expect(json.relationships.tenant.type).toBe('belongsTo');
      expect(json.relationships.tenant.model).toBe('Tenant');

      expect(json.relationships.meters).toBeDefined();
      expect(json.relationships.meters.type).toBe('hasMany');
      expect(json.relationships.meters.model).toBe('Meter');
    });
  });

  describe('Field Types', () => {
    it('should have correct field types', () => {
      const schema = Device.schema;
      const formFields = schema.schema.formFields;

      expect(formFields.description.type).toBe('string');
      expect(formFields.manufacturer.type).toBe('string');
      expect(formFields.modelNumber.type).toBe('string');
      expect(formFields.type.type).toBe('string');
      expect(formFields.registerMap.type).toBe('object');
      expect(formFields.active.type).toBe('boolean');
    });

    it('should have correct entity field types', () => {
      const schema = Device.schema;
      const entityFields = schema.schema.entityFields;

      expect(entityFields.id.type).toBe('number');
      expect(entityFields.createdAt.type).toBe('date');
      expect(entityFields.updatedAt.type).toBe('date');
      expect(entityFields.tenantId.type).toBe('number');
    });
  });

  describe('Database Field Mapping', () => {
    it('should map camelCase to snake_case correctly', () => {
      const schema = Device.schema;
      const formFields = schema.schema.formFields;

      expect(formFields.modelNumber.dbField).toBe('model_number');
      expect(formFields.registerMap.dbField).toBe('register_map');
    });

    it('should handle fields without mapping', () => {
      const schema = Device.schema;
      const formFields = schema.schema.formFields;

      expect(formFields.description.dbField).toBe('description');
      expect(formFields.manufacturer.dbField).toBe('manufacturer');
      expect(formFields.type.dbField).toBe('type');
      expect(formFields.active.dbField).toBe('active');
    });
  });
});
