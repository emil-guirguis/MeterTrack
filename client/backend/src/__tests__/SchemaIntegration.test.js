/**
 * Integration tests for Schema System
 * 
 * Tests that the schema system works correctly with actual models
 */

const { defineSchema, field, FieldTypes, RelationshipTypes, relationship } = require('../../../../framework/backend/api/base/SchemaDefinition');

describe('Schema System Integration', () => {
  describe('Model with Schema', () => {
    class TestModel {
      constructor(data = {}) {
        TestModel.schema.initializeFromData(this, data);
      }

      static get tableName() {
        return 'test_models';
      }

      static get schema() {
        return defineSchema({
          entityName: 'TestModel',
          tableName: 'test_models',
          description: 'Test model for integration testing',
          formFields: {
            name: field({
              type: FieldTypes.STRING,
              default: '',
              required: true,
              label: 'Name',
              maxLength: 100,
            }),
            email: field({
              type: FieldTypes.EMAIL,
              default: '',
              required: true,
              label: 'Email',
            }),
            age: field({
              type: FieldTypes.NUMBER,
              default: 0,
              min: 0,
              max: 150,
            }),
          },
          entityFields: {
            id: field({
              type: FieldTypes.STRING,
              default: null,
              readOnly: true,
            }),
            createdAt: field({
              type: FieldTypes.DATE,
              default: null,
              readOnly: true,
              dbField: 'created_at',
            }),
          },
          relationships: {
            profile: relationship({
              type: RelationshipTypes.HAS_ONE,
              model: 'Profile',
              foreignKey: 'user_id',
            }),
          },
        });
      }
    }

    it('should auto-initialize fields from schema', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        id: '123',
        created_at: '2023-01-01',
      };

      const model = new TestModel(data);

      expect(model.name).toBe('John Doe');
      expect(model.email).toBe('john@example.com');
      expect(model.age).toBe(30);
      expect(model.id).toBe('123');
      expect(model.createdAt).toBe('2023-01-01');
    });

    it('should provide schema via static getter', () => {
      const schema = TestModel.schema;

      expect(schema.schema.entityName).toBe('TestModel');
      expect(schema.schema.tableName).toBe('test_models');
      expect(schema.getFormFieldNames()).toEqual(['name', 'email', 'age']);
      expect(schema.getEntityFieldNames()).toEqual(['id', 'createdAt']);
    });

    it('should validate data using schema', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const result = TestModel.schema.validate(validData);
      expect(result.isValid).toBe(true);
    });

    it('should detect validation errors', () => {
      const invalidData = {
        // name is missing (required)
        email: 'john@example.com',
        age: 200, // exceeds max
      };

      const result = TestModel.schema.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.age).toBeDefined();
    });

    it('should transform data to database format', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const dbData = TestModel.schema.toDatabase(formData);
      expect(dbData.name).toBe('John Doe');
      expect(dbData.email).toBe('john@example.com');
      expect(dbData.age).toBe(30);
    });

    it('should transform data from database format', () => {
      const dbData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        id: '123',
        created_at: '2023-01-01',
      };

      const formData = TestModel.schema.fromDatabase(dbData);
      expect(formData.name).toBe('John Doe');
      expect(formData.email).toBe('john@example.com');
      expect(formData.age).toBe(30);
    });

    it('should serialize schema to JSON for API', () => {
      const json = TestModel.schema.toJSON();

      expect(json.entityName).toBe('TestModel');
      expect(json.tableName).toBe('test_models');
      expect(json.formFields.name).toBeDefined();
      expect(json.formFields.email).toBeDefined();
      expect(json.entityFields.id).toBeDefined();
      expect(json.relationships.profile).toBeDefined();
    });
  });

  describe('Schema with dbField mapping', () => {
    class MappedModel {
      constructor(data = {}) {
        MappedModel.schema.initializeFromData(this, data);
      }

      static get schema() {
        return defineSchema({
          entityName: 'MappedModel',
          tableName: 'mapped_models',
          formFields: {
            firstName: field({
              type: FieldTypes.STRING,
              default: '',
              dbField: 'first_name',
            }),
            lastName: field({
              type: FieldTypes.STRING,
              default: '',
              dbField: 'last_name',
            }),
            isActive: field({
              type: FieldTypes.BOOLEAN,
              default: true,
              dbField: 'is_active',
            }),
          },
          entityFields: {},
        });
      }
    }

    it('should handle snake_case to camelCase mapping', () => {
      const dbData = {
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
      };

      const model = new MappedModel(dbData);

      expect(model.firstName).toBe('John');
      expect(model.lastName).toBe('Doe');
      expect(model.isActive).toBe(true);
    });

    it('should transform camelCase to snake_case for database', () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
      };

      const dbData = MappedModel.schema.toDatabase(formData);

      expect(dbData.first_name).toBe('John');
      expect(dbData.last_name).toBe('Doe');
      expect(dbData.is_active).toBe(true);
      expect(dbData.firstName).toBeUndefined();
      expect(dbData.lastName).toBeUndefined();
    });
  });

  describe('Schema with relationships', () => {
    class ParentModel {
      static get schema() {
        return defineSchema({
          entityName: 'Parent',
          tableName: 'parents',
          formFields: {
            name: field({
              type: FieldTypes.STRING,
              default: '',
            }),
          },
          entityFields: {
            id: field({
              type: FieldTypes.STRING,
              default: null,
            }),
          },
          relationships: {
            children: relationship({
              type: RelationshipTypes.HAS_MANY,
              model: 'Child',
              foreignKey: 'parent_id',
            }),
            profile: relationship({
              type: RelationshipTypes.HAS_ONE,
              model: 'Profile',
              foreignKey: 'parent_id',
            }),
          },
        });
      }
    }

    class ChildModel {
      static get schema() {
        return defineSchema({
          entityName: 'Child',
          tableName: 'children',
          formFields: {
            name: field({
              type: FieldTypes.STRING,
              default: '',
            }),
          },
          entityFields: {
            id: field({
              type: FieldTypes.STRING,
              default: null,
            }),
          },
          relationships: {
            parent: relationship({
              type: RelationshipTypes.BELONGS_TO,
              model: 'Parent',
              foreignKey: 'parent_id',
              autoLoad: true,
            }),
          },
        });
      }
    }

    it('should define HAS_MANY relationship', () => {
      const schema = ParentModel.schema;
      const childrenRel = schema.schema.relationships.children;

      expect(childrenRel.type).toBe('hasMany');
      expect(childrenRel.model).toBe('Child');
      expect(childrenRel.foreignKey).toBe('parent_id');
    });

    it('should define BELONGS_TO relationship', () => {
      const schema = ChildModel.schema;
      const parentRel = schema.schema.relationships.parent;

      expect(parentRel.type).toBe('belongsTo');
      expect(parentRel.model).toBe('Parent');
      expect(parentRel.foreignKey).toBe('parent_id');
      expect(parentRel.autoLoad).toBe(true);
    });

    it('should define HAS_ONE relationship', () => {
      const schema = ParentModel.schema;
      const profileRel = schema.schema.relationships.profile;

      expect(profileRel.type).toBe('hasOne');
      expect(profileRel.model).toBe('Profile');
      expect(profileRel.foreignKey).toBe('parent_id');
    });
  });

  describe('Schema with custom validation', () => {
    class ValidatedModel {
      static get schema() {
        return defineSchema({
          entityName: 'ValidatedModel',
          tableName: 'validated_models',
          formFields: {
            password: field({
              type: FieldTypes.STRING,
              default: '',
              required: true,
              validate: (value) => {
                if (value.length < 8) return 'Password must be at least 8 characters';
                if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
                if (!/[0-9]/.test(value)) return 'Password must contain number';
                return null;
              },
            }),
            confirmPassword: field({
              type: FieldTypes.STRING,
              default: '',
              required: true,
            }),
          },
          entityFields: {},
        });
      }
    }

    it('should apply custom validation rules', () => {
      const result1 = ValidatedModel.schema.validate({ password: 'short', confirmPassword: 'short' });
      expect(result1.isValid).toBe(false);
      expect(result1.errors.password).toBe('Password must be at least 8 characters');

      const result2 = ValidatedModel.schema.validate({ password: 'lowercase123', confirmPassword: 'lowercase123' });
      expect(result2.isValid).toBe(false);
      expect(result2.errors.password).toBe('Password must contain uppercase letter');

      const result3 = ValidatedModel.schema.validate({ password: 'NoNumbers', confirmPassword: 'NoNumbers' });
      expect(result3.isValid).toBe(false);
      expect(result3.errors.password).toBe('Password must contain number');

      const result4 = ValidatedModel.schema.validate({ password: 'ValidPass123', confirmPassword: 'ValidPass123' });
      expect(result4.isValid).toBe(true);
    });
  });

  describe('Schema with transformations', () => {
    class TransformedModel {
      static get schema() {
        return defineSchema({
          entityName: 'TransformedModel',
          tableName: 'transformed_models',
          formFields: {
            name: field({
              type: FieldTypes.STRING,
              default: '',
              toApi: (value) => value.trim().toUpperCase(),
              fromApi: (value) => value.toLowerCase(),
            }),
            tags: field({
              type: FieldTypes.ARRAY,
              default: [],
              toApi: (value) => JSON.stringify(value),
              fromApi: (value) => JSON.parse(value),
            }),
          },
          entityFields: {},
        });
      }
    }

    it('should apply toApi transformation', () => {
      const formData = {
        name: '  john doe  ',
        tags: ['tag1', 'tag2'],
      };

      const dbData = TransformedModel.schema.toDatabase(formData);
      expect(dbData.name).toBe('JOHN DOE');
      expect(dbData.tags).toBe('["tag1","tag2"]');
    });

    it('should apply fromApi transformation', () => {
      const dbData = {
        name: 'JOHN DOE',
        tags: '["tag1","tag2"]',
      };

      const formData = TransformedModel.schema.fromDatabase(dbData);
      expect(formData.name).toBe('john doe');
      expect(formData.tags).toEqual(['tag1', 'tag2']);
    });
  });
});
