/**
 * Meter Model Tests
 * 
 * Tests for the migrated Meter model with schema definition
 */

const Meter = require('../models/Meter');
const { FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

describe('Meter Model', () => {
  describe('Schema Definition', () => {
    test('should have a schema getter', () => {
      expect(Meter.schema).toBeDefined();
      expect(typeof Meter.schema).toBe('object');
    });

    test('should have correct entity name and table name', () => {
      const schema = Meter.schema;
      expect(schema.schema.entityName).toBe('Meter');
      expect(schema.schema.tableName).toBe('meter');
    });

    test('should have all 17 form fields', () => {
      const schema = Meter.schema;
      const formFields = schema.schema.formFields;
      
      expect(Object.keys(formFields)).toHaveLength(17);
      expect(formFields.name).toBeDefined();
      expect(formFields.type).toBeDefined();
      expect(formFields.serialNumber).toBeDefined();
      expect(formFields.installationDate).toBeDefined();
      expect(formFields.deviceId).toBeDefined();
      expect(formFields.locationId).toBeDefined();
      expect(formFields.ip).toBeDefined();
      expect(formFields.port).toBeDefined();
      expect(formFields.protocol).toBeDefined();
      expect(formFields.status).toBeDefined();
      expect(formFields.nextMaintenance).toBeDefined();
      expect(formFields.lastMaintenance).toBeDefined();
      expect(formFields.maintenanceInterval).toBeDefined();
      expect(formFields.maintenanceNotes).toBeDefined();
      expect(formFields.registerMap).toBeDefined();
      expect(formFields.notes).toBeDefined();
      expect(formFields.active).toBeDefined();
    });

    test('should have all 3 entity fields', () => {
      const schema = Meter.schema;
      const entityFields = schema.schema.entityFields;
      
      expect(Object.keys(entityFields)).toHaveLength(3);
      expect(entityFields.id).toBeDefined();
      expect(entityFields.createdAt).toBeDefined();
      expect(entityFields.updatedAt).toBeDefined();
    });

    test('should have correct field types', () => {
      const schema = Meter.schema;
      const formFields = schema.schema.formFields;
      
      expect(formFields.name.type).toBe(FieldTypes.STRING);
      expect(formFields.type.type).toBe(FieldTypes.STRING);
      expect(formFields.serialNumber.type).toBe(FieldTypes.STRING);
      expect(formFields.installationDate.type).toBe(FieldTypes.DATE);
      expect(formFields.deviceId.type).toBe(FieldTypes.NUMBER);
      expect(formFields.locationId.type).toBe(FieldTypes.NUMBER);
      expect(formFields.ip.type).toBe(FieldTypes.STRING);
      expect(formFields.port.type).toBe(FieldTypes.NUMBER);
      expect(formFields.protocol.type).toBe(FieldTypes.STRING);
      expect(formFields.status.type).toBe(FieldTypes.STRING);
      expect(formFields.nextMaintenance.type).toBe(FieldTypes.DATE);
      expect(formFields.lastMaintenance.type).toBe(FieldTypes.DATE);
      expect(formFields.maintenanceInterval.type).toBe(FieldTypes.STRING);
      expect(formFields.maintenanceNotes.type).toBe(FieldTypes.STRING);
      expect(formFields.registerMap.type).toBe(FieldTypes.OBJECT);
      expect(formFields.notes.type).toBe(FieldTypes.STRING);
      expect(formFields.active.type).toBe(FieldTypes.BOOLEAN);
    });

    test('should have correct required fields', () => {
      const schema = Meter.schema;
      const formFields = schema.schema.formFields;
      
      expect(formFields.name.required).toBe(true);
      expect(formFields.type.required).toBe(true);
      expect(formFields.serialNumber.required).toBe(false);
    });

    test('should have correct database field mappings', () => {
      const schema = Meter.schema;
      const formFields = schema.schema.formFields;
      
      expect(formFields.name.dbField).toBe('name');
      expect(formFields.serialNumber.dbField).toBe('serial_number');
      expect(formFields.installationDate.dbField).toBe('installation_date');
      expect(formFields.deviceId.dbField).toBe('device_id');
      expect(formFields.locationId.dbField).toBe('location_id');
      expect(formFields.nextMaintenance.dbField).toBe('next_maintenance');
      expect(formFields.lastMaintenance.dbField).toBe('last_maintenance');
      expect(formFields.maintenanceInterval.dbField).toBe('maintenance_interval');
      expect(formFields.maintenanceNotes.dbField).toBe('maintenance_notes');
      expect(formFields.registerMap.dbField).toBe('register_map');
    });
  });

  describe('Relationships', () => {
    test('should have 8 relationships defined', () => {
      const schema = Meter.schema;
      const relationships = schema.schema.relationships;
      
      expect(Object.keys(relationships)).toHaveLength(8);
    });

    test('should have BELONGS_TO relationships', () => {
      const schema = Meter.schema;
      const relationships = schema.schema.relationships;
      
      // Device relationship
      expect(relationships.device).toBeDefined();
      expect(relationships.device.type).toBe(RelationshipTypes.BELONGS_TO);
      expect(relationships.device.model).toBe('Device');
      expect(relationships.device.foreignKey).toBe('device_id');
      expect(relationships.device.autoLoad).toBe(false);
      
      // Location relationship
      expect(relationships.location).toBeDefined();
      expect(relationships.location.type).toBe(RelationshipTypes.BELONGS_TO);
      expect(relationships.location.model).toBe('Location');
      expect(relationships.location.foreignKey).toBe('location_id');
      expect(relationships.location.autoLoad).toBe(false);
    });

    test('should have HAS_MANY relationships', () => {
      const schema = Meter.schema;
      const relationships = schema.schema.relationships;
      
      // Readings relationship
      expect(relationships.readings).toBeDefined();
      expect(relationships.readings.type).toBe(RelationshipTypes.HAS_MANY);
      expect(relationships.readings.model).toBe('MeterReadings');
      expect(relationships.readings.foreignKey).toBe('meter_id');
      
      // Status logs relationship
      expect(relationships.statusLogs).toBeDefined();
      expect(relationships.statusLogs.type).toBe(RelationshipTypes.HAS_MANY);
      expect(relationships.statusLogs.model).toBe('MeterStatusLog');
      expect(relationships.statusLogs.foreignKey).toBe('meter_id');
      
      // Maintenance records relationship
      expect(relationships.maintenanceRecords).toBeDefined();
      expect(relationships.maintenanceRecords.type).toBe(RelationshipTypes.HAS_MANY);
      expect(relationships.maintenanceRecords.model).toBe('MeterMaintenance');
      expect(relationships.maintenanceRecords.foreignKey).toBe('meter_id');
      
      // Triggers relationship
      expect(relationships.triggers).toBeDefined();
      expect(relationships.triggers.type).toBe(RelationshipTypes.HAS_MANY);
      expect(relationships.triggers.model).toBe('MeterTriggers');
      expect(relationships.triggers.foreignKey).toBe('meter_id');
      
      // Usage alerts relationship
      expect(relationships.usageAlerts).toBeDefined();
      expect(relationships.usageAlerts.type).toBe(RelationshipTypes.HAS_MANY);
      expect(relationships.usageAlerts.model).toBe('MeterUsageAlerts');
      expect(relationships.usageAlerts.foreignKey).toBe('meter_id');
      
      // Monitoring alerts relationship
      expect(relationships.monitoringAlerts).toBeDefined();
      expect(relationships.monitoringAlerts.type).toBe(RelationshipTypes.HAS_MANY);
      expect(relationships.monitoringAlerts.model).toBe('MeterMonitoringAlerts');
      expect(relationships.monitoringAlerts.foreignKey).toBe('meter_id');
    });
  });

  describe('Auto-initialization', () => {
    test('should auto-initialize all fields from data', () => {
      const testData = {
        id: 1,
        name: 'Test Meter',
        type: 'electric',
        serialNumber: 'SN123456',
        installationDate: '2024-01-01',
        deviceId: 10,
        locationId: 20,
        ip: '192.168.1.100',
        port: 502,
        protocol: 'modbus',
        status: 'active',
        nextMaintenance: '2024-12-01',
        lastMaintenance: '2024-06-01',
        maintenanceInterval: '6 months',
        maintenanceNotes: 'Regular maintenance',
        registerMap: { register1: 'value1' },
        notes: 'Test notes',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const meter = new Meter(testData);

      expect(meter.id).toBe(1);
      expect(meter.name).toBe('Test Meter');
      expect(meter.type).toBe('electric');
      expect(meter.serialNumber).toBe('SN123456');
      expect(meter.installationDate).toBe('2024-01-01');
      expect(meter.deviceId).toBe(10);
      expect(meter.locationId).toBe(20);
      expect(meter.ip).toBe('192.168.1.100');
      expect(meter.port).toBe(502);
      expect(meter.protocol).toBe('modbus');
      expect(meter.status).toBe('active');
      expect(meter.nextMaintenance).toBe('2024-12-01');
      expect(meter.lastMaintenance).toBe('2024-06-01');
      expect(meter.maintenanceInterval).toBe('6 months');
      expect(meter.maintenanceNotes).toBe('Regular maintenance');
      expect(meter.registerMap).toEqual({ register1: 'value1' });
      expect(meter.notes).toBe('Test notes');
      expect(meter.active).toBe(true);
      expect(meter.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(meter.updatedAt).toBe('2024-01-01T00:00:00Z');
    });

    test('should initialize fields as undefined when data is not provided', () => {
      const meter = new Meter({});

      // Fields should be undefined when not provided
      expect(meter.name).toBeUndefined();
      expect(meter.type).toBeUndefined();
      expect(meter.serialNumber).toBeUndefined();
      expect(meter.installationDate).toBeUndefined();
      expect(meter.deviceId).toBeUndefined();
      expect(meter.locationId).toBeUndefined();
      expect(meter.ip).toBeUndefined();
      expect(meter.port).toBeUndefined();
      expect(meter.protocol).toBeUndefined();
      expect(meter.status).toBeUndefined();
      expect(meter.active).toBeUndefined();
      expect(meter.registerMap).toBeUndefined();
    });
  });

  describe('Schema Serialization', () => {
    test('should serialize schema to JSON', () => {
      const schema = Meter.schema;
      const json = schema.toJSON();

      expect(json).toBeDefined();
      expect(json.entityName).toBe('Meter');
      expect(json.tableName).toBe('meter');
      expect(json.formFields).toBeDefined();
      expect(json.entityFields).toBeDefined();
      expect(json.relationships).toBeDefined();
    });

    test('should not include function references in JSON', () => {
      const schema = Meter.schema;
      const json = schema.toJSON();
      const jsonString = JSON.stringify(json);

      expect(jsonString).not.toContain('function');
      expect(jsonString).not.toContain('=>');
    });
  });

  describe('Custom Methods', () => {
    test('should have findByMeterId static method', () => {
      expect(typeof Meter.findByMeterId).toBe('function');
    });

    test('should have getStats static method', () => {
      expect(typeof Meter.getStats).toBe('function');
    });
  });

  describe('Static Configuration', () => {
    test('should have correct table name', () => {
      expect(Meter.tableName).toBe('meter');
    });

    test('should have correct primary key', () => {
      expect(Meter.primaryKey).toBe('id');
    });
  });
});
