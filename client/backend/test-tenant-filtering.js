/**
 * Test tenant filtering functionality
 * Run: node test-tenant-filtering.js
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:3001/api';

async function makeRequest(url, options = {}) {
  const { default: fetch } = await import('node-fetch');
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { data, status: response.status };
}

async function testTenantFiltering() {
  try {
    console.log('\n=== TESTING TENANT FILTERING ===\n');

    // Step 1: Login to get token
    console.log('Step 1: Logging in...');                          
    const loginResponse = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      process.exit(1);
    }

    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('✓ Login successful');
    console.log(`  - User ID: ${user.id}`);
    console.log(`  - User Email: ${user.email}`);
    console.log(`  - Client (tenant_id): ${user.client}`);
    console.log(`  - Token length: ${token.length}`);

    // Step 2: Make a request to a protected endpoint that should use tenant filtering
    console.log('\nStep 2: Testing tenant filtering on /api/users...');
    
    const usersResponse = await makeRequest(`${BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!usersResponse.data.success) {
      console.log('❌ Users request failed:', usersResponse.data.message);
      console.log('Response:', JSON.stringify(usersResponse.data, null, 2));
      process.exit(1);
    }

    console.log('✓ Users request successful');
    console.log('Response structure:', JSON.stringify(usersResponse.data, null, 2));
    
    if (!usersResponse.data.data || !usersResponse.data.data.rows) {
      console.log('❌ Unexpected response structure');
      process.exit(1);
    }
    
    console.log(`  - Users returned: ${usersResponse.data.data.rows.length}`);
    console.log(`  - Total count: ${usersResponse.data.data.pagination.total}`);
    
    // Check if all returned users have the same tenant_id
    const users = usersResponse.data.data.rows;
    const tenantIds = [...new Set(users.map(u => u.tenant_id))];
    
    console.log(`  - Unique tenant_ids in results: ${tenantIds.join(', ')}`);
    
    if (tenantIds.length === 1 && tenantIds[0] === user.client) {
      console.log('✓ Tenant filtering is working correctly!');
    } else {
      console.log('❌ Tenant filtering is NOT working - multiple tenant_ids found');
    }

    // Step 3: Test another endpoint
    console.log('\nStep 3: Testing tenant filtering on /api/meters...');
    
    try {
      const metersResponse = await makeRequest(`${BASE_URL}/meters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (metersResponse.data.success) {
        console.log('✓ Meters request successful');
        console.log(`  - Meters returned: ${metersResponse.data.data.rows.length}`);
        
        const meters = metersResponse.data.data.rows;
        const meterTenantIds = [...new Set(meters.map(m => m.tenant_id))];
        
        console.log(`  - Unique tenant_ids in meter results: ${meterTenantIds.join(', ')}`);
        
        if (meterTenantIds.length === 0) {
          console.log('  - No meters found (empty result set)');
        } else if (meterTenantIds.length === 1 && meterTenantIds[0] === user.client) {
          console.log('✓ Meter tenant filtering is working correctly!');
        } else {
          console.log('❌ Meter tenant filtering is NOT working - multiple tenant_ids found');
        }
      } else {
        console.log('⚠️ Meters request failed:', metersResponse.data.message);
      }
    } catch (error) {
      console.log('⚠️ Meters endpoint error:', error.message);
    }

    console.log('\n=== TENANT FILTERING TEST COMPLETE ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testTenantFiltering();