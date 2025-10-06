#!/usr/bin/env node

// Modbus scan: read ranges of input and holding registers to discover available data.
// Logs raw registers and basic decodes to logs/combined.log for analysis.

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { config as dotenvConfig } from 'dotenv';
import ModbusRTU from 'modbus-serial';
import { createLogger } from './dist/logger.js';

// Load env (backend first, then local overrides)
(() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const agentDir = thisDir;
    const rootDir = path.resolve(agentDir, '..');
    const backendEnv = path.join(rootDir, 'backend', '.env');
    const agentEnv = path.join(agentDir, '.env');
    dotenvConfig({ path: backendEnv });
    dotenvConfig({ path: agentEnv, override: true });
  } catch {
    dotenvConfig();
  }
})();

// Ensure logs directory exists
try {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
} catch {}

const logger = createLogger();

const ip = process.env.MODBUS_IP || '10.10.10.11';
const port = parseInt(process.env.MODBUS_PORT || '502', 10);
const slaveId = parseInt(process.env.MODBUS_SLAVE_ID || '1', 10);
const timeout = parseInt(process.env.MODBUS_TIMEOUT || '5000', 10);

// Scan config via env
const SCAN_START = parseInt(process.env.SCAN_START || '0', 10);
const SCAN_COUNT = parseInt(process.env.SCAN_COUNT || '120', 10); // total registers to read in each space
const CHUNK_SIZE = Math.min(parseInt(process.env.SCAN_CHUNK || '60', 10), 120); // device-dependent

logger.info('Modbus scan starting', { ip, port, slaveId, timeout, start: SCAN_START, count: SCAN_COUNT, chunk: CHUNK_SIZE });

function toFloat32BE(high, low) {
  const buf = Buffer.alloc(4);
  buf.writeUInt16BE(high, 0);
  buf.writeUInt16BE(low, 2);
  return buf.readFloatBE(0);
}

function toFloat32LE(high, low) {
  const buf = Buffer.alloc(4);
  buf.writeUInt16LE(high, 0);
  buf.writeUInt16LE(low, 2);
  return buf.readFloatLE(0);
}

function toUint32(high, low) {
  return (high << 16) + low;
}

async function readRange(client, fn, start, count) {
  const out = [];
  for (let offset = 0; offset < count; offset += CHUNK_SIZE) {
    const addr = start + offset;
    const c = Math.min(CHUNK_SIZE, count - offset);
    const res = fn === 'input' ? await client.readInputRegisters(addr, c) : await client.readHoldingRegisters(addr, c);
    out.push(...res.data);
  }
  return out;
}

(async () => {
  const client = new ModbusRTU();
  try {
    await client.connectTCP(ip, { port });
    client.setID(slaveId);
    client.setTimeout(timeout);
    logger.info('Scan: connected');

    // Read Input Registers (FC4)
    let inputRegs = [];
    try {
      inputRegs = await readRange(client, 'input', SCAN_START, SCAN_COUNT);
      logger.info('Scan: input registers read', { length: inputRegs.length });
    } catch (e) {
      logger.warn('Scan: input registers read failed', { error: e?.message || e });
    }

    // Read Holding Registers (FC3)
    let holdingRegs = [];
    try {
      holdingRegs = await readRange(client, 'holding', SCAN_START, SCAN_COUNT);
      logger.info('Scan: holding registers read', { length: holdingRegs.length });
    } catch (e) {
      logger.warn('Scan: holding registers read failed', { error: e?.message || e });
    }

    const summarize = (arr) => ({
      nonZeroCount: arr.filter(v => v !== 0).length,
      first20: arr.slice(0, 20),
    });

    logger.info('Scan summary', {
      input: summarize(inputRegs),
      holding: summarize(holdingRegs),
    });

    // Attempt decoding pairs as uint32 and float32 with both word orders for first 40 registers
    function decodePairs(arr, label) {
      const samples = [];
      for (let i = 0; i < Math.min(arr.length - 1, 40); i += 2) {
        const hi = arr[i];
        const lo = arr[i + 1];
        const beFloat = toFloat32BE(hi, lo);
        const leFloat = toFloat32LE(hi, lo);
        const u32 = toUint32(hi, lo);
        samples.push({ addrPair: `${SCAN_START + i}-${SCAN_START + i + 1}`, hi, lo, beFloat, leFloat, u32 });
      }
      logger.info(`Scan decode (${label})`, { samples });
    }

    if (inputRegs.length >= 2) decodePairs(inputRegs, 'input');
    if (holdingRegs.length >= 2) decodePairs(holdingRegs, 'holding');

    console.log('✅ Scan complete. Check logs/combined.log for details.');
  } catch (e) {
    logger.error('Scan failed', { error: e?.message || e });
    console.error('❌ Scan failed:', e?.message || e);
  } finally {
    try { client.close(); logger.info('Scan: disconnected'); } catch {}
  }
})();
