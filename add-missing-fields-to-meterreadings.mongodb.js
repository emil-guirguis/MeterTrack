// Backfill missing meter fields in meterdb.meterreadings
// Usage (examples):
//   mongosh "mongodb://127.0.0.1:27017/meterdb" add-missing-fields-to-meterreadings.mongodb.js
//   mongosh "mongodb+srv://<user>:<pass>@<cluster>/meterdb" add-missing-fields-to-meterreadings.mongodb.js

// Select database (no-op if already selected via connection string)
use('meterdb');

const coll = db.getCollection('meterreadings');

print('\n=== Adding missing fields to meterdb.meterreadings ===');

// Core fields we expect from the Modbus agent
const numericFields = [
  'voltage',
  'current',
  'power',
  'energy',
  'frequency',
  'powerFactor',
  'temperature', // optional but supported by reader/DB manager
  'slaveId'      // optional
];

const stringFields = [
  'quality',
  'source',
  'deviceIP',
  'meterId'
];

// Defaults
const defaults = {
  number: null,          // use null so charts/analytics can detect missing; change to 0 if you prefer
  quality: 'good',
  source: 'modbus',
  deviceIP: null,
  meterId: null
};

// 1) Copy deviceIP from legacy key `deviceIp` if present
const resDeviceIpCopy = coll.updateMany(
  { deviceIP: { $exists: false }, deviceIp: { $type: 'string' } },
  [{ $set: { deviceIP: '$deviceIp' } }]
);
print(`deviceIP copied from deviceIp: ${resDeviceIpCopy.modifiedCount}`);

// 2) Add numeric fields if missing
for (const f of numericFields) {
  const r = coll.updateMany(
    { [f]: { $exists: false } },
    { $set: { [f]: defaults.number } }
  );
  if (r.modifiedCount) print(`Added numeric field '${f}' to: ${r.modifiedCount} docs`);
}

// 3) Add string fields if missing (with sensible defaults)
for (const f of stringFields) {
  let def;
  if (f === 'quality') def = defaults.quality;
  else if (f === 'source') def = defaults.source;
  else if (f === 'deviceIP') def = defaults.deviceIP;
  else if (f === 'meterId') def = defaults.meterId;
  else def = null;

  const r = coll.updateMany(
    { [f]: { $exists: false } },
    { $set: { [f]: def } }
  );
  if (r.modifiedCount) print(`Added string field '${f}' to: ${r.modifiedCount} docs`);
}

// 4) Ensure createdAt/updatedAt exist. Prefer timestamp for updatedAt when available.
const resCreatedAt = coll.updateMany(
  { createdAt: { $exists: false } },
  [{ $set: { createdAt: '$timestamp' } }, { $set: { createdAt: { $ifNull: ['$createdAt', new Date()] } } }]
);
print(`createdAt backfilled: ${resCreatedAt.modifiedCount}`);

const resUpdatedAt = coll.updateMany(
  { updatedAt: { $exists: false } },
  [{ $set: { updatedAt: '$timestamp' } }, { $set: { updatedAt: { $ifNull: ['$updatedAt', new Date()] } } }]
);
print(`updatedAt backfilled: ${resUpdatedAt.modifiedCount}`);

// 5) Optional: seed defaults for quality/source when null (not only missing)
const resQualityNull = coll.updateMany(
  { $or: [{ quality: null }, { quality: '' }] },
  { $set: { quality: defaults.quality } }
);
if (resQualityNull.modifiedCount) print(`quality defaulted on null/empty: ${resQualityNull.modifiedCount}`);

const resSourceNull = coll.updateMany(
  { $or: [{ source: null }, { source: '' }] },
  { $set: { source: defaults.source } }
);
if (resSourceNull.modifiedCount) print(`source defaulted on null/empty: ${resSourceNull.modifiedCount}`);

// 6) Helpful indexes (match the agent)
try {
  coll.createIndex({ meterId: 1, timestamp: -1 }, { background: true });
  coll.createIndex({ timestamp: -1 }, { background: true });
  coll.createIndex({ deviceIP: 1 }, { background: true });
  print('Indexes ensured on meterId+timestamp, timestamp, deviceIP');
} catch (e) {
  print('Index creation warning: ' + e);
}

print('\n=== Completed backfilling missing fields on meterdb.meterreadings ===\n');
