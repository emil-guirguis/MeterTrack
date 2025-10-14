#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { config as dotenvConfig } from 'dotenv';
import ModbusRTU from 'modbus-serial';

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

const ip = process.env.MODBUS_IP || '10.10.10.11';
const port = parseInt(process.env.MODBUS_PORT || '502', 10);
const slaveId = parseInt(process.env.MODBUS_SLAVE_ID || '1', 10);
const timeout = parseInt(process.env.MODBUS_TIMEOUT || '5000', 10);

const SCAN_START = parseInt(process.env.SCAN_START || '0', 10);
const SCAN_COUNT = parseInt(process.env.SCAN_COUNT || '120', 10);
const CHUNK_SIZE = Math.min(parseInt(process.env.SCAN_CHUNK || '60', 10), 120);

// Known mapping from our live meter observations
const knownHolding = {
  5: { name: 'Voltage', abbr: 'V', scale: 200 },
  6: { name: 'Current', abbr: 'A', scale: 100 },
  7: { name: 'Active Power', abbr: 'W', scale: 1 },
  12: { name: 'Voltage (dup)', abbr: 'V', scale: 200 },
  15: { name: 'Current (dup)', abbr: 'A', scale: 100 },
  18: { name: 'Active Power (dup)', abbr: 'W', scale: 1 }
};

const knownInput = {
  // Add confirmed input registers here as discovered
};

function ensureLogsDir() {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  return logsDir;
}

async function readRange(client, fn, start, count) {
  // Pre-size with undefined to preserve absolute register addresses when chunks fail
  const out = new Array(count).fill(undefined);
  for (let offset = 0; offset < count; offset += CHUNK_SIZE) {
    const addr = start + offset;
    const c = Math.min(CHUNK_SIZE, count - offset);
    try {
      const res = fn === 'input'
        ? await client.readInputRegisters(addr, c)
        : await client.readHoldingRegisters(addr, c);
      for (let i = 0; i < c; i++) {
        out[offset + i] = res.data[i];
      }
    } catch (e) {
      // If the device rejects this block, leave these addresses as undefined
      // and continue scanning the rest of the range.
      for (let i = 0; i < c; i++) {
        out[offset + i] = undefined;
      }
    }
  }
  return out;
}

function toCsvRow(idx, space, raw, nameInfo) {
  let value = raw;
  let name = '';
  let abbr = '';
  if (nameInfo) {
    name = nameInfo.name;
    abbr = nameInfo.abbr || '';
    if (nameInfo.scale && nameInfo.scale > 1) {
      value = raw / nameInfo.scale;
    }
  }
  // If raw is undefined (failed read), emit empty raw/value
  const rawOut = raw === undefined ? '' : raw;
  const valOut = raw === undefined ? '' : value;
  return `${space},${idx},${name},${abbr},${rawOut},${valOut}`;
}

(async () => {
  const client = new ModbusRTU();
  try {
    await client.connectTCP(ip, { port });
    client.setID(slaveId);
    client.setTimeout(timeout);

    const holding = await readRange(client, 'holding', SCAN_START, SCAN_COUNT);
    let input = [];
    try { input = await readRange(client, 'input', SCAN_START, SCAN_COUNT); } catch {}

    const logsDir = ensureLogsDir();
    const outPath = path.join(logsDir, `registers-${ip.replace(/\./g, '_')}-${Date.now()}.csv`);

    const header = 'space,register,name,abbr,raw,value';
    const rows = [header];

    for (let i = 0; i < holding.length; i++) {
      const addr = SCAN_START + i;
      const info = knownHolding[addr];
      rows.push(toCsvRow(addr, 'holding', holding[i], info));
    }

    for (let i = 0; i < input.length; i++) {
      const addr = SCAN_START + i;
      const info = knownInput[addr];
      rows.push(toCsvRow(addr, 'input', input[i], info));
    }

    fs.writeFileSync(outPath, rows.join('\n'), 'utf8');

    console.log(`✅ CSV written: ${outPath}`);
  } catch (e) {
    console.error('❌ Failed to export CSV:', e?.message || e);
  } finally {
    try { client.close(); } catch {}
  }
})();
