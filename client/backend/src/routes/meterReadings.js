const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const router = express.Router();
router.use(authenticateToken);

// Direct Modbus meter read (live) - temporarily disabled
// const modbusService = require('../services/modbusService');

// GET /api/meterreadings/direct - fetch live data from Modbus meter
router.get('/direct', requirePermission('meter:read'), async (req, res) => {
  try {
    const deviceIP = req.query.deviceIP || '10.10.10.11';
    const port = req.query.port ? parseInt(req.query.port) : 502;
    const slaveId = req.query.slaveId ? parseInt(req.query.slaveId) : 1;
    console.log(`[Modbus API] /direct called with deviceIP=${deviceIP}, port=${port}, slaveId=${slaveId}`);

    // const result = await modbusService.readMeterData(deviceIP, { port, slaveId });
    const result = { success: false, error: 'Modbus service temporarily disabled' };
    console.log(`[Modbus API] Result:`, result);
    if (!result.success) {
      console.error(`[Modbus API] Error:`, result.error);
      return res.status(500).json({ success: false, message: result.error || 'Failed to read meter', data: null });
    }
    res.json({ success: true, data: result.data, meta: { deviceIP, port, slaveId, timestamp: result.timestamp } });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('[Modbus API] Direct Modbus read error:', err);
    res.status(500).json({ success: false, message: err.message || 'Direct Modbus read failed', data: null });
  }
});
// Minimal mapper to align PG readings to frontend's expected fields,
// then fill any remaining fields with nulls for robust rendering.
const expectedFields = [
  'timestamp', 'deviceIP', 'ip', 'port', 'meterId', 'energy', 'voltage', 'kWh', 'kW', 'V', 'A', 'dPF', 'dPFchannel', 'quality', 'slaveId', 'source', 'current', 'power', 'frequency', 'powerFactor', 'phaseAVoltage', 'phaseBVoltage', 'phaseCVoltage', 'phaseACurrent', 'phaseBCurrent', 'phaseCCurrent', 'phaseAPower', 'phaseBPower', 'phaseCPower', 'lineToLineVoltageAB', 'lineToLineVoltageBC', 'lineToLineVoltageCA', 'totalActivePower', 'totalReactivePower', 'totalApparentPower', 'totalActiveEnergyWh', 'totalReactiveEnergyVARh', 'totalApparentEnergyVAh', 'frequencyHz', 'temperatureC', 'humidity', 'neutralCurrent', 'phaseAPowerFactor', 'phaseBPowerFactor', 'phaseCPowerFactor', 'voltageThd', 'currentThd', 'maxDemandKW', 'maxDemandKVAR', 'maxDemandKVA', 'voltageUnbalance', 'currentUnbalance', 'communicationStatus', 'deviceModel', 'firmwareVersion', 'serialNumber', 'alarmStatus'
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
const { query, validationResult } = require('express-validator');
const MeterReading = require('../models/MeterReadingsWithSchema');
const db = require('../config/database');

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

    // Validate tenant context is present
    // @ts-ignore - tenantId is dynamically set by schema initialization
    const userTenantId = req.user?.tenantId || req.user?.tenant_id;
    if (!userTenantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: tenant context required'
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

    // Map filters to PG, excluding undefined values
    const filters = {};
    if (meterId !== undefined && meterId !== '') {
      filters.meterid = meterId;
    }

    const result = await MeterReading.findAll({
      where: filters,
      tenantId: userTenantId,
      limit: numericPageSize,
      offset: skip
    });

    const all = result.rows || [];

    const sortKeyMap = {
      timestamp: 'createdat',
      meterId: 'meterid',
      meterid: 'meterid',
      value: 'final_value',
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      createdat: 'createdat',
      updatedat: 'updatedat'
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

    const total = result.pagination?.total || sorted.length;
    const pageItems = sorted.map(toFrontendReading);

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
    const err = /** @type {Error} */ (error);
    console.error('Get meter readings error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings',
      ...(process.env.NODE_ENV !== 'production' ? { error: String(err && err.message || err) } : {})
    });
  }
});

// Get recent readings for dashboard (chronological order)
router.get('/recent', requirePermission('meter:read'), async (req, res) => {
  try {
    // Validate tenant context is present
    // @ts-ignore - tenantId is dynamically set by schema initialization
    const userTenantId = req.user?.tenantId || req.user?.tenant_id;
    if (!userTenantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: tenant context required'
      });
    }

    const { limit = 20 } = req.query;
    const result = await MeterReading.findAll({ 
      limit: parseInt(limit),
      tenantId: userTenantId
    });
    const items = result.rows || [];
    // Items are ordered DESC by reading_date in model; ensure recency
    const sorted = items.sort((a, b) => {
      const aData = /** @type {any} */ (a);
      const bData = /** @type {any} */ (b);
      const ta = new Date(aData.reading_date || aData.createdat || 0).getTime();
      const tb = new Date(bData.reading_date || bData.createdat || 0).getTime();
      return tb - ta;
    });
    res.json({ success: true, data: sorted.map(toFrontendReading) });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Get recent readings error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent readings'
    });
  }
});

// Get latest readings for dashboard (per meter)
router.get('/latest', requirePermission('meter:read'), async (req, res) => {
  try {
    // Validate tenant context is present
    // @ts-ignore - tenantId is dynamically set by schema initialization
    const userTenantId = req.user?.tenantId || req.user?.tenant_id;
    if (!userTenantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: tenant context required'
      });
    }

    // Latest per meter using DISTINCT ON, filtered by tenant
    const sql = `
      SELECT DISTINCT ON (meter_id) *
      FROM meter_reading
      WHERE (status IS NULL OR status = 'active')
        AND tenant_id = $1
      ORDER BY meter_id, createdat DESC
      LIMIT 10
    `;
    const result = await db.query(sql, [userTenantId]);
    // Sort by reading_date desc for nicer display
    const rows = /** @type {any[]} */ (result.rows);
    const sorted = rows.sort((a, b) => (new Date(a.reading_date || a.createdat).getTime() - new Date(b.reading_date || b.createdat).getTime()));
    res.json({ success: true, data: sorted.map(toFrontendReading) });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Get latest readings error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest readings',
      ...(process.env.NODE_ENV !== 'production' ? { error: String(err && err.message || err) } : {})
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

    // Validate tenant context is present
    // @ts-ignore - tenantId is dynamically set by schema initialization
    const userTenantId = req.user?.tenantId || req.user?.tenant_id;
    if (!userTenantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: tenant context required'
      });
    }

    const reading = await MeterReading.findById(req.params.id);

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Meter reading not found'
      });
    }

    // Verify the reading belongs to the user's tenant
    // @ts-ignore - tenant_id is dynamically set from database
    if (reading.tenant_id !== userTenantId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: reading does not belong to your tenant'
      });
    }

    res.json({
      success: true,
      data: toFrontendReading(reading)
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Get meter reading error:', err);
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

    // Validate tenant context is present
    // @ts-ignore - tenantId is dynamically set by schema initialization
    const userTenantId = req.user?.tenantId || req.user?.tenant_id;
    if (!userTenantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: tenant context required'
      });
    }

    const { meterId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    const options = {
      limit: parseInt(limit),
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
      tenantId: userTenantId
    };

    // Use findAll with meterId filter instead of findByMeterId
    const result = await MeterReading.findAll({
      where: { meterid: meterId },
      tenantId: userTenantId,
      limit: parseInt(limit)
    });

    const readings = result.rows || [];

    res.json({ success: true, data: readings.map(toFrontendReading) });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Get meter readings by meter ID error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings'
    });
  }
});

// Get meter statistics
router.get('/stats/summary', requirePermission('meter:read'), async (req, res) => {
  try {
    // Validate tenant context is present
    // @ts-ignore - tenantId is dynamically set by schema initialization
    const userTenantId = req.user?.tenantId || req.user?.tenant_id;
    if (!userTenantId) {
      console.error('Missing tenant context:', { user: req.user });
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: tenant context required'
      });
    }

    // Compute stats from PG schema; prefer shorthand columns when present, fallback to unit-based aggregation
    // Filter by tenant_id to ensure data isolation
    const sql = `
      SELECT 
        COUNT(*)::int AS total_readings,
        COUNT(DISTINCT meter_id)::int AS unique_meters,
        COALESCE(SUM(kwh), 0)::float AS total_kwh,
        COALESCE(SUM(kvah), 0)::float AS total_kvah,
        COALESCE(SUM(kvarh), 0)::float AS total_kvarh
      FROM meter_reading
      WHERE (status IS NULL OR status = 'active')
        AND tenant_id = $1
    `;
    const result = await db.query(sql, [userTenantId]);
    const row = /** @type {any} */ (result.rows[0] || {});

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

    console.log('📊 Meter Statistics:', data);
    res.json({ success: true, data });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Get meter stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter statistics',
      ...(process.env.NODE_ENV !== 'production' ? { error: String(err && err.message || err) } : {})
    });
  }
});

module.exports = router;