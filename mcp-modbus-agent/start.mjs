#!/usr/bin/env node
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run the MCP server
exec(`node ${join(__dirname, 'dist', 'index.js')}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(`stdout: ${stdout}`);
});