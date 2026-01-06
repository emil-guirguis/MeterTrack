/**
 * Test the tenant filtering fix
 * Run: node test-tenant-fix.js
 */

require('dotenv').config();
const User = require('./src/models/UserWithSchema');
const db = require('./src/config/database');

async function testTenantFix() {
  try {
    console.log('\n=== TESTING TENANT FILTERING FIX ===\n');

    // Step 1: Connect to database
    console.log('Step 1: Connecting to database...');
    await db.connect();
    console.log('✓ Database connected');

    // Step 2: Simulate authentication by setting global tenant context
    console.log('\nStep 2: Setting global tenant context (simulating auth middleware)...');
    global.currentTenantId = 1;
    console.log('✓ Global tenant context set to:', global.currentTenantId);

    // Step 3: Test findAll with automatic tenant filtering
    console.log('\nStep 3: Testing User.findAll() with automatic tenant filtering...');
    const result = await User.findAll();
    
    console.log('✓ Query executed successfully');
    console.log(`  - Users returned: ${result.rows.length}`);
    console.log(`  - Total count: ${result.pagination.total}`);
    
    // Check if all returned users have the correct tenant_id
    const users = result.rows;
    const tenantIds = [...new Set(users.map(u => u.tenant_id))];
    
    console.log(`  - Unique tenant_ids in results: ${tenantIds.join(', ')}`);
    
    if (tenantIds.length === 1 && tenantIds[0] === global.currentTenantId) {
      console.log('✅ SUCCESS: Automatic tenant filtering is working!');
    } else if (tenantIds.length === 0) {
      console.log('⚠️  No users found (empty result set)');
    } else {
      console.log('❌ FAILED: Multiple tenant_ids found or wrong tenant_id');
    }

    // Step 4: Test findOne with automatic tenant filtering
    console.log('\nStep 4: Testing User.findOne() with automatic tenant filtering...');
    const user = await User.findOne({ email: 'admin@example.com' });
    
    if (user) {
      console.log('✓ User found');
      console.log(`  - User ID: ${user.id}`);
      console.log(`  - User Email: ${user.email}`);
      console.log(`  - User tenant_id: ${user.tenant_id}`);
      
      if (user.tenant_id === global.currentTenantId) {
        console.log('✅ SUCCESS: findOne tenant filtering is working!');
      } else {
        console.log('❌ FAILED: Wrong tenant_id in findOne result');
      }
    } else {
      console.log('❌ No user found');
    }

    // Step 5: Test count with automatic tenant filtering
    console.log('\nStep 5: Testing User.count() with automatic tenant filtering...');
    const count = await User.count();
    
    console.log('✓ Count executed successfully');
    console.log(`  - Total users for tenant ${global.currentTenantId}: ${count}`);

    console.log('\n=== TENANT FILTERING FIX TEST COMPLETE ===');
    
    await db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    try {
      await db.disconnect();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

testTenantFix();