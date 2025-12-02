/**
 * Tenant Schema API Tests
 * 
 * Tests for the Tenant schema API endpoint
 */

const request = require('supertest');
const express = require('express');
const schemaRouter = require('../routes/schema');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/schema', schemaRouter);

describe('Tenant Schema API', () => {
  describe('GET /api/schema', () => {
    test('should include tenant in available schemas', async () => {
      const response = await request(app)
        .get('/api/schema')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.schemas).toBeDefined();
      
      const tenantSchema = response.body.data.schemas.find(
        s => s.entityName === 'Tenant'
      );
      
      expect(tenantSchema).toBeDefined();
      expect(tenantSchema.tableName).toBe('tenant');
      expect(tenantSchema.endpoint).toBe('/api/schema/tenant');
    });
  });

  describe('GET /api/schema/tenant', () => {
    test('should return tenant schema', async () => {
      const response = await request(app)
        .get('/api/schema/tenant')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const schema = response.body.data;
      expect(schema.entityName).toBe('Tenant');
      expect(schema.tableName).toBe('tenant');
      expect(schema.formFields).toBeDefined();
      expect(schema.entityFields).toBeDefined();
      expect(schema.relationships).toBeDefined();
    });

    test('should include all form fields', async () => {
      const response = await request(app)
        .get('/api/schema/tenant')
        .expect(200);

      const formFields = response.body.data.formFields;
      
      expect(formFields.name).toBeDefined();
      expect(formFields.url).toBeDefined();
      expect(formFields.street).toBeDefined();
      expect(formFields.city).toBeDefined();
      expect(formFields.state).toBeDefined();
      expect(formFields.zip).toBeDefined();
      expect(formFields.country).toBeDefined();
      expect(formFields.active).toBeDefined();
      expect(formFields.meterReadingBatchCount).toBeDefined();
    });

    test('should include all entity fields', async () => {
      const response = await request(app)
        .get('/api/schema/tenant')
        .expect(200);

      const entityFields = response.body.data.entityFields;
      
      expect(entityFields.id).toBeDefined();
      expect(entityFields.createdAt).toBeDefined();
      expect(entityFields.updatedAt).toBeDefined();
    });

    test('should include relationships', async () => {
      const response = await request(app)
        .get('/api/schema/tenant')
        .expect(200);

      const relationships = response.body.data.relationships;
      
      expect(relationships.users).toBeDefined();
      expect(relationships.users.type).toBe('hasMany');
      expect(relationships.users.model).toBe('User');
      
      expect(relationships.contacts).toBeDefined();
      expect(relationships.contacts.type).toBe('hasMany');
      expect(relationships.contacts.model).toBe('Contact');
      
      expect(relationships.devices).toBeDefined();
      expect(relationships.devices.type).toBe('hasMany');
      expect(relationships.devices.model).toBe('Device');
    });

    test('should include field validation rules', async () => {
      const response = await request(app)
        .get('/api/schema/tenant')
        .expect(200);

      const nameField = response.body.data.formFields.name;
      
      expect(nameField.required).toBe(true);
      expect(nameField.maxLength).toBe(100);
      expect(nameField.label).toBe('Name');
    });
  });

  describe('POST /api/schema/tenant/validate', () => {
    test('should validate valid tenant data', async () => {
      const response = await request(app)
        .post('/api/schema/tenant/validate')
        .send({
          name: 'Test Company',
          url: 'https://test.com',
          active: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(Object.keys(response.body.data.errors).length).toBe(0);
    });

    test('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/schema/tenant/validate')
        .send({
          url: 'https://test.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.name).toBeDefined();
    });

    test('should reject fields exceeding maxLength', async () => {
      const response = await request(app)
        .post('/api/schema/tenant/validate')
        .send({
          name: 'A'.repeat(101), // Exceeds maxLength of 100
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.name).toBeDefined();
    });
  });
});
