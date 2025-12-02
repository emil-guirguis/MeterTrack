/**
 * Tests for SchemaDefinition.js
 * 
 * Validates:
 * - Requirements 1.1-1.10: Backend Schema Definition System
 * - Requirements 2.1-2.10: Relationship Definition System
 */

const {
  FieldTypes,
  RelationshipTypes,
  field,
  relationship,
  defineSchema,
} = require('../../../../framework/backend/api/base/SchemaDefinition');

describe('SchemaDefinition', () => {
  describe('FieldTypes', () => {
    it('should define all required field types', () => {
      // Requirement 1.4: Support field types
      expect(FieldTypes.STRING).toBe('string');
      expect(FieldTypes.NUMBER).toBe('number');
      expect(FieldTypes.BOOLEAN).toBe('boolean');
      expect(FieldTypes.DATE).toBe('date');
      expect(FieldTypes.EMAIL).toBe('email');
      expect(FieldTypes.PHONE).toBe('phone');
      expect(FieldTypes.URL).toBe('url');
      expect(FieldTypes.OBJECT).toBe('object');
      expect(FieldTypes.ARRAY).toBe('array');
    });
  });

  describe('RelationshipTypes', () => {
    it('should define all required relationship types', () => {
      // Requirements 2.2-2.5: Support relationship types
      expect(RelationshipTypes.BELONGS_TO).toBe('belongsTo');
      expect(RelationshipTypes.HAS_MANY).toBe('hasMany');
      expect(RelationshipTypes.HAS_ONE).toBe('hasOne');
      expect(RelationshipTypes.MANY_TO_MANY).toBe('manyToMany');
    });
  });

  describe('field()', () => {
    it('should create field with all properties', () => {
      // Requirement 1.5: Support field validation rules
      const fieldDef = field({
        type: FieldTypes.STRING,
        default: '',
        required: true,
        readOnly: false,
        label: 'Test Field',
        description: 'A test field',
        placeholder: 'Enter value',
        dbField: 'test_field',
        enumValues: ['option1', 'option2'],
        minLength: 5,
        maxLength: 100,
        pattern: '^[A-Z]',
      });

      expect(fieldDef.type).toBe('string');
      expect(fieldDef.default).toBe('');
      expect(fieldDef.required).toBe(true);
      expect(fieldDef.readOnly).toBe(false);
      expect(fieldDef.label).toBe('Test Field');
      expect(fieldDef.description).toBe('A test field');
      expect(fieldDef.placeholder).toBe('Enter value');
      expect(fieldDef.dbField).toBe('test_field');
      expect(fieldDef.enumValues).toEqual(['option1', 'option2']);
      expect(fieldDef.minLength).toBe(5);
      expect(fieldDef.maxLength).toBe(100);
      expect(fieldDef.pattern).toBe('^[A-Z]');
    });

    it('should create field with minimal properties', () => {
      const fieldDef = field({
        type: FieldTypes.NUMBER,
        default: 0,
      });

      expect(fieldDef.type).toBe('number');
      expect(fieldDef.default).toBe(0);
      expect(fieldDef.required).toBe(false);
      expect(fieldDef.readOnly).toBe(false);
      expect(fieldDef.label).toBe('');
      expect(fieldDef.dbField).toBe(null);
    });

    it('should support custom validation function', () => {
      // Requirement 1.5: Support validation rules
      const validateFn = (value) => value > 0 ? null : 'Must be positive';
      const fieldDef = field({
        type: FieldTypes.NUMBER,
        default: 0,
        validate: validateFn,
      });

      expect(fieldDef.validate).toBe(validateFn);
    });

    it('should support transformation functions', () => {
      const toApiFn = (value) => value.toUpperCase();
      const fromApiFn = (value) => value.toLowerCase();
      
      const fieldDef = field({
        type: FieldTypes.STRING,
        default: '',
        toApi: toApiFn,
        fromApi: fromApiFn,
      });

      expect(fieldDef.toApi).toBe(toApiFn);
      expect(fieldDef.fromApi).toBe(fromApiFn);
    });

    it('should support number validation rules', () => {
      // Requirement 1.5: Support min/max validation
      const fieldDef = field({
        type: FieldTypes.NUMBER,
        default: 0,
        min: 0,
        max: 100,
      });

      expect(fieldDef.min).toBe(0);
      expect(fieldDef.max).toBe(100);
    });
  });

  describe('relationship()', () => {
    it('should create BELONGS_TO relationship', () => {
      // Requirement 2.2: Support BELONGS_TO type
      const rel = relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Location',
        foreignKey: 'location_id',
      });

      expect(rel.type).toBe('belongsTo');
      expect(rel.model).toBe('Location');
      expect(rel.foreignKey).toBe('location_id');
      expect(rel.targetKey).toBe('id');
      expect(rel.autoLoad).toBe(false);
    });

    it('should create HAS_MANY relationship', () => {
      // Requirement 2.3: Support HAS_MANY type
      const rel = relationship({
        type: RelationshipTypes.HAS_MANY,
        model: 'Meter',
        foreignKey: 'location_id',
      });

      expect(rel.type).toBe('hasMany');
      expect(rel.model).toBe('Meter');
      expect(rel.foreignKey).toBe('location_id');
    });

    it('should create HAS_ONE relationship', () => {
      // Requirement 2.4: Support HAS_ONE type
      const rel = relationship({
        type: RelationshipTypes.HAS_ONE,
        model: 'Profile',
        foreignKey: 'user_id',
      });

      expect(rel.type).toBe('hasOne');
      expect(rel.model).toBe('Profile');
      expect(rel.foreignKey).toBe('user_id');
    });

    it('should create MANY_TO_MANY relationship', () => {
      // Requirement 2.5: Support MANY_TO_MANY type
      const rel = relationship({
        type: RelationshipTypes.MANY_TO_MANY,
        model: 'Tag',
        foreignKey: 'meter_id',
        through: 'meter_tags',
      });

      expect(rel.type).toBe('manyToMany');
      expect(rel.model).toBe('Tag');
      expect(rel.through).toBe('meter_tags');
    });

    it('should support auto-loading', () => {
      // Requirement 2.8: Support auto-loading
      const rel = relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Location',
        foreignKey: 'location_id',
        autoLoad: true,
      });

      expect(rel.autoLoad).toBe(true);
    });

    it('should support selective field loading', () => {
      // Requirement 2.9: Support selecting specific fields
      const rel = relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Location',
        foreignKey: 'location_id',
        select: ['id', 'name', 'address'],
      });

      expect(rel.select).toEqual(['id', 'name', 'address']);
    });

    it('should support relationship aliasing', () => {
      // Requirement 2.10: Support aliasing
      const rel = relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Location',
        foreignKey: 'location_id',
        as: 'primaryLocation',
      });

      expect(rel.as).toBe('primaryLocation');
    });

    it('should support custom target key', () => {
      const rel = relationship({
        type: RelationshipTypes.BELONGS_TO,
        model: 'Location',
        foreignKey: 'location_code',
        targetKey: 'code',
      });

      expect(rel.targetKey).toBe('code');
    });
  });

  describe('defineSchema()', () => {
    let testSchema;

    beforeEach(() => {
      // Requirement 1.1: Support static schema getter
      testSchema = defineSchema({
        entityName: 'TestEntity',
        tableName: 'test_entities',
        description: 'A test entity',
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
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
          }),
          age: field({
            type: FieldTypes.NUMBER,
            default: 0,
            min: 0,
            max: 150,
          }),
          status: field({
            type: FieldTypes.STRING,
            default: 'active',
            enumValues: ['active', 'inactive', 'pending'],
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
          location: relationship({
            type: RelationshipTypes.BELONGS_TO,
            model: 'Location',
            foreignKey: 'location_id',
          }),
        },
      });
    });

    it('should create schema with all properties', () => {
      expect(testSchema.schema.entityName).toBe('TestEntity');
      expect(testSchema.schema.tableName).toBe('test_entities');
      expect(testSchema.schema.description).toBe('A test entity');
      expect(testSchema.schema.formFields).toBeDefined();
      expect(testSchema.schema.entityFields).toBeDefined();
      expect(testSchema.schema.relationships).toBeDefined();
      expect(testSchema.schema.version).toBe('1.0.0');
      expect(testSchema.schema.generatedAt).toBeDefined();
    });

    it('should support formFields and entityFields', () => {
      // Requirements 1.2, 1.3: Support formFields and entityFields
      expect(Object.keys(testSchema.schema.formFields)).toEqual(['name', 'email', 'age', 'status']);
      expect(Object.keys(testSchema.schema.entityFields)).toEqual(['id', 'createdAt']);
    });

    describe('toJSON()', () => {
      it('should serialize schema to JSON', () => {
        // Requirement 1.10: Entity-level validation rules
        const json = testSchema.toJSON();
        
        expect(json.entityName).toBe('TestEntity');
        expect(json.formFields.name).toBeDefined();
        expect(json.entityFields.id).toBeDefined();
        expect(json.relationships.location).toBeDefined();
      });

      it('should exclude functions from JSON', () => {
        const schemaWithFunctions = defineSchema({
          entityName: 'Test',
          tableName: 'test',
          formFields: {
            name: field({
              type: FieldTypes.STRING,
              default: '',
              validate: (value) => value ? null : 'Required',
            }),
          },
        });

        const json = schemaWithFunctions.toJSON();
        expect(json.formFields.name.validate).toBeUndefined();
      });
    });

    describe('getAllFieldNames()', () => {
      it('should return all field names', () => {
        const allFields = testSchema.getAllFieldNames();
        expect(allFields).toContain('name');
        expect(allFields).toContain('email');
        expect(allFields).toContain('age');
        expect(allFields).toContain('status');
        expect(allFields).toContain('id');
        expect(allFields).toContain('createdAt');
        expect(allFields).toHaveLength(6);
      });
    });

    describe('getFormFieldNames()', () => {
      it('should return only form field names', () => {
        const formFields = testSchema.getFormFieldNames();
        expect(formFields).toEqual(['name', 'email', 'age', 'status']);
      });
    });

    describe('getEntityFieldNames()', () => {
      it('should return only entity field names', () => {
        const entityFields = testSchema.getEntityFieldNames();
        expect(entityFields).toEqual(['id', 'createdAt']);
      });
    });

    describe('isFormField()', () => {
      it('should identify form fields', () => {
        expect(testSchema.isFormField('name')).toBe(true);
        expect(testSchema.isFormField('email')).toBe(true);
        expect(testSchema.isFormField('id')).toBe(false);
        expect(testSchema.isFormField('nonexistent')).toBe(false);
      });
    });

    describe('isEntityField()', () => {
      it('should identify entity fields', () => {
        expect(testSchema.isEntityField('id')).toBe(true);
        expect(testSchema.isEntityField('createdAt')).toBe(true);
        expect(testSchema.isEntityField('name')).toBe(false);
        expect(testSchema.isEntityField('nonexistent')).toBe(false);
      });
    });

    describe('getField()', () => {
      it('should get field definition', () => {
        const nameField = testSchema.getField('name');
        expect(nameField).toBeDefined();
        expect(nameField.type).toBe('string');
        expect(nameField.required).toBe(true);
      });

      it('should return null for nonexistent field', () => {
        const field = testSchema.getField('nonexistent');
        expect(field).toBeNull();
      });
    });

    describe('validate()', () => {
      it('should validate valid data', () => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          status: 'active',
        };

        const result = testSchema.validate(data);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should detect required field violations', () => {
        const data = {
          age: 30,
          status: 'active',
        };

        const result = testSchema.validate(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeDefined();
        expect(result.errors.email).toBeDefined();
      });

      it('should validate string length', () => {
        const data = {
          name: 'a'.repeat(101), // Exceeds maxLength of 100
          email: 'john@example.com',
        };

        const result = testSchema.validate(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toContain('at most 100 characters');
      });

      it('should validate number range', () => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 200, // Exceeds max of 150
        };

        const result = testSchema.validate(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.age).toContain('at most 150');
      });

      it('should validate enum values', () => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          status: 'invalid_status',
        };

        const result = testSchema.validate(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.status).toContain('must be one of');
      });

      it('should validate pattern', () => {
        const data = {
          name: 'John Doe',
          email: 'invalid-email',
        };

        const result = testSchema.validate(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toContain('format is invalid');
      });

      it('should skip validation for empty optional fields', () => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          // age is optional and not provided
        };

        const result = testSchema.validate(data);
        expect(result.isValid).toBe(true);
      });

      it('should validate custom validation function', () => {
        const schemaWithCustomValidation = defineSchema({
          entityName: 'Test',
          tableName: 'test',
          formFields: {
            password: field({
              type: FieldTypes.STRING,
              default: '',
              validate: (value) => {
                if (value.length < 8) return 'Password must be at least 8 characters';
                if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
                return null;
              },
            }),
          },
        });

        const result1 = schemaWithCustomValidation.validate({ password: 'short' });
        expect(result1.isValid).toBe(false);
        expect(result1.errors.password).toBe('Password must be at least 8 characters');

        const result2 = schemaWithCustomValidation.validate({ password: 'lowercase123' });
        expect(result2.isValid).toBe(false);
        expect(result2.errors.password).toBe('Password must contain uppercase letter');

        const result3 = schemaWithCustomValidation.validate({ password: 'ValidPass123' });
        expect(result3.isValid).toBe(true);
      });
    });

    describe('toDatabase()', () => {
      it('should transform form data to database format', () => {
        // Requirement 1.6: Support database field mapping
        const formData = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        };

        const dbData = testSchema.toDatabase(formData);
        expect(dbData.name).toBe('John Doe');
        expect(dbData.email).toBe('john@example.com');
        expect(dbData.age).toBe(30);
      });

      it('should map dbField names', () => {
        const schemaWithDbFields = defineSchema({
          entityName: 'Test',
          tableName: 'test',
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
          },
        });

        const formData = {
          firstName: 'John',
          lastName: 'Doe',
        };

        const dbData = schemaWithDbFields.toDatabase(formData);
        expect(dbData.first_name).toBe('John');
        expect(dbData.last_name).toBe('Doe');
        expect(dbData.firstName).toBeUndefined();
        expect(dbData.lastName).toBeUndefined();
      });

      it('should apply toApi transformation', () => {
        const schemaWithTransform = defineSchema({
          entityName: 'Test',
          tableName: 'test',
          formFields: {
            name: field({
              type: FieldTypes.STRING,
              default: '',
              toApi: (value) => value.toUpperCase(),
            }),
          },
        });

        const formData = { name: 'john doe' };
        const dbData = schemaWithTransform.toDatabase(formData);
        expect(dbData.name).toBe('JOHN DOE');
      });
    });

    describe('fromDatabase()', () => {
      it('should transform database data to form format', () => {
        const dbData = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        };

        const formData = testSchema.fromDatabase(dbData);
        expect(formData.name).toBe('John Doe');
        expect(formData.email).toBe('john@example.com');
        expect(formData.age).toBe(30);
      });

      it('should map dbField names back', () => {
        const schemaWithDbFields = defineSchema({
          entityName: 'Test',
          tableName: 'test',
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
          },
        });

        const dbData = {
          first_name: 'John',
          last_name: 'Doe',
        };

        const formData = schemaWithDbFields.fromDatabase(dbData);
        expect(formData.firstName).toBe('John');
        expect(formData.lastName).toBe('Doe');
      });

      it('should apply fromApi transformation', () => {
        const schemaWithTransform = defineSchema({
          entityName: 'Test',
          tableName: 'test',
          formFields: {
            name: field({
              type: FieldTypes.STRING,
              default: '',
              fromApi: (value) => value.toLowerCase(),
            }),
          },
        });

        const dbData = { name: 'JOHN DOE' };
        const formData = schemaWithTransform.fromDatabase(dbData);
        expect(formData.name).toBe('john doe');
      });

      it('should use default values for missing fields', () => {
        const dbData = {
          name: 'John Doe',
          // email is missing
        };

        const formData = testSchema.fromDatabase(dbData);
        expect(formData.name).toBe('John Doe');
        expect(formData.email).toBe(''); // default value
      });
    });

    describe('initializeFromData()', () => {
      it('should initialize model instance from data', () => {
        // Requirement 1.9: Auto-initialization
        const instance = {};
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          id: '123',
          created_at: '2023-01-01',
        };

        testSchema.initializeFromData(instance, data);

        expect(instance.name).toBe('John Doe');
        expect(instance.email).toBe('john@example.com');
        expect(instance.age).toBe(30);
        expect(instance.id).toBe('123');
        expect(instance.createdAt).toBe('2023-01-01');
      });

      it('should handle dbField mapping during initialization', () => {
        const instance = {};
        const data = {
          name: 'John Doe',
          created_at: '2023-01-01', // dbField name
        };

        testSchema.initializeFromData(instance, data);

        expect(instance.createdAt).toBe('2023-01-01');
      });

      it('should handle both camelCase and snake_case field names', () => {
        const instance = {};
        const data = {
          name: 'John Doe',
          createdAt: '2023-01-01', // camelCase
        };

        testSchema.initializeFromData(instance, data);

        expect(instance.createdAt).toBe('2023-01-01');
      });
    });
  });

  describe('Integration: Complete Schema Example', () => {
    it('should support a complete entity schema with all features', () => {
      // This test validates that all requirements work together
      const meterSchema = defineSchema({
        entityName: 'Meter',
        tableName: 'meters',
        description: 'Utility meter entity',
        formFields: {
          name: field({
            type: FieldTypes.STRING,
            default: '',
            required: true,
            label: 'Meter Name',
            maxLength: 100,
          }),
          serialNumber: field({
            type: FieldTypes.STRING,
            default: '',
            required: true,
            label: 'Serial Number',
            dbField: 'serial_number',
          }),
          meterType: field({
            type: FieldTypes.STRING,
            default: 'electric',
            label: 'Meter Type',
            enumValues: ['electric', 'water', 'gas'],
            dbField: 'meter_type',
          }),
          isActive: field({
            type: FieldTypes.BOOLEAN,
            default: true,
            label: 'Active',
            dbField: 'is_active',
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
          location: relationship({
            type: RelationshipTypes.BELONGS_TO,
            model: 'Location',
            foreignKey: 'location_id',
            autoLoad: true,
          }),
          readings: relationship({
            type: RelationshipTypes.HAS_MANY,
            model: 'MeterReading',
            foreignKey: 'meter_id',
          }),
        },
      });

      // Validate schema structure
      expect(meterSchema.schema.entityName).toBe('Meter');
      expect(meterSchema.schema.tableName).toBe('meters');
      
      // Validate fields
      expect(meterSchema.getFormFieldNames()).toHaveLength(4);
      expect(meterSchema.getEntityFieldNames()).toHaveLength(2);
      
      // Validate relationships
      expect(meterSchema.schema.relationships.location).toBeDefined();
      expect(meterSchema.schema.relationships.readings).toBeDefined();
      
      // Test validation
      const validData = {
        name: 'Main Meter',
        serialNumber: 'SN-12345',
        meterType: 'electric',
        isActive: true,
      };
      const validationResult = meterSchema.validate(validData);
      expect(validationResult.isValid).toBe(true);
      
      // Test database transformation
      const dbData = meterSchema.toDatabase(validData);
      expect(dbData.serial_number).toBe('SN-12345');
      expect(dbData.meter_type).toBe('electric');
      expect(dbData.is_active).toBe(true);
      
      // Test JSON serialization
      const json = meterSchema.toJSON();
      expect(json.entityName).toBe('Meter');
      expect(json.formFields.name).toBeDefined();
    });
  });
});
