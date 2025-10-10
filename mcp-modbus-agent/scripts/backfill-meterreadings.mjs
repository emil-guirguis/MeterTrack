#!/usr/bin/env node
// Node script to add missing fields to meterdb.meterreadings using the official driver
// - Seeds core fields used by the agent
// - Optionally reads a Modbus field map (MODBUS_MAP_FILE) and adds those fields too
// Reads MONGODB_URI from environment or defaults to local.

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb';
const dbName = (process.env.MONGODB_DB || 'meterdb');
const collectionName = process.env.MONGODB_COLLECTION || 'meterreadings';

console.log(`Connecting to ${uri} ...`);
const client = new MongoClient(uri);

function resolveMapPath(p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Try relative to repo root (two levels up from scripts/)
  const candidate1 = path.resolve(__dirname, '..', p);
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.resolve(process.cwd(), p);
  if (fs.existsSync(candidate2)) return candidate2;
  return p; // fall back
}

try {
  await client.connect();
  const db = client.db(dbName);
  const coll = db.collection(collectionName);
  console.log(`Connected. Operating on ${dbName}.${collectionName}`);

  // Copy deviceIp -> deviceIP if missing
  const r1 = await coll.updateMany(
    { deviceIP: { $exists: false }, deviceIp: { $type: 'string' } },
    [{ $set: { deviceIP: '$deviceIp' } }]
  );
  console.log(`deviceIP copied from deviceIp: ${r1.modifiedCount}`);

  // Numeric fields (core)
  const numericFields = new Set(['voltage','current','power','energy','frequency','powerFactor','temperature','slaveId']);

  // Extend with fields from modbus map (if provided)
  const mapFileRaw = process.env.MODBUS_MAP_FILE || '';
  const mapFile = resolveMapPath(mapFileRaw);
  if (mapFile && fs.existsSync(mapFile)) {
    try {
      const raw = fs.readFileSync(mapFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.fields)) {
        for (const f of parsed.fields) {
          if (f?.name && typeof f.name === 'string') {
            numericFields.add(f.name);
          }
        }
        console.log(`Loaded ${parsed.fields.length} mapped fields from ${mapFile}`);
      } else {
        console.warn(`Field map at ${mapFile} has no 'fields' array`);
      }
    } catch (e) {
      console.warn(`Failed to parse MODBUS_MAP_FILE (${mapFile}):`, e?.message || e);
    }
  } else if (mapFileRaw) {
    console.warn(`MODBUS_MAP_FILE provided but not found at ${mapFile}`);
  }

  for (const f of numericFields) {
    const r = await coll.updateMany(
      { [f]: { $exists: false } },
      { $set: { [f]: null } }
    );
    if (r.modifiedCount) console.log(`Added numeric field '${f}' to: ${r.modifiedCount} docs`);
  }

  // String fields with defaults
  const strDefaults = { quality: 'good', source: 'modbus', deviceIP: null, meterId: null };
  for (const f of Object.keys(strDefaults)) {
    const r = await coll.updateMany(
      { [f]: { $exists: false } },
      { $set: { [f]: strDefaults[f] } }
    );
    if (r.modifiedCount) console.log(`Added string field '${f}' to: ${r.modifiedCount} docs`);
  }

  // createdAt/updatedAt
  const rC = await coll.updateMany(
    { createdAt: { $exists: false } },
    [ { $set: { createdAt: '$timestamp' } }, { $set: { createdAt: { $ifNull: ['$createdAt', new Date()] } } } ]
  );
  console.log(`createdAt backfilled: ${rC.modifiedCount}`);

  const rU = await coll.updateMany(
    { updatedAt: { $exists: false } },
    [ { $set: { updatedAt: '$timestamp' } }, { $set: { updatedAt: { $ifNull: ['$updatedAt', new Date()] } } } ]
  );
  console.log(`updatedAt backfilled: ${rU.modifiedCount}`);

  // Defaults when null/empty
  const rq = await coll.updateMany(
    { $or: [{ quality: null }, { quality: '' }] },
    { $set: { quality: 'good' } }
  );
  if (rq.modifiedCount) console.log(`quality defaulted on null/empty: ${rq.modifiedCount}`);

  const rs = await coll.updateMany(
    { $or: [{ source: null }, { source: '' }] },
    { $set: { source: 'modbus' } }
  );
  if (rs.modifiedCount) console.log(`source defaulted on null/empty: ${rs.modifiedCount}`);

  // Indexes
  await coll.createIndex({ meterId: 1, timestamp: -1 }, { background: true });
  await coll.createIndex({ timestamp: -1 }, { background: true });
  await coll.createIndex({ deviceIP: 1 }, { background: true });
  console.log('Indexes ensured on meterId+timestamp, timestamp, deviceIP');

  console.log('Backfill completed successfully.');
} catch (e) {
  console.error('Backfill failed:', e);
  process.exitCode = 1;
} finally {
  await client.close();
}
