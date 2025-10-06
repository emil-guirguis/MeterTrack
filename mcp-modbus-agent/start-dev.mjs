#!/usr/bin/env node

// Development startup script for MCP Modbus Agent
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Starting MCP Modbus Agent in development mode...\n');

// Check if dist directory exists
const distPath = join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.log('📦 Building project first...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Check environment
const envPath = join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found, using default configuration');
}

// Start the MCP agent
console.log('🚀 Starting MCP Server...');
console.log('📡 The server will wait for MCP client connections via stdio');
console.log('💡 This is normal behavior - the process should stay running');
console.log('🔄 Press Ctrl+C to stop the server\n');

// Add a delay to let user read the messages
setTimeout(() => {
  const child = spawn('node', ['dist/index.js'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: __dirname
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\n✅ MCP Server exited normally');
    } else {
      console.log(`\n❌ MCP Server exited with code ${code}`);
    }
  });

  child.on('error', (error) => {
    console.error('\n❌ Error starting MCP Server:', error.message);
    process.exit(1);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping MCP Server...');
    child.kill('SIGINT');
    process.exit(0);
  });
}, 2000); // 2 second delay