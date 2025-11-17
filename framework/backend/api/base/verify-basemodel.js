/**
 * Simple verification script for BaseModel
 * Tests basic functionality without requiring a test framework
 */

const BaseModel = require('./BaseModel');

console.log('🧪 Testing BaseModel Implementation...\n');

// Test 1: Create a valid model class
console.log('Test 1: Creating a valid model class');
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

try {
  const instance = new TestModel({ id: 1, name: 'Test User', email: 'test@example.com' });
  console.log('✅ Instance created successfully');
  console.log('   - id:', instance.id);
  console.log('   - name:', instance.name);
  console.log('   - email:', instance.email);
} catch (error) {
  console.log('❌ Failed to create instance:', error.message);
  process.exit(1);
}

// Test 2: Field extraction
console.log('\nTest 2: Field extraction');
try {
  const fields = TestModel._getFields();
  console.log('✅ Fields extracted successfully');
  console.log('   - Field count:', fields.length);
  console.log('   - Field names:', fields.map(f => f.name).join(', '));
  
  const idField = fields.find(f => f.name === 'id');
  if (idField && idField.isPrimaryKey) {
    console.log('✅ Primary key field identified correctly');
  } else {
    console.log('❌ Primary key field not identified');
    process.exit(1);
  }
  
  const timestampFields = fields.filter(f => f.isTimestamp);
  if (timestampFields.length === 2) {
    console.log('✅ Timestamp fields identified correctly');
  } else {
    console.log('❌ Timestamp fields not identified correctly');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Field extraction failed:', error.message);
  process.exit(1);
}

// Test 3: Field caching
console.log('\nTest 3: Field caching');
try {
  const fields1 = TestModel._getFields();
  const fields2 = TestModel._getFields();
  if (fields1 === fields2) {
    console.log('✅ Fields are cached correctly');
  } else {
    console.log('❌ Fields are not cached');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Field caching test failed:', error.message);
  process.exit(1);
}

// Test 4: Configuration getters
console.log('\nTest 4: Configuration getters');
try {
  if (TestModel.tableName === 'test_table') {
    console.log('✅ tableName getter works correctly');
  } else {
    console.log('❌ tableName getter failed');
    process.exit(1);
  }
  
  if (TestModel.primaryKey === 'id') {
    console.log('✅ primaryKey getter works correctly');
  } else {
    console.log('❌ primaryKey getter failed');
    process.exit(1);
  }
  
  if (typeof TestModel.relationships === 'object') {
    console.log('✅ relationships getter works correctly');
  } else {
    console.log('❌ relationships getter failed');
    process.exit(1);
  }
  
  if (TestModel.timestamps === true) {
    console.log('✅ timestamps getter works correctly');
  } else {
    console.log('❌ timestamps getter failed');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Configuration getter test failed:', error.message);
  process.exit(1);
}

// Test 5: Missing tableName validation
console.log('\nTest 5: Missing tableName validation');
class InvalidModel1 extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.id = data.id;
  }

  static get primaryKey() {
    return 'id';
  }
}

try {
  InvalidModel1._getFields();
  console.log('❌ Should have thrown error for missing tableName');
  process.exit(1);
} catch (error) {
  if (error.message.includes('tableName must be defined')) {
    console.log('✅ Missing tableName validation works correctly');
  } else {
    console.log('❌ Wrong error message:', error.message);
    process.exit(1);
  }
}

// Test 6: Missing primaryKey validation
console.log('\nTest 6: Missing primaryKey validation');
class InvalidModel2 extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.id = data.id;
  }

  static get tableName() {
    return 'invalid_table';
  }
}

try {
  InvalidModel2._getFields();
  console.log('❌ Should have thrown error for missing primaryKey');
  process.exit(1);
} catch (error) {
  if (error.message.includes('primaryKey must be defined')) {
    console.log('✅ Missing primaryKey validation works correctly');
  } else {
    console.log('❌ Wrong error message:', error.message);
    process.exit(1);
  }
}

// Test 7: Custom relationships
console.log('\nTest 7: Custom relationships');
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

try {
  const relationships = ModelWithRelationships.relationships;
  if (relationships.user && relationships.user.type === 'belongsTo') {
    console.log('✅ Custom relationships work correctly');
  } else {
    console.log('❌ Custom relationships failed');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Custom relationships test failed:', error.message);
  process.exit(1);
}

// Test 8: Custom timestamps setting
console.log('\nTest 8: Custom timestamps setting');
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

try {
  if (ModelWithoutTimestamps.timestamps === false) {
    console.log('✅ Custom timestamps setting works correctly');
  } else {
    console.log('❌ Custom timestamps setting failed');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Custom timestamps test failed:', error.message);
  process.exit(1);
}

console.log('\n✅ All tests passed! BaseModel implementation is working correctly.\n');
