/**
 * Test configuration loading
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// When running from dist, we need to go up more levels
const rootEnvPath = join(__dirname, '../../../../.env');
const localEnvPath = join(__dirname, '../../.env');

console.log('Loading env from:', rootEnvPath);
const rootResult = dotenv.config({ path: rootEnvPath });
if (rootResult.error) {
  console.log('Root .env error:', rootResult.error.message);
}

console.log('Loading env from:', localEnvPath);
const localResult = dotenv.config({ path: localEnvPath });
if (localResult.error) {
  console.log('Local .env error:', localResult.error.message);
}

console.log('\n=== Database Configuration ===\n');

console.log('Local Database (Sync):');
console.log('  Host:', process.env.POSTGRES_SYNC_HOST);
console.log('  Port:', process.env.POSTGRES_SYNC_PORT);
console.log('  Database:', process.env.POSTGRES_SYNC_DB);
console.log('  User:', process.env.POSTGRES_SYNC_USER);
console.log('  Password:', process.env.POSTGRES_SYNC_PASSWORD ? '***' : 'NOT SET');

console.log('\nRemote Database (Client):');
console.log('  Host:', process.env.POSTGRES_CLIENT_HOST);
console.log('  Port:', process.env.POSTGRES_CLIENT_PORT);
console.log('  Database:', process.env.POSTGRES_CLIENT_DB);
console.log('  User:', process.env.POSTGRES_CLIENT_USER);
console.log('  Password:', process.env.POSTGRES_CLIENT_PASSWORD ? '***' : 'NOT SET');

console.log('\nConnection Pool Settings:');
console.log('  Max Connections:', process.env.DB_POOL_MAX || '10 (default)');
console.log('  Idle Timeout:', process.env.DB_POOL_IDLE_TIMEOUT_MS || '30000 (default)');
console.log('  Connection Timeout:', process.env.DB_CONNECTION_TIMEOUT_MS || '5000 (default)');
console.log('  Max Connection Retries:', process.env.MAX_CONNECTION_RETRIES || '5 (default)');
