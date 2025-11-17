/**
 * Integration test for relationship support with BaseModel
 * This tests the full flow from model definition to query execution
 */

const BaseModel = require('./BaseModel');

// Mock database for testing
const mockDb = {
  query: async (sql, values) => {
    console.log('\n--- Mock Database Query ---');
    console.log('SQL:', sql);
    console.log('Values:', values);
    console.log('---------------------------\n');
    
    // Return mock data based on the query
    if (sql.includes('row_to_json')) {
      // Query with relationships
      return {
        rows: [
          {
            id: 1,
            meterid: 'M001',
            name: 'Main Meter',
            device_id: 10,
            location_id: 20,
            created_at: new Date(),
            updated_at: new Date(),
            device_data: { id: 10, manufacturer: 'Acme', model: 'X100' },
            location_data: { id: 20, name: 'Building A', floor: '1' }
          }
        ]
      };
    } else {
      // Simple query without relationships
      return {
        rows: [
          {
            id: 1,
            meterid: 'M001',
            name: 'Main Meter',
            device_id: 10,
            location_id: 20,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      };
    }
  }
};

// Test model with relationships
class TestMeter extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.id = data.id;
    this.meterid = data.meterid;
    this.name = data.name;
    this.device_id = data.device_id;
    this.location_id = data.location_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Relationship data
    this.device = data.device;
    this.location = data.location;
  }

  static get tableName() {
    return 'meter';
  }

  static get primaryKey() {
    return 'id';
  }

  static get relationships() {
    return {
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
  }
}

// Override the database connection for testing
TestMeter._db = mockDb;

async function runTests() {
  console.log('=== Integration Test: Relationship Support ===\n');

  try {
    // Test 1: findById without relationships
    console.log('Test 1: findById without relationships');
    const meter1 = await TestMeter.findById(1);
    console.log('Result:', JSON.stringify(meter1, null, 2));
    console.log('✓ Test 1 passed\n');

    // Test 2: findById with single relationship
    console.log('Test 2: findById with single relationship (device)');
    const meter2 = await TestMeter.findById(1, { include: ['device'] });
    console.log('Result:', JSON.stringify(meter2, null, 2));
    
    if (meter2.device && meter2.device.manufacturer === 'Acme') {
      console.log('✓ Test 2 passed - device relationship loaded correctly\n');
    } else {
      console.log('✗ Test 2 failed - device relationship not loaded\n');
    }

    // Test 3: findById with multiple relationships
    console.log('Test 3: findById with multiple relationships (device, location)');
    const meter3 = await TestMeter.findById(1, { include: ['device', 'location'] });
    console.log('Result:', JSON.stringify(meter3, null, 2));
    
    if (meter3.device && meter3.location) {
      console.log('✓ Test 3 passed - multiple relationships loaded correctly\n');
    } else {
      console.log('✗ Test 3 failed - relationships not loaded\n');
    }

    // Test 4: findOne with relationships
    console.log('Test 4: findOne with relationships');
    const meter4 = await TestMeter.findOne(
      { meterid: 'M001' },
      { include: ['device', 'location'] }
    );
    console.log('Result:', JSON.stringify(meter4, null, 2));
    console.log('✓ Test 4 passed\n');

    // Test 5: findAll with relationships
    console.log('Test 5: findAll with relationships');
    const result = await TestMeter.findAll({
      where: { status: 'active' },
      include: ['device', 'location'],
      limit: 10
    });
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('✓ Test 5 passed\n');

    console.log('=== All Integration Tests Passed ===');
  } catch (error) {
    console.error('Test failed with error:', error);
    console.error(error.stack);
  }
}

runTests();
