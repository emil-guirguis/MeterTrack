// Test script to verify the meter creation fix
const http = require('http');

// Test data - simulating what the frontend sends
const testData = {
  name: 'Test Virtual Meter',
  identifier: 'test-virtual-001',
  meter_type: 'virtual',
  location_id: 1,
  elements: null  // This should NOT be in the final payload
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/meters',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== RESPONSE ===');
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
    
    if (res.statusCode === 201) {
      console.log('\n✅ SUCCESS - Meter created!');
    } else if (res.statusCode === 500) {
      console.log('\n❌ FAILED - Server error');
      const parsed = JSON.parse(data);
      if (parsed.error && parsed.error.includes('elements')) {
        console.log('ERROR: elements field is still being sent to the database');
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

console.log('Sending test data:');
console.log(JSON.stringify(testData, null, 2));

req.write(JSON.stringify(testData));
req.end();
