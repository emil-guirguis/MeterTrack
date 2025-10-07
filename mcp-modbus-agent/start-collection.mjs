#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Modbus MCP Agent with automatic data collection...');

// Start the MCP server process
const mcpProcess = spawn('node', [join(__dirname, 'dist', 'index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    AUTO_START_COLLECTION: 'true',
    NODE_ENV: 'production'
  }
});

mcpProcess.stdout.on('data', (data) => {
  console.log(`[MCP] ${data.toString().trim()}`);
});

mcpProcess.stderr.on('data', (data) => {
  console.error(`[MCP ERROR] ${data.toString().trim()}`);
});

mcpProcess.on('close', (code) => {
  console.log(`MCP process exited with code ${code}`);
  process.exit(code);
});

mcpProcess.on('error', (error) => {
  console.error('Failed to start MCP process:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP agent...');
  mcpProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down MCP agent...');
  mcpProcess.kill('SIGTERM');
});

console.log('📡 MCP Agent started. Press Ctrl+C to stop.');