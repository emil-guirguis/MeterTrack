/**
 * BaseModel Tests
 * 
 * Tests for the BaseModel class focusing on:
 * - Constructor initialization
 * - Field extraction and caching
 * - Configuration validation
 * - Static getter methods
 */

const BaseModel = require('./BaseModel');

describe('BaseModel', () => {
  // Test model class for testing
  class TestModel extends BaseModel {
    constructor(data = {}) {
      super(data);
      this.id = data.id;
      this.name = data.name;
      this.email = data.email;
      this.created_at = data.created_at;
      this.updated_at = data.updated_at;
    }

    static get tableName() {
      return 'test_table';
    }

    static get primaryKey() {
      return 'id';
    }
  }

  describe('Constructor', () => {
    it('should initialize instance with data', () => {
      const data = { id: 1, name: 'Test', email: 'test@example.com' };
      const instance = new TestModel(data);
      
      expect(instance.id).toBe(1);
      expect(instance.name).toBe('Test');
      expect(instance.email).toBe('test@example.com');
    });

    it('should initialize with empty data', () => {
      const instance = new TestModel();
      
      expect(instance.id).toBeUndefined();
      expect(instance.name).toBeUndefined();
    });
  });

  describe('_getFields()', () => {
    it('should extract fields from constructor', () => {
      const fields = TestModel._getFields();
      
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
      
      const fieldNames = fields.map(f => f.name);
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
    });

    it('should cache extracted fields', () => {
      const fields1 = TestModel._getFields();
      const fields2 = TestModel._getFields();
      
      expect(fields1).toBe(fields2); // Same reference
    });

    it('should identify primary key field', () => {
      const fields = TestModel._getFields();
      const idField = fields.find(f => f.name === 'id');
      
      expect(idField).toBeDefined();
      expect(idField.isPrimaryKey).toBe(true);
    });

    it('should identify timestamp fields', () => {
      const fields = TestModel._getFields();
      const createdAtField = fields.find(f => f.name === 'created_at');
      const updatedAtField = fields.find(f => f.name === 'updated_at');
      
      expect(createdAtField).toBeDefined();
      expect(createdAtField.isTimestamp).toBe(true);
      expect(updatedAtField).toBeDefined();
      expect(updatedAtField.isTimestamp).toBe(true);
    });
  });

  describe('Configuration Getters', () => {
    it('should return tableName from child class', () => {
      expect(TestModel.tableName).toBe('test_table');
    });

    it('should return primaryKey from child class', () => {
      expect(TestModel.primaryKey).toBe('id');
    });

    it('should return default relationships', () => {
      expect(TestModel.relationships).toEqual({});
    });

    it('should return default timestamps setting', () => {
      expect(TestModel.timestamps).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error if tableName is not defined', () => {
      class InvalidModel extends BaseModel {
        constructor(data = {}) {
          super(data);
          this.id = data.id;
        }

        static get primaryKey() {
          return 'id';
        }
      }

      expect(() => {
        InvalidModel._getFields();
      }).toThrow(/tableName must be defined/);
    });

    it('should throw error if primaryKey is not defined', () => {
      class InvalidModel extends BaseModel {
        constructor(data = {}) {
          super(data);
          this.id = data.id;
        }

        static get tableName() {
          return 'invalid_table';
        }
      }

      expect(() => {
        InvalidModel._getFields();
      }).toThrow(/primaryKey must be defined/);
    });

    it('should throw error when accessing BaseModel.tableName directly', () => {
      expect(() => {
        BaseModel.tableName;
      }).toThrow(/tableName must be defined/);
    });

    it('should throw error when accessing BaseModel.primaryKey directly', () => {
      expect(() => {
        BaseModel.primaryKey;
      }).toThrow(/primaryKey must be defined/);
    });
  });

  describe('Custom Relationships', () => {
    it('should allow child class to define relationships', () => {
      class ModelWithRelationships extends BaseModel {
        constructor(data = {}) {
          super(data);
          this.id = data.id;
          this.user_id = data.user_id;
        }

        static get tableName() {
          return 'posts';
        }

        static get primaryKey() {
          return 'id';
        }

        static get relationships() {
          return {
            user: {
              type: 'belongsTo',
              model: 'User',
              foreignKey: 'user_id',
              targetKey: 'id'
            }
          };
        }
      }

      expect(ModelWithRelationships.relationships).toHaveProperty('user');
      expect(ModelWithRelationships.relationships.user.type).toBe('belongsTo');
    });
  });

  describe('Timestamps Configuration', () => {
    it('should allow child class to disable timestamps', () => {
      class ModelWithoutTimestamps extends BaseModel {
        constructor(data = {}) {
          super(data);
          this.id = data.id;
        }

        static get tableName() {
          return 'simple_table';
        }

        static get primaryKey() {
          return 'id';
        }

        static get timestamps() {
          return false;
        }
      }

      expect(ModelWithoutTimestamps.timestamps).toBe(false);
    });
  });
});
