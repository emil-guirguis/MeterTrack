/**
 * MeterReadings Schema API Test
 * 
 * Tests the schema API endpoints for MeterReadings
 */

const request = require('supertest');
const express = require('express');
const schemaRouter = require('../routes/schema');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/schema', schemaRouter);

describe('MeterReadings Schema API', () => {
  describe('GET /api/schema', () => {
    test('should include meterReadings in available schemas', async () => {
      const response = await request(app)
        .get('/api/schema')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.schemas).toBeDefined();
      
      const meterReadingsSchema = response.body.data.schemas.find(
        s => s.entityName === 'MeterReadings'
      );
      
      expect(meterReadingsSchema).toBeDefined();
      expect(meterReadingsSchema.tableName).toBe('meter_readings');
      expect(meterReadingsSchema.endpoint).toBe('/api/schema/meterReadings');
    });
  });

  describe('GET /api/schema/meterReadings', () => {
    test('should return MeterReadings schema', async () => {
      const response = await request(app)
        .get('/api/schema/meterReadings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.entityName).toBe('MeterReadings');
      expect(response.body.data.tableName).toBe('meter_readings');
    });

    test('should include formFields in schema', async () => {
      const response = await request(app)
        .get('/api/schema/meterReadings')
        .expect(200);

      expect(response.body.data.formFields).toBeDefined();
      expect(Object.keys(response.body.data.formFields).length).toBeGreaterThan(0);
      
      // Check some key fields
      expect(response.body.data.formFields.voltage).toBeDefined();
      expect(response.body.data.formFields.current).toBeDefined();
      expect(response.body.data.formFields.power).toBeDefined();
      expect(response.body.data.formFields.meterId).toBeDefined();
    });

    test('should include entityFields in schema', async () => {
      const response = await request(app)
        .get('/api/schema/meterReadings')
        .expect(200);

      expect(response.body.data.entityFields).toBeDefined();
      expect(response.body.data.entityFields.id).toBeDefined();
      expect(response.body.data.entityFields.createdat).toBeDefined();
      expect(response.body.data.entityFields.tenantId).toBeDefined();
    });

    test('should include relationships in schema', async () => {
      const response = await request(app)
        .get('/api/schema/meterReadings')
        .expect(200);

      expect(response.body.data.relationships).toBeDefined();
      expect(response.body.data.relationships.meter).toBeDefined();
      expect(response.body.data.relationships.meter.type).toBe('belongsTo');
      expect(response.body.data.relationships.meter.model).toBe('Meter');
      expect(response.body.data.relationships.meter.foreignKey).toBe('meter_id');
    });

    test('should have 119 total fields', async () => {
      const response = await request(app)
        .get('/api/schema/meterReadings')
        .expect(200);

      const formFieldsCount = Object.keys(response.body.data.formFields).length;
      const entityFieldsCount = Object.keys(response.body.data.entityFields).length;
      const totalFields = formFieldsCount + entityFieldsCount;
      
      expect(totalFields).toBe(119);
    });
  });

  describe('POST /api/schema/meterReadings/validate', () => {
    test('should validate valid data', async () => {
      const validData = {
        voltage: 220,
        current: 10,
        power: 2200,
        meterId: 1
      };

      const response = await request(app)
        .post('/api/schema/meterReadings/validate')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should handle empty data', async () => {
      const response = await request(app)
        .post('/api/schema/meterReadings/validate')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
