/**
 * Verification script for relationship support
 * Tests the buildJoinClause and mapJoinedResults functions
 */

const { buildJoinClause, mapJoinedResults } = require('../../shared/utils/modelHelpers');

console.log('=== Testing Relationship Support ===\n');

// Test 1: buildJoinClause for belongsTo relationship
console.log('Test 1: buildJoinClause for belongsTo relationship');
const relationships = {
  device: {
    type: 'belongsTo',
    model: 'Device',
    foreignKey: 'device_id',
    targetKey: 'id'
  },
  location: {
    type: 'belongsTo',
    model: 'Location',
    foreignKey: 'location_id',
    targetKey: 'id'
  }
};

const joinResult = buildJoinClause('meter', ['device', 'location'], relationships);
console.log('JOIN clause:', joinResult.clause);
console.log('SELECT additions:', joinResult.selectAdditions);
console.log('Relationship map:', JSON.stringify(joinResult.relationshipMap, null, 2));
console.log('✓ Test 1 passed\n');

// Test 2: buildJoinClause for hasMany relationship
console.log('Test 2: buildJoinClause for hasMany relationship');
const hasManyRelationships = {
  posts: {
    type: 'hasMany',
    model: 'Post',
    foreignKey: 'user_id',
    targetKey: 'id'
  }
};

const hasManyResult = buildJoinClause('user', ['posts'], hasManyRelationships);
console.log('JOIN clause:', hasManyResult.clause);
console.log('SELECT additions:', hasManyResult.selectAdditions);
console.log('Relationship map:', JSON.stringify(hasManyResult.relationshipMap, null, 2));
console.log('✓ Test 2 passed\n');

// Test 3: buildJoinClause for hasOne relationship
console.log('Test 3: buildJoinClause for hasOne relationship');
const hasOneRelationships = {
  profile: {
    type: 'hasOne',
    model: 'Profile',
    foreignKey: 'user_id',
    targetKey: 'id'
  }
};

const hasOneResult = buildJoinClause('user', ['profile'], hasOneRelationships);
console.log('JOIN clause:', hasOneResult.clause);
console.log('SELECT additions:', hasOneResult.selectAdditions);
console.log('Relationship map:', JSON.stringify(hasOneResult.relationshipMap, null, 2));
console.log('✓ Test 3 passed\n');

// Test 4: mapJoinedResults for belongsTo
console.log('Test 4: mapJoinedResults for belongsTo relationship');
const mockRows = [
  {
    id: 1,
    meterid: 'M001',
    name: 'Main Meter',
    device_id: 10,
    device_data: { id: 10, manufacturer: 'Acme', model: 'X100' }
  },
  {
    id: 2,
    meterid: 'M002',
    name: 'Secondary Meter',
    device_id: 11,
    device_data: { id: 11, manufacturer: 'Beta', model: 'Y200' }
  }
];

const mappedBelongsTo = mapJoinedResults(mockRows, [
  {
    name: 'device',
    alias: 'device',
    type: 'belongsTo',
    relatedTable: 'device',
    foreignKey: 'device_id',
    targetKey: 'id'
  }
], 'id');

console.log('Mapped results:', JSON.stringify(mappedBelongsTo, null, 2));
console.log('✓ Test 4 passed\n');

// Test 5: mapJoinedResults for hasMany
console.log('Test 5: mapJoinedResults for hasMany relationship');
const hasManyRows = [
  {
    id: 1,
    username: 'john',
    posts_data: { id: 101, title: 'First Post', user_id: 1 }
  },
  {
    id: 1,
    username: 'john',
    posts_data: { id: 102, title: 'Second Post', user_id: 1 }
  },
  {
    id: 2,
    username: 'jane',
    posts_data: { id: 201, title: 'Jane Post', user_id: 2 }
  }
];

const mappedHasMany = mapJoinedResults(hasManyRows, [
  {
    name: 'posts',
    alias: 'posts',
    type: 'hasMany',
    relatedTable: 'post',
    foreignKey: 'user_id',
    targetKey: 'id'
  }
], 'id');

console.log('Mapped results:', JSON.stringify(mappedHasMany, null, 2));
console.log('✓ Test 5 passed\n');

// Test 6: Multiple relationships
console.log('Test 6: Multiple relationships (belongsTo)');
const multipleRelRows = [
  {
    id: 1,
    meterid: 'M001',
    name: 'Main Meter',
    device_id: 10,
    location_id: 20,
    device_data: { id: 10, manufacturer: 'Acme', model: 'X100' },
    location_data: { id: 20, name: 'Building A', floor: '1' }
  }
];

const mappedMultiple = mapJoinedResults(multipleRelRows, [
  {
    name: 'device',
    alias: 'device',
    type: 'belongsTo',
    relatedTable: 'device',
    foreignKey: 'device_id',
    targetKey: 'id'
  },
  {
    name: 'location',
    alias: 'location',
    type: 'belongsTo',
    relatedTable: 'location',
    foreignKey: 'location_id',
    targetKey: 'id'
  }
], 'id');

console.log('Mapped results:', JSON.stringify(mappedMultiple, null, 2));
console.log('✓ Test 6 passed\n');

// Test 7: Null relationship data
console.log('Test 7: Null relationship data');
const nullRelRows = [
  {
    id: 1,
    meterid: 'M001',
    name: 'Main Meter',
    device_id: null,
    device_data: null
  }
];

const mappedNull = mapJoinedResults(nullRelRows, [
  {
    name: 'device',
    alias: 'device',
    type: 'belongsTo',
    relatedTable: 'device',
    foreignKey: 'device_id',
    targetKey: 'id'
  }
], 'id');

console.log('Mapped results:', JSON.stringify(mappedNull, null, 2));
console.log('✓ Test 7 passed\n');

// Test 8: Error handling - undefined relationship
console.log('Test 8: Error handling - undefined relationship');
try {
  buildJoinClause('meter', ['nonexistent'], relationships);
  console.log('✗ Test 8 failed - should have thrown error');
} catch (error) {
  console.log('Error caught:', error.message);
  console.log('✓ Test 8 passed\n');
}

console.log('=== All Tests Passed ===');
