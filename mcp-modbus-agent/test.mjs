#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🔧 Testing MCP Modbus Agent...\n');

// Create a test .env file
const testEnv = `
MODBUS_IP=10.10.10.11
MODBUS_PORT=502
MODBUS_SLAVE_ID=1
MODBUS_TIMEOUT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/meterdb
MONGODB_COLLECTION=meterreadings
COLLECTION_INTERVAL=30000
AUTO_START_COLLECTION=false
LOG_LEVEL=info
MCP_SERVER_NAME=modbus-meter-agent
MCP_SERVER_VERSION=1.0.0
`;

writeFileSync('.env', testEnv);
console.log('✅ Created test .env file');

try {
  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');

  // Test compilation
  console.log('🔍 Type checking...');
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ Type checking passed');

  console.log('\n🎉 MCP Modbus Agent is ready!');
  console.log('\nTo start the server:');
  console.log('  npm start');
  console.log('\nTo test connections:');
  console.log('  Use an MCP client to call the "test_connections" tool');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}