/**
 * Test Type Handling Implementation
 * 
 * This script tests the type conversion and serialization/deserialization
 * functionality for the BaseModel system.
 */

const {
  serializeValue,
  deserializeValue,
  deserializeRow,
  mapJavaScriptToPostgreSQLType,
  mapPostgreSQLToJavaScriptType,
  validateType
} = require('../../shared/utils/typeHandlers');

console.log('🧪 Testing Type Handling Implementation...\n');

// Test 1: JavaScript to PostgreSQL type mapping
console.log('Test 1: JavaScript to PostgreSQL type mapping');
try {
  const tests = [
    { value: 'hello', expected: 'VARCHAR', desc: 'string' },
    { value: 42, expected: 'INTEGER', desc: 'integer' },
    { value: 3.14, expected: 'NUMERIC', desc: 'float' },
    { value: true, expected: 'BOOLEAN', desc: 'boolean' },
    { value: new Date(), expected: 'TIMESTAMP', desc: 'Date object' },
    { value: { key: 'value' }, expected: 'JSONB', desc: 'object' },
    { value: [1, 2, 3], expected: 'JSONB', desc: 'array' },
    { value: null, expected: 'NULL', desc: 'null' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = mapJavaScriptToPostgreSQLType(test.value);
    if (result === test.expected) {
      passed++;
    } else {
      console.log(`   ❌ ${test.desc}: expected ${test.expected}, got ${result}`);
    }
  }
  
  if (passed === tests.length) {
    console.log(`✅ All ${tests.length} type mappings correct\n`);
  } else {
    console.log(`❌ Only ${passed}/${tests.length} type mappings correct\n`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 2: PostgreSQL to JavaScript type mapping
console.log('Test 2: PostgreSQL to JavaScript type mapping');
try {
  const tests = [
    { pgType: 'VARCHAR', expected: 'string' },
    { pgType: 'TEXT', expected: 'string' },
    { pgType: 'INTEGER', expected: 'number' },
    { pgType: 'BIGINT', expected: 'number' },
    { pgType: 'NUMERIC', expected: 'number' },
    { pgType: 'BOOLEAN', expected: 'boolean' },
    { pgType: 'TIMESTAMP', expected: 'Date' },
    { pgType: 'DATE', expected: 'Date' },
    { pgType: 'JSONB', expected: 'Object' },
    { pgType: 'JSON', expected: 'Object' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = mapPostgreSQLToJavaScriptType(test.pgType);
    if (result === test.expected) {
      passed++;
    } else {
      console.log(`   ❌ ${test.pgType}: expected ${test.expected}, got ${result}`);
    }
  }
  
  if (passed === tests.length) {
    console.log(`✅ All ${tests.length} type mappings correct\n`);
  } else {
    console.log(`❌ Only ${passed}/${tests.length} type mappings correct\n`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 3: Value serialization (JavaScript to PostgreSQL)
console.log('Test 3: Value serialization (JavaScript to PostgreSQL)');
try {
  const date = new Date('2024-01-15T10:30:00Z');
  const tests = [
    { value: 'hello', fieldType: 'string', expected: 'hello', desc: 'string' },
    { value: 42, fieldType: 'number', expected: 42, desc: 'number' },
    { value: true, fieldType: 'boolean', expected: true, desc: 'boolean' },
    { value: date, fieldType: 'Date', expected: date.toISOString(), desc: 'Date to ISO string' },
    { value: { key: 'value' }, fieldType: 'Object', expected: '{"key":"value"}', desc: 'object to JSON' },
    { value: [1, 2, 3], fieldType: 'Array', expected: '[1,2,3]', desc: 'array to JSON' },
    { value: null, fieldType: 'string', expected: null, desc: 'null value' },
    { value: undefined, fieldType: 'string', expected: null, desc: 'undefined to null' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = serializeValue(test.value, test.fieldType);
    if (JSON.stringify(result) === JSON.stringify(test.expected)) {
      passed++;
    } else {
      console.log(`   ❌ ${test.desc}: expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(result)}`);
    }
  }
  
  if (passed === tests.length) {
    console.log(`✅ All ${tests.length} serializations correct\n`);
  } else {
    console.log(`❌ Only ${passed}/${tests.length} serializations correct\n`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 4: Value deserialization (PostgreSQL to JavaScript)
console.log('Test 4: Value deserialization (PostgreSQL to JavaScript)');
try {
  const tests = [
    { value: 'hello', fieldType: 'string', expected: 'hello', desc: 'string' },
    { value: 42, fieldType: 'number', expected: 42, desc: 'number' },
    { value: true, fieldType: 'boolean', expected: true, desc: 'boolean' },
    { value: 't', fieldType: 'boolean', expected: true, desc: 'boolean from "t"' },
    { value: 'f', fieldType: 'boolean', expected: false, desc: 'boolean from "f"' },
    { value: '2024-01-15T10:30:00.000Z', fieldType: 'Date', expectedType: Date, desc: 'Date from string' },
    { value: '{"key":"value"}', fieldType: 'Object', expected: { key: 'value' }, desc: 'object from JSON' },
    { value: '[1,2,3]', fieldType: 'Array', expected: [1, 2, 3], desc: 'array from JSON' },
    { value: null, fieldType: 'string', expected: null, desc: 'null value' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = deserializeValue(test.value, test.fieldType, 'test_field');
    
    if (test.expectedType === Date) {
      if (result instanceof Date && !isNaN(result.getTime())) {
        passed++;
      } else {
        console.log(`   ❌ ${test.desc}: expected Date object, got ${typeof result}`);
      }
    } else if (JSON.stringify(result) === JSON.stringify(test.expected)) {
      passed++;
    } else {
      console.log(`   ❌ ${test.desc}: expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(result)}`);
    }
  }
  
  if (passed === tests.length) {
    console.log(`✅ All ${tests.length} deserializations correct\n`);
  } else {
    console.log(`❌ Only ${passed}/${tests.length} deserializations correct\n`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 5: Row deserialization
console.log('Test 5: Row deserialization');
try {
  const row = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    is_active: 't',
    created_at: '2024-01-15T10:30:00.000Z',
    metadata: '{"role":"admin","permissions":["read","write"]}'
  };
  
  const fields = [
    { name: 'id', type: 'number' },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'Date' },
    { name: 'metadata', type: 'Object' }
  ];
  
  const result = deserializeRow(row, fields);
  
  let passed = 0;
  let total = 0;
  
  // Check id
  total++;
  if (result.id === 1 && typeof result.id === 'number') {
    passed++;
  } else {
    console.log(`   ❌ id: expected number 1, got ${typeof result.id} ${result.id}`);
  }
  
  // Check name
  total++;
  if (result.name === 'Test User' && typeof result.name === 'string') {
    passed++;
  } else {
    console.log(`   ❌ name: expected string, got ${typeof result.name}`);
  }
  
  // Check is_active (boolean from 't')
  total++;
  if (result.is_active === true && typeof result.is_active === 'boolean') {
    passed++;
  } else {
    console.log(`   ❌ is_active: expected boolean true, got ${typeof result.is_active} ${result.is_active}`);
  }
  
  // Check created_at (Date from string)
  total++;
  if (result.created_at instanceof Date && !isNaN(result.created_at.getTime())) {
    passed++;
  } else {
    console.log(`   ❌ created_at: expected Date object, got ${typeof result.created_at}`);
  }
  
  // Check metadata (Object from JSON string)
  total++;
  if (typeof result.metadata === 'object' && result.metadata.role === 'admin') {
    passed++;
  } else {
    console.log(`   ❌ metadata: expected object with role, got ${typeof result.metadata}`);
  }
  
  if (passed === total) {
    console.log(`✅ Row deserialization correct (${passed}/${total} fields)\n`);
  } else {
    console.log(`❌ Row deserialization incomplete (${passed}/${total} fields)\n`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 6: Type validation
console.log('Test 6: Type validation');
try {
  const tests = [
    { value: 'hello', fieldType: 'string', shouldPass: true, desc: 'valid string' },
    { value: 42, fieldType: 'string', shouldPass: false, desc: 'number as string' },
    { value: 42, fieldType: 'number', shouldPass: true, desc: 'valid number' },
    { value: 'hello', fieldType: 'number', shouldPass: false, desc: 'string as number' },
    { value: true, fieldType: 'boolean', shouldPass: true, desc: 'valid boolean' },
    { value: 'true', fieldType: 'boolean', shouldPass: false, desc: 'string as boolean' },
    { value: new Date(), fieldType: 'Date', shouldPass: true, desc: 'valid Date' },
    { value: '2024-01-15', fieldType: 'Date', shouldPass: true, desc: 'date string' },
    { value: { key: 'value' }, fieldType: 'Object', shouldPass: true, desc: 'valid object' },
    { value: [1, 2, 3], fieldType: 'Array', shouldPass: true, desc: 'valid array' },
    { value: null, fieldType: 'string', shouldPass: true, desc: 'null is always valid' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    try {
      validateType(test.value, test.fieldType, 'test_field');
      if (test.shouldPass) {
        passed++;
      } else {
        console.log(`   ❌ ${test.desc}: expected validation to fail but it passed`);
      }
    } catch (error) {
      if (!test.shouldPass) {
        passed++;
      } else {
        console.log(`   ❌ ${test.desc}: expected validation to pass but got error: ${error.message}`);
      }
    }
  }
  
  if (passed === tests.length) {
    console.log(`✅ All ${tests.length} validations correct\n`);
  } else {
    console.log(`❌ Only ${passed}/${tests.length} validations correct\n`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

// Test 7: Edge cases
console.log('Test 7: Edge cases');
try {
  let passed = 0;
  let total = 0;
  
  // Test NaN handling
  total++;
  try {
    serializeValue(NaN, 'number');
    console.log('   ❌ NaN serialization: should throw error');
  } catch (error) {
    if (error.message.includes('NaN')) {
      passed++;
    } else {
      console.log('   ❌ NaN serialization: wrong error message');
    }
  }
  
  // Test Infinity handling
  total++;
  try {
    serializeValue(Infinity, 'number');
    console.log('   ❌ Infinity serialization: should throw error');
  } catch (error) {
    if (error.message.includes('Infinity')) {
      passed++;
    } else {
      console.log('   ❌ Infinity serialization: wrong error message');
    }
  }
  
  // Test invalid Date handling
  total++;
  try {
    serializeValue(new Date('invalid'), 'Date');
    console.log('   ❌ Invalid Date serialization: should throw error');
  } catch (error) {
    if (error.message.includes('Invalid Date')) {
      passed++;
    } else {
      console.log('   ❌ Invalid Date serialization: wrong error message');
    }
  }
  
  // Test circular reference handling
  total++;
  try {
    const circular = { a: 1 };
    circular.self = circular;
    serializeValue(circular, 'Object');
    console.log('   ❌ Circular reference: should throw error');
  } catch (error) {
    if (error.message.includes('JSON')) {
      passed++;
    } else {
      console.log('   ❌ Circular reference: wrong error message');
    }
  }
  
  if (passed === total) {
    console.log(`✅ All ${total} edge cases handled correctly\n`);
  } else {
    console.log(`❌ Only ${passed}/${total} edge cases handled correctly\n`);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

console.log('✅ All type handling tests completed!\n');
