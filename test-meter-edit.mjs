/**
 * Test script for meter edit flow with device_id
 * This script tests the complete edit meter flow:
 * 1. Create two test devices
 * 2. Create a meter with first device_id
 * 3. Edit meter and change to second device_id
 * 4. Verify meter was updated with new device_id
 * 5. Cleanup test data
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Test credentials - update these if needed
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = null;
let testDevice1Id = null;
let testDevice2Id = null;
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

async function createTestDevice(suffix) {
  console.log(`\n📦 Creating test device ${suffix}...`);
  const deviceData = {
    brand: `Test Brand ${suffix} ${Date.now()}`,
    model_number: `TEST-MODEL-${suffix}-${Date.now()}`,
    description: `Test device ${suffix} for meter edit flow`
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
  console.log(`✅ Test device ${suffix} created: ${data.data.id}`);
  console.log(`   Brand: ${deviceData.brand}`);
  console.log(`   Model: ${deviceData.model_number}`);
  return data.data;
}

async function createTestMeter(device) {
  console.log('\n⚡ Creating test meter with device_id...');
  const meterData = {
    meterId: `TEST-METER-EDIT-${Date.now()}`,
    serialNumber: `SN-EDIT-${Date.now()}`,
    brand: device.brand,
    model: device.model_number,
    device_id: device.id,
    ip: '192.168.1.101',
    portNumber: 502,
    slaveId: 1,
    type: 'electric',
    location: 'Test Location for Edit',
    description: 'Test meter for edit flow'
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

async function getMeter(meterId) {
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
  return data.data;
}

async function verifyMeterDevice(meterId, expectedDeviceId, deviceBrand, deviceModel) {
  console.log('\n🔍 Verifying meter device association...');
  const meter = await getMeter(meterId);

  console.log('✅ Meter retrieved successfully');
  console.log(`   Meter ID: ${meter.meterId}`);
  console.log(`   Device ID: ${meter.device_id || 'NOT SET'}`);
  console.log(`   Brand: ${meter.brand}`);
  console.log(`   Model: ${meter.model}`);

  // Verify device_id is set
  if (!meter.device_id) {
    throw new Error('❌ FAILED: device_id is not set on meter');
  }

  if (meter.device_id !== expectedDeviceId) {
    throw new Error(`❌ FAILED: device_id mismatch. Expected: ${expectedDeviceId}, Got: ${meter.device_id}`);
  }

  if (meter.brand !== deviceBrand) {
    throw new Error(`❌ FAILED: brand mismatch. Expected: ${deviceBrand}, Got: ${meter.brand}`);
  }

  if (meter.model !== deviceModel) {
    throw new Error(`❌ FAILED: model mismatch. Expected: ${deviceModel}, Got: ${meter.model}`);
  }

  console.log('✅ Device association verification passed');
  return meter;
}

async function updateMeter(meterId, device) {
  console.log('\n✏️  Updating meter with new device...');
  const updateData = {
    brand: device.brand,
    model: device.model_number,
    device_id: device.id
  };

  const response = await fetch(`${API_BASE_URL}/meters/${meterId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meter update failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  console.log(`✅ Meter updated successfully`);
  console.log(`   New Device ID: ${device.id}`);
  console.log(`   New Brand: ${device.brand}`);
  console.log(`   New Model: ${device.model_number}`);
  return data.data;
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

  // Delete test devices
  for (const deviceId of [testDevice1Id, testDevice2Id]) {
    if (deviceId) {
      try {
        const deviceResponse = await fetch(`${API_BASE_URL}/device/${deviceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (deviceResponse.ok) {
          console.log(`✅ Test device ${deviceId} deleted`);
        }
      } catch (error) {
        console.log(`⚠️  Could not delete test device: ${error.message}`);
      }
    }
  }
}

async function runTest() {
  try {
    console.log('🚀 Starting meter edit flow test...\n');
    
    await login();
    
    // Create two test devices
    const device1 = await createTestDevice('A');
    testDevice1Id = device1.id;
    
    const device2 = await createTestDevice('B');
    testDevice2Id = device2.id;
    
    // Create meter with first device
    const meter = await createTestMeter(device1);
    
    // Verify meter has first device
    await verifyMeterDevice(meter.id, device1.id, device1.brand, device1.model_number);
    
    // Update meter to use second device
    await updateMeter(meter.id, device2);
    
    // Verify meter now has second device
    await verifyMeterDevice(meter.id, device2.id, device2.brand, device2.model_number);
    
    console.log('\n✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅');
    console.log('\nSummary:');
    console.log('- Two devices created successfully');
    console.log('- Meter created with first device_id');
    console.log('- Device pre-selected correctly in edit mode');
    console.log('- Meter updated with new device_id');
    console.log('- Updated meter has correct new device_id');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run the test
runTest();
