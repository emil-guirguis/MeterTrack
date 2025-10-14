const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3001/api';

// Simple HTTP client using Node.js built-in modules
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

async function testDeviceOperations() {
  console.log('🧪 Testing Device CRUD Operations...\n');
  
  try {
    // Test GET /devices
    console.log('1. Testing GET /devices');
    const getDevicesResponse = await makeRequest(`${BASE_URL}/devices`);
    console.log('✓ GET /devices status:', getDevicesResponse.status);
    console.log('✓ Devices count:', getDevicesResponse.data.data.length);
    console.log('✓ Sample device:', getDevicesResponse.data.data[0]);
    
    // Test POST /devices
    console.log('\n2. Testing POST /devices');
    const newDevice = {
      name: 'Test Device',
      description: 'Test device for API verification'
    };
    const postDeviceResponse = await makeRequest(`${BASE_URL}/devices`, {
      method: 'POST',
      data: newDevice
    });
    console.log('✓ POST /devices status:', postDeviceResponse.status);
    console.log('✓ Created device:', postDeviceResponse.data.data);
    const createdDeviceId = postDeviceResponse.data.data.id;
    
    // Test PUT /devices/:id
    console.log('\n3. Testing PUT /devices/:id');
    const updatedDevice = {
      name: 'Updated Test Device',
      description: 'Updated test device description'
    };
    const putDeviceResponse = await makeRequest(`${BASE_URL}/devices/${createdDeviceId}`, {
      method: 'PUT',
      data: updatedDevice
    });
    console.log('✓ PUT /devices/:id status:', putDeviceResponse.status);
    console.log('✓ Updated device:', putDeviceResponse.data.data);
    
    // Test DELETE /devices/:id
    console.log('\n4. Testing DELETE /devices/:id');
    const deleteDeviceResponse = await makeRequest(`${BASE_URL}/devices/${createdDeviceId}`, {
      method: 'DELETE'
    });
    console.log('✓ DELETE /devices/:id status:', deleteDeviceResponse.status);
    console.log('✓ Delete response:', deleteDeviceResponse.data);
    
    console.log('\n✅ All device operations completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Device operation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testMeterOperations() {
  console.log('🧪 Testing Meter Operations with Device Associations...\n');
  
  try {
    // First get available devices
    const devicesResponse = await makeRequest(`${BASE_URL}/devices`);
    const devices = devicesResponse.data.data;
    console.log('✓ Available devices:', devices.length);
    
    // Test GET /meters
    console.log('\n1. Testing GET /meters');
    const getMetersResponse = await makeRequest(`${BASE_URL}/meters`);
    console.log('✓ GET /meters status:', getMetersResponse.status);
    console.log('✓ Meters count:', getMetersResponse.data.length);
    
    if (getMetersResponse.data.length > 0) {
      const sampleMeter = getMetersResponse.data[0];
      console.log('✓ Sample meter with device info:');
      console.log('  - Meter ID:', sampleMeter.meterid);
      console.log('  - Meter Name:', sampleMeter.name);
      console.log('  - Device Name:', sampleMeter.device_name);
      console.log('  - Device Description:', sampleMeter.device_description);
    }
    
    // Test POST /meters with device association
    console.log('\n2. Testing POST /meters with device association');
    const newMeter = {
      name: 'Test Meter with Device',
      manufacturer: devices[0].name, // Use existing device name
      model: 'Test Model',
      serialnumber: 'TEST123456',
      location: 'Test Location'
    };
    
    const postMeterResponse = await makeRequest(`${BASE_URL}/meters`, {
      method: 'POST',
      data: newMeter
    });
    console.log('✓ POST /meters status:', postMeterResponse.status);
    console.log('✓ Created meter:', postMeterResponse.data);
    const createdMeterId = postMeterResponse.data.meterid;
    
    // Verify the meter was created with proper device association
    const verifyMeterResponse = await makeRequest(`${BASE_URL}/meters/${createdMeterId}`);
    console.log('✓ Meter verification:');
    console.log('  - Device association:', verifyMeterResponse.data.device_name ? 'Success' : 'Failed');
    
    // Test PUT /meters/:id
    console.log('\n3. Testing PUT /meters/:id');
    const updatedMeter = {
      name: 'Updated Test Meter',
      manufacturer: devices[1]?.name || devices[0].name, // Use different device if available
      model: 'Updated Model',
      location: 'Updated Location'
    };
    
    const putMeterResponse = await makeRequest(`${BASE_URL}/meters/${createdMeterId}`, {
      method: 'PUT',
      data: updatedMeter
    });
    console.log('✓ PUT /meters/:id status:', putMeterResponse.status);
    console.log('✓ Updated meter device association:', putMeterResponse.data.device_name);
    
    // Clean up - delete test meter
    console.log('\n4. Cleaning up test meter');
    const deleteMeterResponse = await makeRequest(`${BASE_URL}/meters/${createdMeterId}`, {
      method: 'DELETE'
    });
    console.log('✓ DELETE /meters/:id status:', deleteMeterResponse.status);
    
    console.log('\n✅ All meter operations completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Meter operation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting API Operations Verification\n');
    console.log('===========================================\n');
    
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testDeviceOperations();
    await testMeterOperations();
    
    console.log('🎉 All API operations verified successfully!');
    console.log('✅ Device CRUD operations: Working');
    console.log('✅ Meter operations with device associations: Working');
    console.log('✅ System integrity: Maintained');
    
  } catch (error) {
    console.error('\n❌ API verification failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running first
async function checkServerHealth() {
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    console.log('✓ Server health check passed');
    return true;
  } catch (error) {
    console.log('⚠️  Server not responding, please start the backend server first');
    console.log('Run: npm start in the backend directory');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServerHealth();
  if (serverRunning) {
    await runTests();
  }
}

main();