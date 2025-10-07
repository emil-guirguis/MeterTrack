#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildAndStart() {
  try {
    console.log('🔨 Building TypeScript...');
    
    // Change to the MCP agent directory
    process.chdir(__dirname);
    
    // Build the TypeScript
    const { stdout: buildOutput, stderr: buildError } = await execAsync('npm run build');
    
    if (buildError) {
      console.error('Build warnings/errors:', buildError);
    }
    
    console.log('✅ Build completed');
    if (buildOutput) {
      console.log(buildOutput);
    }
    
    console.log('🚀 Starting MCP agent with data collection...');
    
    // Start the collection script
    const { spawn } = await import('child_process');
    const startProcess = spawn('node', ['start-collection.mjs'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    startProcess.on('error', (error) => {
      console.error('Failed to start MCP agent:', error);
      process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping MCP agent...');
      startProcess.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

buildAndStart();