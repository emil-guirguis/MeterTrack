/**
 * Verification script for BaseModel CRUD methods
 * Tests the static CRUD methods implementation
 */

const BaseModel = require('./BaseModel');

console.log('🧪 Testing BaseModel CRUD Methods Implementation...\n');

// Test model class
class TestModel extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.status = data.status;
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

// Test 1: Check that CRUD methods exist
console.log('Test 1: Checking CRUD method existence');
try {
  const methods = ['create', 'findById', 'findOne', 'findAll', 'count', 'exists'];
  const missingMethods = [];
  
  for (const method of methods) {
    if (typeof TestModel[method] !== 'function') {
      missingMethods.push(method);
    }
  }
  
  if (missingMethods.length === 0) {
    console.log('✅ All CRUD methods exist');
    console.log('   - Methods:', methods.join(', '));
  } else {
    console.log('❌ Missing methods:', missingMethods.join(', '));
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Method existence check failed:', error.message);
  process.exit(1);
}

// Test 2: Check _getDb method
console.log('\nTest 2: Checking database connection method');
try {
  if (typeof TestModel._getDb === 'function') {
    console.log('✅ _getDb method exists');
  } else {
    console.log('❌ _getDb method not found');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Database connection method check failed:', error.message);
  process.exit(1);
}

// Test 3: Check _mapResultToInstance method
console.log('\nTest 3: Checking result mapping method');
try {
  if (typeof TestModel._mapResultToInstance === 'function') {
    console.log('✅ _mapResultToInstance method exists');
    
    // Test mapping
    const testRow = { id: 1, name: 'Test', email: 'test@example.com' };
    const instance = TestModel._mapResultToInstance(testRow);
    
    if (instance instanceof TestModel && instance.id === 1) {
      console.log('✅ Result mapping works correctly');
    } else {
      console.log('❌ Result mapping failed');
      process.exit(1);
    }
    
    // Test null handling
    const nullResult = TestModel._mapResultToInstance(null);
    if (nullResult === null) {
      console.log('✅ Null result handling works correctly');
    } else {
      console.log('❌ Null result handling failed');
      process.exit(1);
    }
  } else {
    console.log('❌ _mapResultToInstance method not found');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Result mapping method check failed:', error.message);
  process.exit(1);
}

// Test 4: Check _handleDatabaseError method
console.log('\nTest 4: Checking error handling method');
try {
  if (typeof TestModel._handleDatabaseError === 'function') {
    console.log('✅ _handleDatabaseError method exists');
    
    // Test unique constraint error
    const uniqueError = new Error('duplicate key value violates unique constraint "test_email_key"\nKey (email)=(test@example.com) already exists.');
    uniqueError.code = '23505';
    
    try {
      TestModel._handleDatabaseError(uniqueError, 'create');
      console.log('❌ Should have thrown error for unique constraint');
      process.exit(1);
    } catch (error) {
      if (error.message.includes('Unique constraint violation')) {
        console.log('✅ Unique constraint error handling works');
      } else {
        console.log('❌ Wrong error message:', error.message);
        process.exit(1);
      }
    }
    
    // Test foreign key error
    const fkError = new Error('insert or update on table "test_table" violates foreign key constraint "test_user_id_fkey"\nKey (user_id)=(999) is not present in table "users".');
    fkError.code = '23503';
    
    try {
      TestModel._handleDatabaseError(fkError, 'create');
      console.log('❌ Should have thrown error for foreign key constraint');
      process.exit(1);
    } catch (error) {
      if (error.message.includes('Foreign key constraint violation')) {
        console.log('✅ Foreign key error handling works');
      } else {
        console.log('❌ Wrong error message:', error.message);
        process.exit(1);
      }
    }
    
    // Test not null error
    const notNullError = new Error('null value in column "name" violates not-null constraint');
    notNullError.code = '23502';
    
    try {
      TestModel._handleDatabaseError(notNullError, 'create');
      console.log('❌ Should have thrown error for not null constraint');
      process.exit(1);
    } catch (error) {
      if (error.message.includes('Not null constraint violation')) {
        console.log('✅ Not null error handling works');
      } else {
        console.log('❌ Wrong error message:', error.message);
        process.exit(1);
      }
    }
  } else {
    console.log('❌ _handleDatabaseError method not found');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error handling method check failed:', error.message);
  process.exit(1);
}

// Test 5: Verify method signatures (check they are async)
console.log('\nTest 5: Verifying methods are async');
try {
  const asyncMethods = ['create', 'findById', 'findOne', 'findAll', 'count', 'exists'];
  
  for (const method of asyncMethods) {
    const isAsync = TestModel[method].constructor.name === 'AsyncFunction';
    if (isAsync) {
      console.log(`✅ ${method}() is async`);
    } else {
      console.log(`❌ ${method}() is not async`);
      process.exit(1);
    }
  }
} catch (error) {
  console.log('❌ Method async verification failed:', error.message);
  process.exit(1);
}

console.log('\n✅ All CRUD method tests passed! Implementation is correct.\n');
console.log('ℹ️  Note: These tests verify method existence and structure.');
console.log('ℹ️  Database integration tests require a running PostgreSQL instance.\n');
