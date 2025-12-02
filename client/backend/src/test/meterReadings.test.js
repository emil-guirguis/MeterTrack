/**
 * MeterReadings Model Test
 * 
 * Tests the MeterReadings model with schema definition
 */

// Jest globals (describe, test, expect) are available automatically
const MeterReadings = require('../models/MeterReadingsWithSchema');

describe('MeterReadings Model', () => {
  describe('Schema Definition', () => {
    test('should have a schema defined', () => {
      expect(MeterReadings.schema).toBeDefined();
      expect(MeterReadings.schema.schema).toBeDefined();
    });

    test('should have correct entity name', () => {
      const schema = MeterReadings.schema.schema;
      expect(schema.entityName).toBe('MeterReadings');
    });

    test('should have correct table name', () => {
      const schema = MeterReadings.schema.schema;
      expect(schema.tableName).toBe('meter_readings');
    });

    test('should have formFields defined', () => {
      const schema = MeterReadings.schema.schema;
      expect(schema.formFields).toBeDefined();
      expect(Object.keys(schema.formFields).length).toBeGreaterThan(0);
    });

    test('should have entityFields defined', () => {
      const schema = MeterReadings.schema.schema;
      expect(schema.entityFields).toBeDefined();
      expect(schema.entityFields.id).toBeDefined();
      expect(schema.entityFields.createdat).toBeDefined();
      expect(schema.entityFields.tenantId).toBeDefined();
    });

    test('should have 119 total fields', () => {
      const schema = MeterReadings.schema.schema;
      const formFieldsCount = Object.keys(schema.formFields).length;
      const entityFieldsCount = Object.keys(schema.entityFields).length;
      const totalFields = formFieldsCount + entityFieldsCount;
      expect(totalFields).toBe(119);
    });
  });

  describe('Relationships', () => {
    test('should have meter relationship defined', () => {
      const schema = MeterReadings.schema.schema;
      expect(schema.relationships).toBeDefined();
      expect(schema.relationships.meter).toBeDefined();
    });

    test('meter relationship should be BELONGS_TO', () => {
      const schema = MeterReadings.schema.schema;
      const meterRelationship = schema.relationships.meter;
      expect(meterRelationship.type).toBe('belongsTo');
    });

    test('meter relationship should reference Meter model', () => {
      const schema = MeterReadings.schema.schema;
      const meterRelationship = schema.relationships.meter;
      expect(meterRelationship.model).toBe('Meter');
    });

    test('meter relationship should use meter_id as foreign key', () => {
      const schema = MeterReadings.schema.schema;
      const meterRelationship = schema.relationships.meter;
      expect(meterRelationship.foreignKey).toBe('meter_id');
    });

    test('meter relationship should not auto-load by default', () => {
      const schema = MeterReadings.schema.schema;
      const meterRelationship = schema.relationships.meter;
      expect(meterRelationship.autoLoad).toBe(false);
    });
  });

  describe('Field Initialization', () => {
    test('should initialize with empty data', () => {
      const reading = new MeterReadings();
      expect(reading).toBeDefined();
    });

    test('should initialize fields from data', () => {
      const data = {
        voltage: 220,
        current: 10,
        power: 2200,
        meterId: 1
      };
      const reading = new MeterReadings(data);
      expect(reading.voltage).toBe(220);
      expect(reading.current).toBe(10);
      expect(reading.power).toBe(2200);
      expect(reading.meterId).toBe(1);
    });

    test('should have fields available from schema', () => {
      const reading = new MeterReadings({});
      const schema = MeterReadings.schema.schema;
      // Fields are defined in schema even if not initialized
      expect(schema.formFields.voltage).toBeDefined();
      expect(schema.formFields.current).toBeDefined();
      expect(schema.formFields.power).toBeDefined();
    });
  });

  describe('Schema Serialization', () => {
    test('should serialize schema to JSON', () => {
      const schemaJSON = MeterReadings.schema.toJSON();
      expect(schemaJSON).toBeDefined();
      expect(schemaJSON.entityName).toBe('MeterReadings');
      expect(schemaJSON.tableName).toBe('meter_readings');
      expect(schemaJSON.formFields).toBeDefined();
      expect(schemaJSON.entityFields).toBeDefined();
      expect(schemaJSON.relationships).toBeDefined();
    });

    test('serialized schema should not contain function references', () => {
      const schemaJSON = MeterReadings.schema.toJSON();
      const jsonString = JSON.stringify(schemaJSON);
      expect(jsonString).not.toContain('function');
      expect(jsonString).not.toContain('=>');
    });
  });
});
