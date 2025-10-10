#!/usr/bin/env node
// Backfill dynamic scan fields from logs into meterdb.meterreadings
// Derives fields like:
//   holding_0_1_hi, holding_0_1_lo, holding_0_1_u32, holding_0_1_beFloat, holding_0_1_leFloat
//   input_12_13_hi, ... (if input scans exist)
// Usage (PowerShell examples):
//   node scripts/backfill-from-scan-log.mjs
//   $env:SCAN_LOG_FILE='c:\\Projects\\facility-management-app\\mcp-modbus-agent\\logs\\combined.log'; node scripts/backfill-from-scan-log.mjs
//   $env:MONGODB_URI='mongodb://127.0.0.1:27017/meterdb'; node scripts/backfill-from-scan-log.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDefaultLogPath() {
  // repo/mcp-modbus-agent/scripts -> default logs at ../logs/combined.log
  const p = path.resolve(__dirname, '..', 'logs', 'combined.log');
  return p;
}

const LOG_FILE = process.env.SCAN_LOG_FILE || resolveDefaultLogPath();
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb';
const dbName = process.env.MONGODB_DB || 'meterdb';
const collectionName = process.env.MONGODB_COLLECTION || 'meterreadings';

console.log(`[scan-backfill] Log file: ${LOG_FILE}`);
console.log(`[scan-backfill] Mongo: ${uri} -> ${dbName}.${collectionName}`);

if (!fs.existsSync(LOG_FILE)) {
  console.error(`[scan-backfill] Log file not found: ${LOG_FILE}`);
  process.exit(1);
}

// Parse the log and collect unique field names
const raw = fs.readFileSync(LOG_FILE, 'utf-8');
const lines = raw.split(/\r?\n/);

const FIELD_KEYS = ['hi', 'lo', 'u32', 'beFloat', 'leFloat'];
const fields = new Set();

function sanitizePair(addrPair) {
  // "0-1" -> "0_1"; also strip spaces just in case
  return String(addrPair).trim().replace(/[^0-9]+/g, '_');
}

for (const line of lines) {
  const s = line.trim();
  if (!s) continue;
  // Handle JSON log lines of shape { level, message, samples: [...], ... }
  let obj;
  try {
    obj = JSON.parse(s);
  } catch {
    continue; // skip non-JSON lines
  }
  if (!obj || !obj.message || !Array.isArray(obj.samples)) continue;
  const msg = String(obj.message).toLowerCase();
  let prefix = null;
  if (msg.includes('scan decode (holding)')) prefix = 'holding';
  else if (msg.includes('scan decode (input)')) prefix = 'input';
  if (!prefix) continue;

  for (const sample of obj.samples) {
    if (!sample || typeof sample !== 'object') continue;
    const pair = sanitizePair(sample.addrPair ?? '');
    if (!pair) continue;
    for (const k of FIELD_KEYS) {
      if (k in sample) {
        const fieldName = `${prefix}_${pair}_${k}`; // e.g., holding_0_1_hi
        fields.add(fieldName);
      }
    }
  }
}

console.log(`[scan-backfill] Derived ${fields.size} unique fields from log`);
if (fields.size === 0) {
  console.warn('[scan-backfill] No fields found to backfill. Exiting.');
  process.exit(0);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(dbName);
  const coll = db.collection(collectionName);

  let totalModified = 0;
  for (const f of fields) {
    const r = await coll.updateMany({ [f]: { $exists: false } }, { $set: { [f]: null } });
    if (r.modifiedCount) {
      console.log(`[scan-backfill] Added '${f}' to ${r.modifiedCount} docs`);
      totalModified += r.modifiedCount;
    }
  }
  console.log(`[scan-backfill] Completed. Total field additions across docs: ${totalModified}`);
} catch (e) {
  console.error('[scan-backfill] Error:', e?.message || e);
  process.exitCode = 1;
} finally {
  await client.close();
}
