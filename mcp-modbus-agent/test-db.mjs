#!/usr/bin/env node

// Test MCP agent's MongoDB connectivity
import { config as dotenvConfig } from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import path from 'path';

// Load backend/.env first, then local .env (override)
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const agentDir = __dirname;
  const rootDir = path.resolve(agentDir, '..');
  const backendEnv = path.join(rootDir, 'backend', '.env');
  const agentEnv = path.join(agentDir, '.env');

  dotenvConfig({ path: backendEnv });
  dotenvConfig({ path: agentEnv, override: true });
} catch {
  dotenvConfig();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = (process.env.MONGODB_DB || 'meterdb');
  const collection = (process.env.MONGODB_COLLECTION || 'meterreadings');

  if (!uri) {
    console.error('❌ MONGODB_URI not set. Please set it in backend/.env or mcp-modbus-agent/.env');
    process.exit(1);
  }

  console.log('🔌 Testing MongoDB connection...');
  console.log(`URI: ${uri.replace(/:\/\/[\w-]+:[^@]+@/, '://****:****@')}`);
  console.log(`DB: ${dbName}, Collection: ${collection}`);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    const start = Date.now();
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    const elapsed = Date.now() - start;

    // Try a lightweight read on target DB/collection
    const count = await client.db(dbName).collection(collection).countDocuments({}, { limit: 1 });

    console.log(`✅ Connected and ping successful in ${elapsed} ms`);
    console.log(`📄 Collection '${collection}' exists: ${count >= 0}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err?.message || err);
    process.exitCode = 2;
  } finally {
    await client.close().catch(() => {});
  }
}

main();