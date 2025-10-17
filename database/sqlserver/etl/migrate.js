#!/usr/bin/env node
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import sql from 'mssql';

const cfg = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
  mongoDb: process.env.MONGO_DB || 'meterdb',
  sqlServer: process.env.SQL_SERVER || 'localhost',
  sqlDb: process.env.SQL_DATABASE || 'meterdb',
  sqlUser: process.env.SQL_USER,
  sqlPassword: process.env.SQL_PASSWORD,
  sqlTrust: (process.env.SQL_TRUST_CERT || 'true').toLowerCase() === 'true',
  batchSize: parseInt(process.env.BATCH_SIZE || '500', 10)
};

function log(...args) { console.log(new Date().toISOString(), ...args); }

function mapBoolean(b) { if (b === undefined || b === null) return null; return b ? 1 : 0; }

// Mapping helpers per collection
function mapLocation(doc) {
  const a = doc.address || {};
  const c = doc.contactInfo || {};
  return {
    mongo_id: String(doc._id || ''),
    name: doc.name || null,
    address_street: a.street || null,
    address_city: a.city || null,
    address_state: a.state || null,
    address_zip_code: a.zipCode || null,
    address_country: a.country || null,
    contact_primarycontact: c.primaryContact || null,
    contact_email: c.email || null,
    contact_phone: c.phone || null,
    contact_website: c.website || null,
    type: doc.type || null,
    status: doc.status || null,
    totalfloors: doc.totalFloors ?? null,
    totalunits: doc.totalUnits ?? null,
    yearbuilt: doc.yearBuilt ?? null,
    squarefootage: doc.squareFootage ?? null,
    description: doc.description || null,
    notes: doc.notes || null,
    equipmentcount: doc.equipmentCount ?? 0,
    metercount: doc.meterCount ?? 0,
  };
}

function mapEquipment(doc) {
  return {
    mongo_id: String(doc._id || ''),
    name: doc.name || null,
    type: doc.type || null,
    locationid: doc.locationId ? null : null, // optional: resolve to SQL guid if available
    locationname: doc.locationName || null,
    specifications: doc.specifications ? JSON.stringify(doc.specifications) : null,
    status: doc.status || null,
    installdate: doc.installDate || null,
    lastmaintenance: doc.lastMaintenance || null,
    nextmaintenance: doc.nextMaintenance || null,
    serialnumber: doc.serialNumber || null,
    manufacturer: doc.manufacturer || null,
    model: doc.model || null,
    location: doc.location || null,
    notes: doc.notes || null,
  };
}

function mapMeter(doc) {
  const cfg = doc.configuration || {};
  const last = doc.lastReading || {};
  return {
    mongo_id: String(doc._id || ''),
    serialnumber: doc.serialNumber || null,
    type: doc.type || null,
    locationid: doc.locationId ? null : null,
    locationname: doc.locationName || null,
    equipmentid: doc.equipmentId ? null : null,
    equipmentname: doc.equipmentName || null,
    config_readinginterval: cfg.readingInterval ?? null,
    config_units: cfg.units || null,
    config_multiplier: cfg.multiplier ?? 1,
    config_registers: cfg.registers ? JSON.stringify(cfg.registers) : null,
    config_communicationprotocol: cfg.communicationProtocol || null,
    config_baudrate: cfg.baudRate ?? null,
    config_slaveid: cfg.slaveId ?? null,
    config_ipaddress: cfg.ipAddress || null,
    config_port: cfg.port ?? null,
    lastreading_value: last.value ?? null,
    lastreading_timestamp: last.timestamp || null,
    lastreading_unit: last.unit || null,
    lastreading_quality: last.quality || null,
    status: doc.status || null,
    installdate: doc.installDate || null,
    manufacturer: doc.manufacturer || null,
    model: doc.model || null,
    location: doc.location || null,
    notes: doc.notes || null,
  };
}

function mapContact(doc) {
  const a = doc.address || {};
  return {
    mongo_id: String(doc._id || ''),
    type: doc.type || null,
    name: doc.name || null,
    contactperson: doc.contactPerson || null,
    email: doc.email || null,
    phone: doc.phone || null,
    address_street: a.street || null,
    address_city: a.city || null,
    address_state: a.state || null,
    address_zip_code: a.zipCode || null,
    address_country: a.country || null,
    status: doc.status || null,
    businesstype: doc.businessType || null,
    industry: doc.industry || null,
    website: doc.website || null,
    notes: doc.notes || null,
    tags: doc.tags ? JSON.stringify(doc.tags) : null,
  };
}

function mapUser(doc) {
  return {
    mongo_id: String(doc._id || ''),
    email: doc.email || null,
    name: doc.name || null,
    passwordhash: doc.password || null,
    role: doc.role || null,
    permissions: doc.permissions ? JSON.stringify(doc.permissions) : null,
    status: doc.status || null,
    lastlogin: doc.lastLogin || null,
  };
}

function mapCompanySettings(doc) {
  const a = doc.address || {};
  const ci = doc.contactInfo || {};
  const b = doc.branding || {};
  const sc = doc.systemConfig || {};
  return {
    mongo_id: String(doc._id || ''),
    name: doc.name || null,
    logo: doc.logo || null,
    address_street: a.street || null,
    address_city: a.city || null,
    address_state: a.state || null,
    address_zip_code: a.zipCode || null,
    address_country: a.country || null,
    contact_phone: ci.phone || null,
    contact_email: ci.email || null,
    contact_website: ci.website || null,
    branding_primarycolor: b.primaryColor || '#2563eb',
    branding_secondarycolor: b.secondaryColor || '#64748b',
    branding_accentcolor: b.accentColor || '#f59e0b',
    branding_logourl: b.logoUrl || null,
    branding_faviconurl: b.faviconUrl || null,
    branding_customcss: b.customCSS || null,
    branding_emailsignature: b.emailSignature || null,
    cfg_timezone: sc.timezone || 'America/New_York',
    cfg_dateformat: sc.dateFormat || 'MM/DD/YYYY',
    cfg_timeformat: sc.timeFormat || '12h',
    cfg_currency: sc.currency || 'USD',
    cfg_language: sc.language || 'en',
    cfg_defaultpagesize: sc.defaultPageSize ?? 20,
    cfg_sessiontimeout: sc.sessionTimeout ?? 30,
    cfg_enablenotifications: mapBoolean(sc.enableNotifications),
    cfg_enableemailalerts: mapBoolean(sc.enableEmailAlerts),
    cfg_enablesmsalerts: mapBoolean(sc.enableSMSAlerts),
    cfg_maintenancemode: mapBoolean(sc.maintenanceMode),
    cfg_allowuserregistration: mapBoolean(sc.allowUserRegistration),
    cfg_requireemailverification: mapBoolean(sc.requireEmailVerification),
    passwordpolicy: sc.passwordPolicy ? JSON.stringify(sc.passwordPolicy) : null,
    backupsettings: sc.backupSettings ? JSON.stringify(sc.backupSettings) : null,
    features: doc.features ? JSON.stringify(doc.features) : null,
    integrations: doc.integrations ? JSON.stringify(doc.integrations) : null,
  };
}

function mapMeterData(doc) {
  return {
    mongo_id: String(doc._id || ''),
    meterid: doc.meterid || doc.meterId || null,
    ip: doc.ip || null,
    port: doc.port ?? null,
    kvarh: doc.kVARh ?? null,
    kvah: doc.kVAh ?? null,
    a: doc.A ?? null,
    kwh: doc.kWh ?? null,
    dpf: doc.dPF ?? null,
    dpfchannel: doc.dPFchannel ?? null,
    v: doc.V ?? null,
    kw: doc.kW ?? null,
    kwpeak: doc.kWpeak ?? null,
  };
}

function mapMeterReading(doc) {
  // Use the expectedFields list from API; map generically by presence
  const out = { mongo_id: String(doc._id || '') };
  const fields = [
    'timestamp','deviceIP','ip','port','meterId','energy','voltage','kWh','kW','V','A','dPF','dPFchannel','quality','slaveId','source','current','power','frequency','powerFactor','phaseAVoltage','phaseBVoltage','phaseCVoltage','phaseACurrent','phaseBCurrent','phaseCCurrent','phaseAPower','phaseBPower','phaseCPower','lineToLineVoltageAB','lineToLineVoltageBC','lineToLineVoltageCA','totalActivePower','totalReactivePower','totalApparentPower','totalActiveEnergyWh','totalReactiveEnergyVARh','totalApparentEnergyVAh','frequencyHz','temperatureC','humidity','neutralCurrent','phaseAPowerFactor','phaseBPowerFactor','phaseCPowerFactor','voltageThd','currentThd','maxDemandKW','maxDemandKVAR','maxDemandKVA','voltageUnbalance','currentUnbalance','communicationStatus','deviceModel','firmwareVersion','serialNumber','alarmStatus','rawBasic','rawExtended'
  ];
  for (const f of fields) {
    out[f] = doc[f] ?? null;
  }
  return out;
}

const collections = [
  { name: 'locations', mongo: 'locations', table: 'dbo.locations', map: mapLocation, cols: Object.keys(mapLocation({address:{},contactInfo:{},name:''})) },
  { name: 'equipment', mongo: 'equipment', table: 'dbo.equipment', map: mapEquipment },
  { name: 'meters', mongo: 'meters', table: 'dbo.meters', map: mapMeter },
  { name: 'contacts', mongo: 'contacts', table: 'dbo.contacts', map: mapContact },
  { name: 'users', mongo: 'users', table: 'dbo.users', map: mapUser },
  { name: 'companysettings', mongo: 'companysettings', table: 'dbo.companysettings', map: mapCompanySettings },
  { name: 'meterdata', mongo: 'meterreadings', table: 'dbo.meterdata', map: mapMeterData },
  { name: 'meterreadings', mongo: 'meterreadings', table: 'dbo.meterreadings', map: mapMeterReading },
];

async function upsertBatch(pool, table, rows) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const request = new sql.Request(pool);
  const tvp = new sql.Table();
  // Let SQL Server infer by insert-select; build VALUES list
  const placeholders = rows.map((_, i) => `(@p${i})`).join(',');
  // Instead build a parameter per row as JSON, then OPENJSON into columns
  for (let i = 0; i < rows.length; i++) {
    request.input(`p${i}`, sql.NVarChar(sql.MAX), JSON.stringify(rows[i]));
  }
  const colsList = columns.map(c => `[${c}]`).join(',');
  const openjsonCols = columns.map(c => `[${c}] nvarchar(max) '$.${c}'`).join(',');
  const merge = `
    with src as (
      select ${colsList}
      from openjson (concat('[', string_agg(value, ',') within group (order by 1), ']')) with (${openjsonCols})
    )
    insert into ${table} (${colsList})
    select ${colsList} from src;
  `;
  // Fallback simpler per-row insert to maximize compatibility
  for (const row of rows) {
    const cols = Object.keys(row);
    const params = cols.map((_, idx) => `@v${idx}`).join(',');
    const req = new sql.Request(pool);
    cols.forEach((c, idx) => req.input(`v${idx}`, row[c]));
    await req.query(`insert into ${table} (${cols.map(c => `[${c}]`).join(',')}) values (${params})`);
  }
}

async function migrate() {
  log('starting migration');
  const mongo = new MongoClient(cfg.mongoUri);
  await mongo.connect();
  const mdb = mongo.db(cfg.mongoDb);

  const pool = await sql.connect({
    server: cfg.sqlServer,
    database: cfg.sqlDb,
    user: cfg.sqlUser,
    password: cfg.sqlPassword,
    options: { trustServerCertificate: cfg.sqlTrust, enableArithAbort: true, encrypt: false }
  });

  try {
    for (const c of collections) {
      log(`migrating ${c.name}`);
      const coll = mdb.collection(c.mongo);
      const cursor = coll.find({});
      let batch = [];
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const row = c.map(doc);
        batch.push(row);
        if (batch.length >= cfg.batchSize) {
          await upsertBatch(pool, c.table, batch);
          log(`inserted ${batch.length} rows into ${c.table}`);
          batch = [];
        }
      }
      if (batch.length) {
        await upsertBatch(pool, c.table, batch);
        log(`inserted ${batch.length} rows into ${c.table}`);
      }
    }
    log('migration complete');
  } finally {
    await pool.close();
    await mongo.close();
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });
