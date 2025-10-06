#!/usr/bin/env node

// Standalone Modbus connectivity test using the agent's ModbusClient
// - Loads backend .env first, then local .env for overrides
// - Attempts TCP connection and a simple register read (address 0, count 1)
// - Optionally performs a full readMeterData() if the simple read succeeds

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { config as dotenvConfig } from 'dotenv';

// Load env from backend/.env then local .env
(() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const agentDir = thisDir; // we're in mcp-modbus-agent
    const rootDir = path.resolve(agentDir, '..');
    const backendEnv = path.join(rootDir, 'backend', '.env');
    const agentEnv = path.join(agentDir, '.env');

    dotenvConfig({ path: backendEnv });
    dotenvConfig({ path: agentEnv, override: true });
  } catch {
    dotenvConfig();
  }
})();

import { createLogger } from './dist/logger.js';
import { ModbusClient } from './dist/modbus-client.js';

// Ensure logs directory exists for file transports
try {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch {}

const logger = createLogger();

const modbusConfig = {
  ip: process.env.MODBUS_IP || '10.10.10.11',
  port: parseInt(process.env.MODBUS_PORT || '502', 10),
  slaveId: parseInt(process.env.MODBUS_SLAVE_ID || '1', 10),
  timeout: parseInt(process.env.MODBUS_TIMEOUT || '5000', 10),
};

console.log('🔌 Modbus Connectivity Test');
console.log(`Device: ${modbusConfig.ip}:${modbusConfig.port} (slaveId=${modbusConfig.slaveId}, timeout=${modbusConfig.timeout}ms)`);
logger.info('Modbus test starting', { device: `${modbusConfig.ip}:${modbusConfig.port}`, slaveId: modbusConfig.slaveId, timeout: modbusConfig.timeout });
// Log the actual Modbus settings used for this test
logger.info('Modbus settings', { ip: modbusConfig.ip, port: modbusConfig.port, slaveId: modbusConfig.slaveId, timeout: modbusConfig.timeout });

// Utility to time operations
const timed = async (label, fn) => {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    console.log(`✅ ${label} in ${ms} ms`);
    return result;
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`❌ ${label} failed in ${ms} ms:`, err?.message || err);
    throw err;
  }
};

// Add a hard cap timeout for connect phase to avoid hanging indefinitely
function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeout,
  ]);
}

const client = new ModbusClient(modbusConfig, logger);

client.on('connected', () => {
  console.log('📶 Connected event emitted');
  logger.info('Modbus test: connected');
});
client.on('error', (e) => {
  console.error('⚠️  Client error event:', e?.message || e);
  logger.error('Modbus test: client error', { error: e?.message || e });
});

(async () => {
  try {
    await timed('TCP connect + setup', () => withTimeout(client.connect(), 8000, 'connect'));

    const ok = await timed('Test register read (addr 0, count 1)', async () => {
      return await client.testConnection();
    });

    console.log(`Connection test result: ${ok ? 'SUCCESS' : 'FAILED'}`);
    logger.info('Modbus test: connection test result', { ok });

    if (ok) {
      try {
        const reading = await timed('Full meter data read', async () => client.readMeterData());
        if (reading) {
          console.log('📄 Sample reading:');
          console.log(JSON.stringify(reading, null, 2));
          // Log the retrieved data into the combined log file as a real device reading
          logger.info('Modbus reading', reading);
        }
      } catch (e) {
        console.warn('Full read failed (this can be normal if register map differs):', e?.message || e);
        logger.warn('Modbus test: full read failed', { error: e?.message || e });
      }
    }
  } catch (e) {
    // Already logged above
    logger.error('Modbus test failed', { error: e?.message || e });
  } finally {
    try { client.disconnect(); } catch {}
  }
})();
