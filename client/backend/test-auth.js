/**
 * Test script for authentication fix
 * Tests the login endpoint with various scenarios
 */

const http = require('http');

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAuth() {
  console.log('🧪 Testing Authentication Fix\n');
  console.log('=' .repeat(60));

  // Test 1: Valid login
  console.log('\n✅ Test 1: Valid login with correct credentials');
  try {
    const result = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.body.success}`);
    if (result.body.success) {
      console.log(`User: ${result.body.data.user.email}`);
      console.log(`Token received: ${result.body.data.token ? 'Yes' : 'No'}`);
    } else {
      console.log(`Message: ${result.body.message}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Missing password field
  console.log('\n✅ Test 2: Missing password field (should return 400)');
  try {
    const result = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@example.com'
    });
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.body.success}`);
    console.log(`Message: ${result.body.message}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Empty password
  console.log('\n✅ Test 3: Empty password (should return 400)');
  try {
    const result = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@example.com',
      password: ''
    });
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.body.success}`);
    console.log(`Message: ${result.body.message}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: Invalid password
  console.log('\n✅ Test 4: Invalid password (should return 401)');
  try {
    const result = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'wrongpassword'
    });
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.body.success}`);
    console.log(`Message: ${result.body.message}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 5: Non-existent user
  console.log('\n✅ Test 5: Non-existent user (should return 401)');
  try {
    const result = await makeRequest('/api/auth/login', 'POST', {
      email: 'nonexistent@example.com',
      password: 'password123'
    });
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.body.success}`);
    console.log(`Message: ${result.body.message}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All authentication tests completed!\n');
}

testAuth().catch(console.error);
