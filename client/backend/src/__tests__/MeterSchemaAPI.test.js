/**
 * Meter Schema API Tests
 * 
 * Tests for the Meter schema API endpoints
 */

const request = require('supertest');
const express = require('express');
const schemaRouter = require('../routes/schema');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/schema', schemaRouter);

describe('Meter Schema API', () => {
  describe('GET /api/schema', () => {
    test('should include meter in available schemas', async () => {
      const response = await request(app)
        .get('/api/schema')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.schemas).toBeDefined();
      
      const meterSchema = response.body.data.schemas.find(s => s.entityName === 'Meter');
      expect(meterSchema).toBeDefined();
      expect(meterSchema.tableName).toBe('meter');
      expect(meterSchema.endpoint).toBe('/api/schema/meter');
    });
  });

  describe('GET /api/schema/meter', () => {
    test('should return meter schema', async () => {
      const response = await request(app)
        .get('/api/schema/meter')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const schema = response.body.data;
      expect(schema.entityName).toBe('Meter');
      expect(schema.tableName).toBe('meter');
    });

    test('should include all form fields', async () => {
      const response = await request(app)
        .get('/api/schema/meter')
        .expect(200);

      const formFields = response.body.data.formFields;
      expect(formFields).toBeDefined();
      expect(Object.keys(formFields)).toHaveLength(17);
      
      // Check key fields
      expect(formFields.name).toBeDefined();
      expect(formFields.type).toBeDefined();
      expect(formFields.serialNumber).toBeDefined();
      expect(formFields.deviceId).toBeDefined();
      expect(formFields.locationId).toBeDefined();
      expect(formFields.ip).toBeDefined();
      expect(formFields.port).toBeDefined();
      expect(formFields.protocol).toBeDefined();
      expect(formFields.status).toBeDefined();
      expect(formFields.registerMap).toBeDefined();
      expect(formFields.active).toBeDefined();
    });

    test('should include all entity fields', async () => {
      const response = await request(app)
        .get('/api/schema/meter')
        .expect(200);

      const entityFields = response.body.data.entityFields;
      expect(entityFields).toBeDefined();
      expect(Object.keys(entityFields)).toHaveLength(3);
      
      expect(entityFields.id).toBeDefined();
      expect(entityFields.createdAt).toBeDefined();
      expect(entityFields.updatedAt).toBeDefined();
    });

    test('should include all relationships', async () => {
      const response = await request(app)
        .get('/api/schema/meter')
        .expect(200);

      const relationships = response.body.data.relationships;
      expect(relationships).toBeDefined();
      expect(Object.keys(relationships)).toHaveLength(8);
      
      // BELONGS_TO relationships
      expect(relationships.device).toBeDefined();
      expect(relationships.device.type).toBe('belongsTo');
      expect(relationships.device.model).toBe('Device');
      
      expect(relationships.location).toBeDefined();
      expect(relationships.location.type).toBe('belongsTo');
      expect(relationships.location.model).toBe('Location');
      
      // HAS_MANY relationships
      expect(relationships.readings).toBeDefined();
      expect(relationships.readings.type).toBe('hasMany');
      expect(relationships.readings.model).toBe('MeterReadings');
      
      expect(relationships.statusLogs).toBeDefined();
      expect(relationships.maintenanceRecords).toBeDefined();
      expect(relationships.triggers).toBeDefined();
      expect(relationships.usageAlerts).toBeDefined();
      expect(relationships.monitoringAlerts).toBeDefined();
    });

    test('should not include function references', async () => {
      const response = await request(app)
        .get('/api/schema/meter')
        .expect(200);

      const jsonString = JSON.stringify(response.body.data);
      expect(jsonString).not.toContain('function');
      expect(jsonString).not.toContain('=>');
    });
  });

  describe('POST /api/schema/meter/validate', () => {
    test('should validate valid meter data', async () => {
      const validData = {
        name: 'Test Meter',
        type: 'electric',
        serialNumber: 'SN123',
        deviceId: 1,
        locationId: 1,
        ip: '192.168.1.100',
        port: 502,
        protocol: 'modbus',
        status: 'active',
        active: true,
      };

      const response = await request(app)
        .post('/api/schema/meter/validate')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.errors).toEqual({});
    });

    test('should reject data missing required fields', async () => {
      const invalidData = {
        serialNumber: 'SN123',
        // Missing required 'name' and 'type'
      };

      const response = await request(app)
        .post('/api/schema/meter/validate')
        .send(invalidData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.name).toBeDefined();
      expect(response.body.data.errors.type).toBeDefined();
    });

    test('should validate field types', async () => {
      const invalidData = {
        name: 'Test Meter',
        type: 'electric',
        port: 'not-a-number', // Should be number
      };

      const response = await request(app)
        .post('/api/schema/meter/validate')
        .send(invalidData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.port).toBeDefined();
    });
  });
});
