// Minimal mapper to align PG readings to frontend's expected fields,
// then fill any remaining fields with nulls for robust rendering.
const expectedFields = [
  'timestamp','deviceIP','ip','port','meterId','energy','voltage','kWh','kW','V','A','dPF','dPFchannel','quality','slaveId','source','current','power','frequency','powerFactor','phaseAVoltage','phaseBVoltage','phaseCVoltage','phaseACurrent','phaseBCurrent','phaseCCurrent','phaseAPower','phaseBPower','phaseCPower','lineToLineVoltageAB','lineToLineVoltageBC','lineToLineVoltageCA','totalActivePower','totalReactivePower','totalApparentPower','totalActiveEnergyWh','totalReactiveEnergyVARh','totalApparentEnergyVAh','frequencyHz','temperatureC','humidity','neutralCurrent','phaseAPowerFactor','phaseBPowerFactor','phaseCPowerFactor','voltageThd','currentThd','maxDemandKW','maxDemandKVAR','maxDemandKVA','voltageUnbalance','currentUnbalance','communicationStatus','deviceModel','firmwareVersion','serialNumber','alarmStatus'
];

function toFrontendReading(pg) {
  const unit = (pg.unit_of_measurement || '').toLowerCase();
  // Quality mapping: prefer data_quality if present, fallback from status
  const quality = pg.data_quality || (pg.status === 'active' ? 'good' : 'estimated');

  const base = {
    // Core identifiers/time
    id: pg.id,
    meterId: pg.meterid,
  // Prefer explicit reading_date; fall back to createdat or timestamp (if present from legacy imports)
  timestamp: pg.reading_date || pg.createdat || pg.timestamp || null,

    // Connection/device meta
    ip: pg.ip ?? null,
  deviceIP: (pg.device_ip ?? pg.deviceip ?? null),
  port: pg.port ?? null,
  slaveId: (pg.slave_id ?? pg.slaveid ?? null),
  source: pg.source ?? null,

    // Shorthand UI metrics (direct columns if present)
    V: pg.v ?? null,
    A: pg.a ?? null,
    dPF: pg.dpf ?? null,
    dPFchannel: pg.dpfchannel ?? null,
    kW: pg.kw ?? null,
    kWpeak: pg.kwpeak ?? null,
    kWh: pg.kwh ?? (unit === 'kwh' ? Number(pg.final_value) : null),
    kVAh: pg.kvah ?? (unit === 'kvah' ? Number(pg.final_value) : null),
    kVARh: pg.kvarh ?? (unit === 'kvarh' ? Number(pg.final_value) : null),

    // Modbus-like rich metrics
    energy: pg.energy ?? null,
    voltage: pg.voltage ?? null,
    current: pg.current ?? null,
    power: pg.power ?? null,
    frequency: pg.frequency ?? null,
  powerFactor: (pg.power_factor ?? pg.powerfactor ?? null),

    // Phase and line metrics
  phaseAVoltage: (pg.phase_a_voltage ?? pg.phaseavoltage ?? null),
  phaseBVoltage: (pg.phase_b_voltage ?? pg.phasebvoltage ?? null),
  phaseCVoltage: (pg.phase_c_voltage ?? pg.phasecvoltage ?? null),
  phaseACurrent: (pg.phase_a_current ?? pg.phaseacurrent ?? null),
  phaseBCurrent: (pg.phase_b_current ?? pg.phasebcurrent ?? null),
  phaseCCurrent: (pg.phase_c_current ?? pg.phaseccurrent ?? null),
  phaseAPower: (pg.phase_a_power ?? pg.phaseapower ?? null),
  phaseBPower: (pg.phase_b_power ?? pg.phasebpower ?? null),
  phaseCPower: (pg.phase_c_power ?? pg.phasecpower ?? null),
    lineToLineVoltageAB: pg.line_to_line_voltage_ab ?? null,
    lineToLineVoltageBC: pg.line_to_line_voltage_bc ?? null,
    lineToLineVoltageCA: pg.line_to_line_voltage_ca ?? null,

    // Totals/energies
    totalActivePower: pg.total_active_power ?? null,
    totalReactivePower: pg.total_reactive_power ?? null,
    totalApparentPower: pg.total_apparent_power ?? null,
    totalActiveEnergyWh: pg.total_active_energy_wh ?? (unit === 'wh' ? Number(pg.final_value) : null),
    totalReactiveEnergyVARh: pg.total_reactive_energy_varh ?? null,
    totalApparentEnergyVAh: pg.total_apparent_energy_vah ?? null,

    // Environment/other
    frequencyHz: pg.frequency_hz ?? null,
    temperatureC: pg.temperature_c ?? null,
    humidity: pg.humidity ?? null,
    neutralCurrent: pg.neutral_current ?? null,
    phaseAPowerFactor: pg.phase_a_power_factor ?? null,
    phaseBPowerFactor: pg.phase_b_power_factor ?? null,
    phaseCPowerFactor: pg.phase_c_power_factor ?? null,
    voltageThd: pg.voltage_thd ?? null,
    currentThd: pg.current_thd ?? null,
    maxDemandKW: pg.max_demand_kw ?? null,
    maxDemandKVAR: pg.max_demand_kvar ?? null,
    maxDemandKVA: pg.max_demand_kva ?? null,
    voltageUnbalance: pg.voltage_unbalance ?? null,
    currentUnbalance: pg.current_unbalance ?? null,
    communicationStatus: pg.communication_status ?? null,
    deviceModel: pg.device_model ?? null,
    firmwareVersion: pg.firmware_version ?? null,
    serialNumber: pg.serial_number ?? null,
    alarmStatus: pg.alarm_status ?? null,

    // Quality for UI (fallback to legacy 'quality' column)
    quality: quality || pg.quality || null
  };

  // Ensure all expected fields exist so the UI doesn't break
  expectedFields.forEach((key) => {
    if (!(key in base)) base[key] = null;
  });
  return base;
}
const express = require('express');
const { query, validationResult } = require('express-validator');
const MeterReading = require('../models/MeterReadingPG');
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all meter readings with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('meterId').optional().isString(),
  query('quality').optional().isIn(['good', 'estimated', 'questionable'])
], requirePermission('meter:read'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      pageSize = 20,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      meterId
    } = req.query;

    const numericPage = parseInt(page);
    const numericPageSize = parseInt(pageSize);
    const skip = (numericPage - 1) * numericPageSize;

    // Map filters to PG
    const filters = {
      meterid: meterId || undefined
    };

    const all = await MeterReading.findAll(filters);

    const sortKeyMap = {
      timestamp: 'createdat',
      meterId: 'meterid',
      meterid: 'meterid',
      value: 'final_value'
    };
    const key = sortKeyMap[sortBy] || 'createdat';
    const sorted = all.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va == null && vb == null) return 0;
      if (va == null) return sortOrder === 'desc' ? 1 : -1;
      if (vb == null) return sortOrder === 'desc' ? -1 : 1;
      if (va < vb) return sortOrder === 'desc' ? 1 : -1;
      if (va > vb) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    const total = sorted.length;
    const pageItems = sorted.slice(skip, skip + numericPageSize).map(toFrontendReading);

    res.json({
      success: true,
      data: {
        items: pageItems,
        total,
        page: numericPage,
        pageSize: numericPageSize,
        totalPages: Math.ceil(total / numericPageSize) || 1,
        hasMore: skip + pageItems.length < total
      }
    });
  } catch (error) {
    console.error('Get meter readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings',
      ...(process.env.NODE_ENV !== 'production' ? { error: String(error && error.message || error) } : {})
    });
  }
});

// Get recent readings for dashboard (chronological order)
router.get('/recent', requirePermission('meter:read'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const items = await MeterReading.findAll({ limit: parseInt(limit) });
    // Items are ordered DESC by reading_date in model; ensure recency
    const sorted = items.sort((a, b) => {
      const ta = new Date(a.reading_date || a.createdat || 0).getTime();
      const tb = new Date(b.reading_date || b.createdat || 0).getTime();
      return tb - ta;
    });
    res.json({ success: true, data: sorted.map(toFrontendReading) });
  } catch (error) {
    console.error('Get recent readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent readings'
    });
  }
});

// Get latest readings for dashboard (per meter)
router.get('/latest', requirePermission('meter:read'), async (req, res) => {
  try {
    // Latest per meter using DISTINCT ON
    const sql = `
      SELECT DISTINCT ON (meterid) *
      FROM meterreadings
      WHERE (status IS NULL OR status = 'active')
      ORDER BY meterid, createdat DESC
      LIMIT 10
    `;
    const result = await db.query(sql);
    // Sort by reading_date desc for nicer display
    const rows = result.rows.sort((a, b) => (new Date(b.reading_date || b.createdat) - new Date(a.reading_date || a.createdat)));
    res.json({ success: true, data: rows.map(toFrontendReading) });
  } catch (error) {
    console.error('Get latest readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest readings',
      ...(process.env.NODE_ENV !== 'production' ? { error: String(error && error.message || error) } : {})
    });
  }
});

// Get meter reading by ID
router.get('/:id', requirePermission('meter:read'), async (req, res, next) => {
  try {
    // Allow subpaths like /meter/:meterId and /stats/summary to bypass
    if (req.params.id === 'meter' || req.params.id === 'stats' || req.params.id === 'latest' || req.params.id === 'recent') {
      return next();
    }
    const reading = await MeterReading.findById(req.params.id);
    
    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Meter reading not found'
      });
    }

    res.json({
      success: true,
      data: toFrontendReading(reading)
    });
  } catch (error) {
    console.error('Get meter reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter reading'
    });
  }
});

// Get readings by meter ID
router.get('/meter/:meterId', [
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], requirePermission('meter:read'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { meterId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    const options = {
      limit: parseInt(limit),
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined
    };

    const readings = await MeterReading.findByMeterId(meterId, options);

    res.json({ success: true, data: readings.map(toFrontendReading) });
  } catch (error) {
    console.error('Get meter readings by meter ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings'
    });
  }
});

// Get meter statistics
router.get('/stats/summary', requirePermission('meter:read'), async (req, res) => {
  try {
    // Compute stats from PG schema; prefer shorthand columns when present, fallback to unit-based aggregation
    const sql = `
      SELECT 
        COUNT(*)::int AS total_readings,
        COUNT(DISTINCT meterid)::int AS unique_meters,
        COALESCE(SUM(kwh), 0)::float AS total_kwh,
        COALESCE(SUM(kvah), 0)::float AS total_kvah,
        COALESCE(SUM(kvarh), 0)::float AS total_kvarh
      FROM meterreadings
      WHERE (status IS NULL OR status = 'active')
    `;
    const result = await db.query(sql);
    const row = result.rows[0] || {};

    const data = {
      totalReadings: Number(row.total_readings || 0),
      totalKWh: Number(row.total_kwh || 0),
      totalKVAh: Number(row.total_kvah || 0),
      totalKVARh: Number(row.total_kvarh || 0),
      avgPowerFactor: 0,
      avgVoltage: 0,
      avgCurrent: 0,
      maxKWpeak: 0,
      uniqueMeters: Number(row.unique_meters || 0)
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get meter stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter statistics',
      ...(process.env.NODE_ENV !== 'production' ? { error: String(error && error.message || error) } : {})
    });
  }
});

module.exports = router;