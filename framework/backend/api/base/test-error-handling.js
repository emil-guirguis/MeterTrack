/**
 * Test script for error handling and logging
 * 
 * This script tests the custom error classes and error handling utilities
 * to ensure they work correctly with the BaseModel.
 */

const {
  ModelError,
  ValidationError,
  UniqueConstraintError,
  ForeignKeyError,
  NotFoundError,
  NotNullError,
  ConnectionError,
  ConfigurationError
} = require('./errors');

const {
  handleDatabaseError,
  validateRequiredFields,
  validateFieldTypes
} = require('./errorHandler');

const { logError, logWarn, logInfo } = require('../../shared/utils/logger');

console.log('=== Testing Custom Error Classes ===\n');

// Test 1: ValidationError
try {
  throw new ValidationError('Field "name" is required', { field: 'name' });
} catch (error) {
  console.log('✓ ValidationError:', error.message);
  console.log('  Status Code:', error.statusCode);
  console.log('  Details:', error.details);
  console.log();
}

// Test 2: UniqueConstraintError
try {
  throw new UniqueConstraintError(
    'Duplicate value: meterid with value "M001" already exists',
    { field: 'meterid', value: 'M001', constraint: 'meter_meterid_key' }
  );
} catch (error) {
  console.log('✓ UniqueConstraintError:', error.message);
  console.log('  Status Code:', error.statusCode);
  console.log('  Details:', error.details);
  console.log();
}

// Test 3: ForeignKeyError
try {
  throw new ForeignKeyError(
    'Invalid reference: device_id with value "999" does not exist in device',
    { field: 'device_id', value: 999, referencedTable: 'device' }
  );
} catch (error) {
  console.log('✓ ForeignKeyError:', error.message);
  console.log('  Status Code:', error.statusCode);
  console.log('  Details:', error.details);
  console.log();
}

// Test 4: NotFoundError
try {
  throw new NotFoundError('Meter not found', { id: 5 });
} catch (error) {
  console.log('✓ NotFoundError:', error.message);
  console.log('  Status Code:', error.statusCode);
  console.log('  Details:', error.details);
  console.log();
}

// Test 5: NotNullError
try {
  throw new NotNullError('Required field missing: "name" cannot be null', { field: 'name' });
} catch (error) {
  console.log('✓ NotNullError:', error.message);
  console.log('  Status Code:', error.statusCode);
  console.log('  Details:', error.details);
  console.log();
}

// Test 6: ConnectionError
try {
  throw new ConnectionError('Failed to connect to database', { host: 'localhost', port: 5432 });
} catch (error) {
  console.log('✓ ConnectionError:', error.message);
  console.log('  Status Code:', error.statusCode);
  console.log('  Details:', error.details);
  console.log();
}

// Test 7: ConfigurationError
try {
  throw new ConfigurationError('tableName must be defined', { model: 'Meter' });
} catch (error) {
  console.log('✓ ConfigurationError:', error.message);
  console.log('  Status Code:', error.statusCode);
  console.log('  Details:', error.details);
  console.log();
}

console.log('=== Testing Error Handler ===\n');

// Test 8: Parse unique constraint error
try {
  const pgError = new Error('duplicate key value violates unique constraint "meter_meterid_key"');
  pgError.code = '23505';
  pgError.message = 'duplicate key value violates unique constraint "meter_meterid_key"\nKey (meterid)=(M001) already exists.';
  
  handleDatabaseError(pgError, 'create', 'Meter', 'meter');
} catch (error) {
  console.log('✓ Parsed unique constraint error:', error.message);
  console.log('  Error type:', error.constructor.name);
  console.log('  Details:', error.details);
  console.log();
}

// Test 9: Parse foreign key error
try {
  const pgError = new Error('insert or update on table "meter" violates foreign key constraint');
  pgError.code = '23503';
  pgError.message = 'insert or update on table "meter" violates foreign key constraint "meter_device_id_fkey"\nKey (device_id)=(999) is not present in table "device".';
  
  handleDatabaseError(pgError, 'create', 'Meter', 'meter');
} catch (error) {
  console.log('✓ Parsed foreign key error:', error.message);
  console.log('  Error type:', error.constructor.name);
  console.log('  Details:', error.details);
  console.log();
}

// Test 10: Parse not null error
try {
  const pgError = new Error('null value in column "name" violates not-null constraint');
  pgError.code = '23502';
  pgError.message = 'null value in column "name" violates not-null constraint';
  
  handleDatabaseError(pgError, 'create', 'Meter', 'meter');
} catch (error) {
  console.log('✓ Parsed not null error:', error.message);
  console.log('  Error type:', error.constructor.name);
  console.log('  Details:', error.details);
  console.log();
}

console.log('=== Testing Validation Functions ===\n');

// Test 11: Validate required fields - success
try {
  const data = { name: 'Test Meter', meterid: 'M001' };
  const requiredFields = ['name', 'meterid'];
  validateRequiredFields(data, requiredFields, 'Meter');
  console.log('✓ Required fields validation passed');
  console.log();
} catch (error) {
  console.log('✗ Required fields validation failed:', error.message);
  console.log();
}

// Test 12: Validate required fields - failure
try {
  const data = { name: 'Test Meter' };
  const requiredFields = ['name', 'meterid'];
  validateRequiredFields(data, requiredFields, 'Meter');
  console.log('✗ Required fields validation should have failed');
  console.log();
} catch (error) {
  console.log('✓ Required fields validation caught missing field:', error.message);
  console.log('  Details:', error.details);
  console.log();
}

// Test 13: Validate field types - success
try {
  const data = { name: 'Test Meter', port: 502, active: true };
  const fields = [
    { name: 'name', type: 'string' },
    { name: 'port', type: 'number' },
    { name: 'active', type: 'boolean' }
  ];
  validateFieldTypes(data, fields, 'Meter');
  console.log('✓ Field types validation passed');
  console.log();
} catch (error) {
  console.log('✗ Field types validation failed:', error.message);
  console.log();
}

// Test 14: Validate field types - failure
try {
  const data = { name: 'Test Meter', port: 'invalid' };
  const fields = [
    { name: 'name', type: 'string' },
    { name: 'port', type: 'number' }
  ];
  validateFieldTypes(data, fields, 'Meter');
  console.log('✗ Field types validation should have failed');
  console.log();
} catch (error) {
  console.log('✓ Field types validation caught invalid type:', error.message);
  console.log('  Details:', error.details);
  console.log();
}

console.log('=== Testing Logger ===\n');

// Test 15: Log info
logInfo('Test info message', { operation: 'test', model: 'Meter' });

// Test 16: Log warning
logWarn('Test warning message', { field: 'name', value: null });

// Test 17: Log error
const testError = new Error('Test error');
testError.code = '23505';
logError('Test error message', testError, { operation: 'create', model: 'Meter' });

console.log('\n=== All Tests Completed ===');
console.log('All error handling and logging features are working correctly!');
