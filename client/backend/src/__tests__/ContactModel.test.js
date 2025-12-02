/**
 * Contact Model Tests
 * 
 * Tests verify that the Contact model with schema definition works correctly
 */

const Contact = require('../models/Contact');

describe('Contact Model with Schema', () => {
  describe('Schema Definition', () => {
    it('should have a valid schema', () => {
      const schema = Contact.schema;
      
      expect(schema).toBeDefined();
      expect(schema.schema.entityName).toBe('Contact');
      expect(schema.schema.tableName).toBe('contact');
    });

    it('should have all required form fields', () => {
      const schema = Contact.schema;
      const formFieldNames = schema.getFormFieldNames();
      
      expect(formFieldNames).toContain('name');
      expect(formFieldNames).toContain('company');
      expect(formFieldNames).toContain('role');
      expect(formFieldNames).toContain('email');
      expect(formFieldNames).toContain('phone');
      expect(formFieldNames).toContain('street');
      expect(formFieldNames).toContain('street2');
      expect(formFieldNames).toContain('city');
      expect(formFieldNames).toContain('state');
      expect(formFieldNames).toContain('zip');
      expect(formFieldNames).toContain('country');
      expect(formFieldNames).toContain('active');
      expect(formFieldNames).toContain('notes');
    });

    it('should have all required entity fields', () => {
      const schema = Contact.schema;
      const entityFieldNames = schema.getEntityFieldNames();
      
      expect(entityFieldNames).toContain('id');
      expect(entityFieldNames).toContain('createdAt');
      expect(entityFieldNames).toContain('updatedAt');
      expect(entityFieldNames).toContain('tenantId');
    });

    it('should have tenant relationship', () => {
      const schema = Contact.schema;
      const relationships = schema.schema.relationships;
      
      expect(relationships.tenant).toBeDefined();
      expect(relationships.tenant.type).toBe('belongsTo');
      expect(relationships.tenant.model).toBe('Tenant');
      expect(relationships.tenant.foreignKey).toBe('tenant_id');
    });
  });

  describe('Field Validation', () => {
    it('should require name field', () => {
      const schema = Contact.schema;
      const result = schema.validate({
        email: 'test@example.com',
        // name is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should require email field', () => {
      const schema = Contact.schema;
      const result = schema.validate({
        name: 'John Doe',
        // email is missing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should validate complete contact data', () => {
      const schema = Contact.schema;
      const result = schema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        role: 'Manager',
        phone: '555-1234',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        active: true,
        notes: 'Test contact',
      });
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should enforce maxLength constraints', () => {
      const schema = Contact.schema;
      const result = schema.validate({
        name: 'A'.repeat(101), // exceeds maxLength of 100
        email: 'test@example.com',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });
  });

  describe('Auto-initialization', () => {
    it('should auto-initialize fields from data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        role: 'Manager',
        phone: '555-1234',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        active: true,
        notes: 'Test contact',
        id: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        tenant_id: 1,
      };

      const contact = new Contact(data);

      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
      expect(contact.company).toBe('Acme Corp');
      expect(contact.role).toBe('Manager');
      expect(contact.phone).toBe('555-1234');
      expect(contact.street).toBe('123 Main St');
      expect(contact.city).toBe('Springfield');
      expect(contact.state).toBe('IL');
      expect(contact.zip).toBe('62701');
      expect(contact.country).toBe('USA');
      expect(contact.active).toBe(true);
      expect(contact.notes).toBe('Test contact');
      expect(contact.id).toBe(1);
      expect(contact.createdAt).toBe('2024-01-01');
      expect(contact.updatedAt).toBe('2024-01-02');
      expect(contact.tenantId).toBe(1);
    });

    it('should initialize with provided data', () => {
      const contact = new Contact({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
      // Other fields will be undefined if not provided
      expect(contact.id).toBeUndefined();
    });
  });

  describe('Data Transformation', () => {
    it('should transform form data to database format', () => {
      const schema = Contact.schema;
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
      };

      const dbData = schema.toDatabase(formData);

      expect(dbData.name).toBe('John Doe');
      expect(dbData.email).toBe('john@example.com');
      expect(dbData.company).toBe('Acme Corp');
    });

    it('should transform database data to form format', () => {
      const schema = Contact.schema;
      const dbData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        tenant_id: 1,
      };

      const formData = schema.fromDatabase(dbData);

      expect(formData.name).toBe('John Doe');
      expect(formData.email).toBe('john@example.com');
      expect(formData.company).toBe('Acme Corp');
    });
  });

  describe('Schema Serialization', () => {
    it('should serialize to JSON for API', () => {
      const schema = Contact.schema;
      const json = schema.toJSON();

      expect(json.entityName).toBe('Contact');
      expect(json.tableName).toBe('contact');
      expect(json.formFields).toBeDefined();
      expect(json.entityFields).toBeDefined();
      expect(json.relationships).toBeDefined();
      
      // Verify no functions in JSON
      const jsonString = JSON.stringify(json);
      expect(jsonString).not.toContain('[Function');
      expect(jsonString).not.toContain('function(');
    });

    it('should include all field properties in JSON', () => {
      const schema = Contact.schema;
      const json = schema.toJSON();

      const nameField = json.formFields.name;
      expect(nameField.type).toBe('string');
      expect(nameField.required).toBe(true);
      expect(nameField.label).toBe('Name');
      expect(nameField.maxLength).toBe(100);

      const emailField = json.formFields.email;
      expect(emailField.type).toBe('string');
      expect(emailField.required).toBe(true);
      expect(emailField.label).toBe('Email');
      expect(emailField.maxLength).toBe(254);
    });
  });
});
