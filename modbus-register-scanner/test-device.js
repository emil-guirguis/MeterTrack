#!/usr/bin/env node

// Quick test script to scan the actual device at 10.10.10.11
const { spawn } = require('child_process');

console.log('🔍 Testing Modbus TCP/IP connection to 10.10.10.11...');
console.log('Using smart scan mode with focused register ranges');
console.log('');

// Run the scanner with smart scan mode and limited range for testing
const scanner = spawn('node', [
  'dist/index.js', 
  'scan',
  '--host', '10.10.10.11',
  '--port', '502',
  '--slave-id', '1',
  '--smart-scan',
  '--start-address', '0',
  '--end-address', '100',  // Test just first 100 addresses
  '--function-codes', '3,4', // Focus on holding and input registers
  '--timeout', '3000',
  '--retries', '2',
  '--no-batching',  // Use individual reads for better error reporting
  '--format', 'both'
], {
  stdio: 'inherit'
});

scanner.on('close', (code) => {
  console.log(`\nScanner process exited with code ${code}`);
  if (code === 0) {
    console.log('✅ Scan completed successfully!');
  } else {
    console.log('❌ Scan failed or was interrupted');
  }
});

scanner.on('error', (err) => {
  console.error('❌ Failed to start scanner:', err.message);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping test scan...');
  scanner.kill('SIGINT');
});