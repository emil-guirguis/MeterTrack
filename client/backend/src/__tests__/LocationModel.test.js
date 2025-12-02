/**
 * Location Model Tests
 * 
 * Tests verify that the Location model with schema definition works correctly
 */

const Location = require('../models/Location');

describe('Location Model with Schema', () => {
  describe('Schema Definition', () => {
    it('should have a valid schema', () => {
      const schema = Location.schema;
      
      expect(schema).toBeDefined();
      expect(schema.schema.entityName).toBe('Location');
      expect(schema.schema.tableName).toBe('location');
    });

    it('should have all required form fields', () => {
      const schema = Location.schema;
      const formFieldNames = schema.getFormFieldNames();
      
      expect(formFieldNames).toContain('name');
      expect(formFieldNames).toContain('street');
      expect(formFieldNames).toContain('street2');
      expect(formFieldNames).toContain('city');
      expect(formFieldNames).toContain('state');
      expect(formFieldNames).toContain('zip');
      expect(formFieldNames).toContain('country');
      expect(formFieldNames).toContain('type');
      expect(formFieldNames).toContain('status');
      expect(formFieldNames).toContain('squareFootage');
      expect(formFieldNames).toContain('notes');
      expect(formFieldNames).toContain('contactId');
      expect(formFieldNames).toContain('active');
    });

    it('should have all required entity fields', () => {
      const schema = Location.schema;
      const entityFieldNames = schema.getEntityFieldNames();
      
      expect(entityFieldNames).toContain('id');
      expect(entityFieldNames).toContain('createdAt');
      expect(entityFieldNames).toContain('updatedAt');
    });

    it('should have meters relationship', () => {
      const schema = Location.schema;
      const relationships = schema.schema.relationships;
      
      expect(relationships.meters).toBeDefined();
      expect(relationships.meters.type).toBe('hasMany');
      expect(relationships.meters.model).toBe('Meter');
      expect(relationships.meters.foreignKey).toBe('location_id');
    });
  });

  describe('Field Validation', () => {
    it('should require name field', () => {
      const schema = Location.schema;
      const result = schema.validate({
        street: '123 Main St',
        city: 'Springfield',
        // name is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should require street field', () => {
      const schema = Location.schema;
      const result = schema.validate({
        name: 'Main Office',
        city: 'Springfield',
        // street is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.street).toBeDefined();
    });

    it('should require city field', () => {
      const schema = Location.schema;
      const result = schema.validate({
        name: 'Main Office',
        street: '123 Main St',
        // city is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.city).toBeDefined();
    });

    it('should require state field', () => {
      const schema = Location.schema;
      const result = schema.validate({
        name: 'Main Office',
        street: '123 Main St',
        city: 'Springfield',
        // state is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.state).toBeDefined();
    });

    it('should require zip field', () => {
      const schema = Location.schema;
      const result = schema.validate({
        name: 'Main Office',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        // zip is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.zip).toBeDefined();
    });

    it('should require country field', () => {
      const schema = Location.schema;
      const result = schema.validate({
        name: 'Main Office',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        // country is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.country).toBeDefined();
    });

    it('should require type field', () => {
      const schema = Location.schema;
      const result = schema.validate({
        name: 'Main Office',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        // type is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.type).toBeDefined();
    });

    it('should validate complete location data', () => {
      const schema = Location.schema;
      const result = schema.validate({
        name: 'Main Office',
        street: '123 Main St',
        street2: 'Suite 100',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        type: 'office',
        status: 'active',
        squareFootage: 5000,
        notes: 'Test location',
        contactId: 1,
        active: true,
      });
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should enforce maxLength constraints', () => {
      const schema = Location.schema;
      const result = schema.validate({
        name: 'A'.repeat(201), // exceeds maxLength of 200
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        type: 'office',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });
  });

  describe('Auto-initialization', () => {
    it('should auto-initialize fields from data', () => {
      const data = {
        name: 'Main Office',
        street: '123 Main St',
        street2: 'Suite 100',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        type: 'office',
        status: 'active',
        square_footage: 5000,
        notes: 'Test location',
        contact_id: 1,
        active: true,
        id: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      const location = new Location(data);

      expect(location.name).toBe('Main Office');
      expect(location.street).toBe('123 Main St');
      expect(location.street2).toBe('Suite 100');
      expect(location.city).toBe('Springfield');
      expect(location.state).toBe('IL');
      expect(location.zip).toBe('62701');
      expect(location.country).toBe('USA');
      expect(location.type).toBe('office');
      expect(location.status).toBe('active');
      expect(location.squareFootage).toBe(5000);
      expect(location.notes).toBe('Test location');
      expect(location.contactId).toBe(1);
      expect(location.active).toBe(true);
      expect(location.id).toBe(1);
      expect(location.createdAt).toBe('2024-01-01');
      expect(location.updatedAt).toBe('2024-01-02');
    });

    it('should initialize with provided data', () => {
      const location = new Location({
        name: 'Main Office',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        type: 'office',
      });

      expect(location.name).toBe('Main Office');
      expect(location.street).toBe('123 Main St');
      expect(location.city).toBe('Springfield');
      expect(location.state).toBe('IL');
      expect(location.zip).toBe('62701');
      expect(location.country).toBe('USA');
      expect(location.type).toBe('office');
      // Other fields will be undefined if not provided
      expect(location.id).toBeUndefined();
    });
  });

  describe('Data Transformation', () => {
    it('should transform form data to database format', () => {
      const schema = Location.schema;
      const formData = {
        name: 'Main Office',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        type: 'office',
        squareFootage: 5000,
      };

      const dbData = schema.toDatabase(formData);

      expect(dbData.name).toBe('Main Office');
      expect(dbData.street).toBe('123 Main St');
      expect(dbData.city).toBe('Springfield');
      expect(dbData.state).toBe('IL');
      expect(dbData.zip).toBe('62701');
      expect(dbData.country).toBe('USA');
      expect(dbData.type).toBe('office');
      expect(dbData.square_footage).toBe(5000);
    });

    it('should transform database data to form format', () => {
      const schema = Location.schema;
      const dbData = {
        name: 'Main Office',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        type: 'office',
        square_footage: 5000,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      };

      const formData = schema.fromDatabase(dbData);

      expect(formData.name).toBe('Main Office');
      expect(formData.street).toBe('123 Main St');
      expect(formData.city).toBe('Springfield');
      expect(formData.state).toBe('IL');
      expect(formData.zip).toBe('62701');
      expect(formData.country).toBe('USA');
      expect(formData.type).toBe('office');
      expect(formData.squareFootage).toBe(5000);
    });
  });

  describe('Schema Serialization', () => {
    it('should serialize to JSON for API', () => {
      const schema = Location.schema;
      const json = schema.toJSON();

      expect(json.entityName).toBe('Location');
      expect(json.tableName).toBe('location');
      expect(json.formFields).toBeDefined();
      expect(json.entityFields).toBeDefined();
      expect(json.relationships).toBeDefined();
      
      // Verify no functions in JSON
      const jsonString = JSON.stringify(json);
      expect(jsonString).not.toContain('[Function');
      expect(jsonString).not.toContain('function(');
    });

    it('should include all field properties in JSON', () => {
      const schema = Location.schema;
      const json = schema.toJSON();

      const nameField = json.formFields.name;
      expect(nameField.type).toBe('string');
      expect(nameField.required).toBe(true);
      expect(nameField.label).toBe('Name');
      expect(nameField.maxLength).toBe(200);

      const streetField = json.formFields.street;
      expect(streetField.type).toBe('string');
      expect(streetField.required).toBe(true);
      expect(streetField.label).toBe('Street');
      expect(streetField.maxLength).toBe(200);
    });
  });
});
