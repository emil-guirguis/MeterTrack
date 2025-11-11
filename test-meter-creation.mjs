/**
 * Test script for meter creation flow with device_id
 * This script tests the complete create meter flow:
 * 1. Create a test device
 * 2. Create a meter with device_id
 * 3. Verify meter was created with correct device_id
 * 4. Cleanup test data
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Test credentials - update these if needed
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = null;
let testDeviceId = null;
let testMeterId = null;

async function login() {
  console.log('🔐 Logging in...');
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  authToken = data.data.token;
  console.log('✅ Login successful');
}

async function createTestDevice() {
  console.log('\n📦 Creating test device...');
  const deviceData = {
    manufacturer: `Test Manufacturer ${Date.now()}`,
    model_number: `TEST-MODEL-${Date.now()}`,
    description: 'Test device for meter creation flow'
  };

  const response = await fetch(`${API_BASE_URL}/device`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(deviceData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Device creation failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  testDeviceId = data.data.id;
  console.log(`✅ Test device created: ${testDeviceId}`);
  console.log(`   Manufacturer: ${deviceData.manufacturer}`);
  console.log(`   Model: ${deviceData.model_number}`);
  return data.data;
}

async function createTestMeter(device) {
  console.log('\n⚡ Creating test meter with device_id...');
  const meterData = {
    meterId: `TEST-METER-${Date.now()}`,
    serialNumber: `SN-${Date.now()}`,
    device: device.manufacturer,
    model: device.model_number,
    device_id: device.id,
    ip: '192.168.1.100',
    portNumber: 502,
    slaveId: 1,
    type: 'electric',
    location: 'Test Location',
    description: 'Test meter for device validation'
  };

  const response = await fetch(`${API_BASE_URL}/meters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(meterData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meter creation failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  testMeterId = data.data.id;
  console.log(`✅ Test meter created: ${testMeterId}`);
  console.log(`   Meter ID: ${meterData.meterId}`);
  console.log(`   Device ID: ${meterData.device_id}`);
  return data.data;
}

async function verifyMeter(meterId) {
  console.log('\n🔍 Verifying meter data...');
  const response = await fetch(`${API_BASE_URL}/meters/${meterId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Meter fetch failed: ${response.status}`);
  }

  const data = await response.json();
  const meter = data.data;

  console.log('✅ Meter retrieved successfully');
  console.log(`   Meter ID: ${meter.meterId}`);
  console.log(`   Device ID: ${meter.device_id || 'NOT SET'}`);
  console.log(`   Device: ${meter.device}`);
  console.log(`   Model: ${meter.model}`);

  // Verify device_id is set
  if (!meter.device_id) {
    throw new Error('❌ FAILED: device_id is not set on meter');
  }

  if (meter.device_id !== testDeviceId) {
    throw new Error(`❌ FAILED: device_id mismatch. Expected: ${testDeviceId}, Got: ${meter.device_id}`);
  }

  console.log('✅ Device ID verification passed');
  return meter;
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete test meter
  if (testMeterId) {
    try {
      const meterResponse = await fetch(`${API_BASE_URL}/meters/${testMeterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (meterResponse.ok) {
        console.log('✅ Test meter deleted');
      }
    } catch (error) {
      console.log(`⚠️  Could not delete test meter: ${error.message}`);
    }
  }

  // Delete test device
  if (testDeviceId) {
    try {
      const deviceResponse = await fetch(`${API_BASE_URL}/device/${testDeviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (deviceResponse.ok) {
        console.log('✅ Test device deleted');
      }
    } catch (error) {
      console.log(`⚠️  Could not delete test device: ${error.message}`);
    }
  }
}

async function runTest() {
  try {
    console.log('🚀 Starting meter creation flow test...\n');
    
    await login();
    const device = await createTestDevice();
    const meter = await createTestMeter(device);
    await verifyMeter(meter.id);
    
    console.log('\n✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅');
    console.log('\nSummary:');
    console.log('- Device created successfully');
    console.log('- Meter created with device_id');
    console.log('- Meter saved with correct device_id');
    console.log('- Meter displays correctly after creation');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run the test
runTest();
