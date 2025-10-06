#!/usr/bin/env node

// Simple MCP client tester for the Modbus Agent
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing MCP Modbus Agent...\n');

// Start the MCP server
const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
let testPassed = false;

// Collect server output
serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log('📤 Server output:', data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  console.log('⚠️  Server error:', data.toString().trim());
});

// Send a simple MCP request to list tools
setTimeout(() => {
  console.log('\n📨 Sending MCP request to list tools...');
  
  const listToolsRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  }) + '\n';
  
  serverProcess.stdin.write(listToolsRequest);
}, 2000);

// Handle server response
serverProcess.stdout.on('data', (data) => {
  const response = data.toString();
  if (response.includes('tools') && response.includes('start_data_collection')) {
    console.log('✅ MCP Server responded correctly with tools list');
    testPassed = true;
    
    // Test another request
    setTimeout(() => {
      console.log('\n📨 Testing connection test...');
      const testConnectionRequest = JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "test_connections",
          arguments: {}
        }
      }) + '\n';
      
      serverProcess.stdin.write(testConnectionRequest);
    }, 1000);
  }
  
  if (response.includes('Connection Test Results')) {
    console.log('✅ Connection test completed');
    
    // Clean shutdown
    setTimeout(() => {
      console.log('\n🏁 Test completed successfully');
      serverProcess.kill('SIGTERM');
    }, 1000);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  if (!testPassed) {
    console.log('⏰ Test timeout - server may not be responding to MCP requests');
  }
  serverProcess.kill('SIGTERM');
}, 10000);

serverProcess.on('exit', (code) => {
  if (testPassed) {
    console.log('\n🎉 MCP Agent test completed successfully!');
    console.log('💡 The agent is working correctly and ready for MCP clients');
  } else {
    console.log('\n❌ MCP Agent test failed or timed out');
  }
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping test...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});