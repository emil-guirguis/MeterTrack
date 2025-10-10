// Diagnostic for /api/meterreadings/latest endpoint logic
require('dotenv').config();
const db = require('../src/config/database');

function toFrontendReading(pg) {
  const unit = (pg.unit_of_measurement || '').toLowerCase();
  const quality = pg.data_quality || (pg.status === 'active' ? 'good' : 'estimated');
  const base = {
    id: pg.id,
    meterId: pg.meterid,
    timestamp: pg.reading_date,
    ip: pg.ip ?? null,
    deviceIP: pg.device_ip ?? null,
    port: pg.port ?? null,
    slaveId: pg.slave_id ?? null,
    source: pg.source ?? null,
    V: pg.v ?? null,
    A: pg.a ?? null,
    dPF: pg.dpf ?? null,
    dPFchannel: pg.dpfchannel ?? null,
    kW: pg.kw ?? null,
    kWpeak: pg.kwpeak ?? null,
    kWh: pg.kwh ?? (unit === 'kwh' ? Number(pg.final_value) : null),
    kVAh: pg.kvah ?? (unit === 'kvah' ? Number(pg.final_value) : null),
    kVARh: pg.kvarh ?? (unit === 'kvarh' ? Number(pg.final_value) : null),
    energy: pg.energy ?? null,
    voltage: pg.voltage ?? null,
    current: pg.current ?? null,
    power: pg.power ?? null,
    frequency: pg.frequency ?? null,
    powerFactor: pg.power_factor ?? null,
    phaseAVoltage: pg.phase_a_voltage ?? null,
    phaseBVoltage: pg.phase_b_voltage ?? null,
    phaseCVoltage: pg.phase_c_voltage ?? null,
    phaseACurrent: pg.phase_a_current ?? null,
    phaseBCurrent: pg.phase_b_current ?? null,
    phaseCCurrent: pg.phase_c_current ?? null,
    phaseAPower: pg.phase_a_power ?? null,
    phaseBPower: pg.phase_b_power ?? null,
    phaseCPower: pg.phase_c_power ?? null,
    lineToLineVoltageAB: pg.line_to_line_voltage_ab ?? null,
    lineToLineVoltageBC: pg.line_to_line_voltage_bc ?? null,
    lineToLineVoltageCA: pg.line_to_line_voltage_ca ?? null,
    totalActivePower: pg.total_active_power ?? null,
    totalReactivePower: pg.total_reactive_power ?? null,
    totalApparentPower: pg.total_apparent_power ?? null,
    totalActiveEnergyWh: pg.total_active_energy_wh ?? (unit === 'wh' ? Number(pg.final_value) : null),
    totalReactiveEnergyVARh: pg.total_reactive_energy_varh ?? null,
    totalApparentEnergyVAh: pg.total_apparent_energy_vah ?? null,
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
    quality
  };
  return base;
}

async function run() {
  const sql = `
    SELECT DISTINCT ON (meterid) *
    FROM meterreadings
    WHERE (status IS NULL OR status = 'active')
    ORDER BY meterid, createdat DESC
    LIMIT 10
  `;
  try {
    await db.connect();
    const result = await db.query(sql);
  const rows = result.rows.sort((a, b) => (new Date(b.reading_date || b.createdat) - new Date(a.reading_date || a.createdat)));
    const mapped = rows.map(toFrontendReading);
    console.log('Latest rows:', mapped);
  } catch (e) {
    console.error('Latest SQL FAILED:', e.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

run();
