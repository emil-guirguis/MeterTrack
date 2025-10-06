#!/usr/bin/env node

// Non-blocking development script for MCP Modbus Agent
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Starting MCP Modbus Agent in non-blocking mode...\n');

// Start TypeScript compiler in watch mode
console.log('📦 Starting TypeScript compiler in watch mode...');
const tscWatch = spawn('npx', ['tsc', '--watch'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

tscWatch.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Found 0 errors')) {
    console.log('✅ TypeScript compilation successful');
    
    // Start MCP server in background
    console.log('🚀 Starting MCP Server in background...');
    startMCPServer();
  } else if (output.includes('error')) {
    console.log('❌ TypeScript compilation error:', output.trim());
  }
});

function startMCPServer() {
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  let startupComplete = false;

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('🖥️  MCP Server:', output.trim());
    
    if (output.includes('MCP Server started') && !startupComplete) {
      startupComplete = true;
      console.log('\n✅ MCP Server is running in background');
      console.log('💡 You can now continue with other development tasks');
      console.log('🔄 Changes to TypeScript files will automatically restart the server');
      console.log('🛑 Press Ctrl+C to stop both compiler and server\n');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.log('⚠️  MCP Server Error:', data.toString().trim());
  });

  // Don't let the server process block shutdown
  serverProcess.unref();
  
  return serverProcess;
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development environment...');
  tscWatch.kill('SIGTERM');
  process.exit(0);
});

console.log('⌚ Waiting for TypeScript compilation...');
console.log('💡 This process will not block - you can continue working\n');