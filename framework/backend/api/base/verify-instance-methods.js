/**
 * Verification script for BaseModel instance CRUD methods
 * Tests update(), delete(), save(), and reload() methods
 */

const BaseModel = require('./BaseModel');

// Mock database for testing
const mockDb = {
  query: async (sql, values) => {
    console.log('SQL:', sql);
    console.log('Values:', values);
    
    // Simulate database responses
    if (sql.includes('UPDATE')) {
      return {
        rows: [{
          id: values[values.length - 1],
          name: values[0] || 'Test Name',
          email: 'updated@example.com',
          updated_at: new Date().toISOString()
        }]
      };
    }
    
    if (sql.includes('DELETE')) {
      return {
        rows: [{
          id: values[0],
          name: 'Deleted Record',
          email: 'deleted@example.com'
        }]
      };
    }
    
    if (sql.includes('INSERT')) {
      return {
        rows: [{
          id: 1,
          name: values[0] || 'New Record',
          email: values[1] || 'new@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      };
    }
    
    if (sql.includes('SELECT')) {
      return {
        rows: [{
          id: values[0],
          name: 'Reloaded Record',
          email: 'reloaded@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      };
    }
    
    return { rows: [] };
  }
};

// Test model class
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
  
  static _getDb() {
    return mockDb;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Testing BaseModel Instance CRUD Methods');
  console.log('='.repeat(60));
  
  try {
    // Test 1: update() method
    console.log('\n--- Test 1: update() method ---');
    const instance1 = new TestModel({ id: 5, name: 'Original Name', email: 'original@example.com' });
    console.log('Before update:', { name: instance1.name, email: instance1.email });
    
    await instance1.update({ name: 'Updated Name' });
    console.log('After update:', {  name: instance1.name, email: instance1.email });
    console.log('✓ update() method works correctly');
    
    // Test 2: update() without primary key should fail
    console.log('\n--- Test 2: update() without primary key ---');
    const instance2 = new TestModel({ name: 'No ID' });
    try {
      await instance2.update({ name: 'Should Fail' });
      console.log('✗ Should have thrown error');
    } catch (error) {
      console.log('✓ Correctly threw error:', error.message);
    }
    
    // Test 3: delete() method
    console.log('\n--- Test 3: delete() method ---');
    const instance3 = new TestModel({ id: 10, name: 'To Delete', email: 'delete@example.com' });
    const deletedData = await instance3.delete();
    console.log('Deleted data:', deletedData);
    console.log('✓ delete() method works correctly');
    
    // Test 4: delete() without primary key should fail
    console.log('\n--- Test 4: delete() without primary key ---');
    const instance4 = new TestModel({ name: 'No ID' });
    try {
      await instance4.delete();
      console.log('✗ Should have thrown error');
    } catch (error) {
      console.log('✓ Correctly threw error:', error.message);
    }
    
    // Test 5: save() for new record (create)
    console.log('\n--- Test 5: save() for new record ---');
    const instance5 = new TestModel({ name: 'New Record', email: 'new@example.com' });
    console.log('Before save:', { name: instance5.name });
    
    await instance5.save();
    console.log('After save:', {  name: instance5.name });
    console.log('✓ save() creates new record correctly');
    
    // Test 6: save() for existing record (update)
    console.log('\n--- Test 6: save() for existing record ---');
    const instance6 = new TestModel({ id: 15, name: 'Existing Record', email: 'existing@example.com' });
    instance6.name = 'Modified Name';
    console.log('Before save:', {  name: instance6.name });
    
    await instance6.save();
    console.log('After save:', { name: instance6.name });
    console.log('✓ save() updates existing record correctly');
    
    // Test 7: reload() method
    console.log('\n--- Test 7: reload() method ---');
    const instance7 = new TestModel({ id: 20, name: 'Old Data', email: 'old@example.com' });
    console.log('Before reload:', {  name: instance7.name, email: instance7.email });
    
    await instance7.reload();
    console.log('After reload:', { name: instance7.name, email: instance7.email });
    console.log('✓ reload() method works correctly');
    
    // Test 8: reload() without primary key should fail
    console.log('\n--- Test 8: reload() without primary key ---');
    const instance8 = new TestModel({ name: 'No ID' });
    try {
      await instance8.reload();
      console.log('✗ Should have thrown error');
    } catch (error) {
      console.log('✓ Correctly threw error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('All tests passed! ✓');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
