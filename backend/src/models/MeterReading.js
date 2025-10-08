const mongoose = require('mongoose');

const meterReadingSchema = new mongoose.Schema({
  meterId: {
    type: String,
    required: [true, 'Meter ID is required'],
    trim: true,
    index: true
  },
  deviceIP: {
    type: String,
    trim: true,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Please enter a valid IP address']
  },
  slaveId: {
    type: Number,
    min: [1, 'Slave ID must be at least 1']
  },
  source: {
    type: String,
    trim: true
  },
  // Additional optional fields captured by the agent
  rawBasic: { type: [Number] },
  rawExtended: { type: [Number] },
  voltage: { type: Number, min: [0, 'Voltage cannot be negative'] },
  current: { type: Number, min: [0, 'Current cannot be negative'] },
  power: { type: Number, min: [0, 'Power cannot be negative'] },
  energy: { type: Number, min: [0, 'Energy cannot be negative'] },
  frequency: { type: Number, min: [0, 'Frequency cannot be negative'] },
  powerFactor: { type: Number, min: [0, 'Power factor cannot be negative'], max: [1, 'Power factor cannot exceed 1'] },
  
  // Phase voltage measurements
  phaseAVoltage: { type: Number },
  phaseBVoltage: { type: Number },
  phaseCVoltage: { type: Number },
  
  // Phase current measurements
  phaseACurrent: { type: Number },
  phaseBCurrent: { type: Number },
  phaseCCurrent: { type: Number },
  
  // Phase power measurements
  phaseAPower: { type: Number },
  phaseBPower: { type: Number },
  phaseCPower: { type: Number },
  
  // Line-to-line voltage measurements
  lineToLineVoltageAB: { type: Number },
  lineToLineVoltageBC: { type: Number },
  lineToLineVoltageCA: { type: Number },
  
  // Power measurements
  totalActivePower: { type: Number },
  totalReactivePower: { type: Number },
  totalApparentPower: { type: Number },
  
  // Energy measurements
  totalActiveEnergyWh: { type: Number },
  totalReactiveEnergyVARh: { type: Number },
  totalApparentEnergyVAh: { type: Number },
  importActiveEnergyWh: { type: Number },
  exportActiveEnergyWh: { type: Number },
  importReactiveEnergyVARh: { type: Number },
  exportReactiveEnergyVARh: { type: Number },
  
  // Additional measurements
  frequencyHz: { type: Number },
  temperatureC: { type: Number },
  humidity: { type: Number },
  neutralCurrent: { type: Number },
  groundCurrent: { type: Number },
  
  // Power factor per phase
  phaseAPowerFactor: { type: Number, min: [0, 'Power factor cannot be negative'], max: [1, 'Power factor cannot exceed 1'] },
  phaseBPowerFactor: { type: Number, min: [0, 'Power factor cannot be negative'], max: [1, 'Power factor cannot exceed 1'] },
  phaseCPowerFactor: { type: Number, min: [0, 'Power factor cannot be negative'], max: [1, 'Power factor cannot exceed 1'] },
  
  // Total harmonic distortion
  voltageThd: { type: Number },
  currentThd: { type: Number },
  voltageThdPhaseA: { type: Number },
  voltageThdPhaseB: { type: Number },
  voltageThdPhaseC: { type: Number },
  currentThdPhaseA: { type: Number },
  currentThdPhaseB: { type: Number },
  currentThdPhaseC: { type: Number },
  
  // Individual harmonic measurements
  voltageHarmonic3: { type: Number },
  voltageHarmonic5: { type: Number },
  voltageHarmonic7: { type: Number },
  currentHarmonic3: { type: Number },
  currentHarmonic5: { type: Number },
  currentHarmonic7: { type: Number },
  
  // Demand measurements
  maxDemandKW: { type: Number },
  maxDemandKVAR: { type: Number },
  maxDemandKVA: { type: Number },
  currentDemandKW: { type: Number },
  currentDemandKVAR: { type: Number },
  currentDemandKVA: { type: Number },
  predictedDemandKW: { type: Number },
  
  // Advanced power quality measurements
  voltageUnbalance: { type: Number },
  currentUnbalance: { type: Number },
  voltageFlicker: { type: Number },
  frequencyDeviation: { type: Number },
  
  // Phase sequence and rotation
  phaseSequence: { type: String, enum: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'] },
  phaseRotation: { type: String, enum: ['positive', 'negative'] },
  
  // Power direction indicators
  powerDirection: { type: String, enum: ['import', 'export'] },
  reactiveDirection: { type: String, enum: ['inductive', 'capacitive'] },
  
  // Communication and status fields
  communicationStatus: { type: String, enum: ['ok', 'error', 'timeout', 'offline'] },
  lastCommunication: { type: Date },
  dataQuality: { type: String, enum: ['good', 'estimated', 'questionable', 'bad'] },
  
  // Register-specific Modbus data
  modbusRegister40001: { type: Number },
  modbusRegister40002: { type: Number },
  modbusRegister40003: { type: Number },
  modbusRegister40004: { type: Number },
  modbusRegister40005: { type: Number },
  
  // Device information
  deviceModel: { type: String },
  firmwareVersion: { type: String },
  serialNumber: { type: String },
  manufacturerCode: { type: Number },
  
  // Meter configuration
  currentTransformerRatio: { type: Number },
  voltageTransformerRatio: { type: Number },
  pulseConstant: { type: Number },
  
  // Time and synchronization
  deviceTime: { type: Date },
  syncStatus: { type: String, enum: ['synchronized', 'unsynchronized'] },
  timeSource: { type: String, enum: ['internal', 'ntp', 'gps'] },
  
  // Alarm and event information
  alarmStatus: { type: String, enum: ['active', 'inactive'] },
  eventCounter: { type: Number },
  lastEvent: { type: String },
  ip: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Please enter a valid IP address']
  },
  port: {
    type: Number,
    required: [true, 'Port is required'],
    min: [1, 'Port must be greater than 0'],
    max: [65535, 'Port must be less than 65536']
  },
  kVARh: {
    type: Number,
    required: [true, 'kVAR Hour Net is required'],
    min: [0, 'kVARh cannot be negative']
  },
  kVAh: {
    type: Number,
    required: [true, 'kVA Hour Net is required'],
    min: [0, 'kVAh cannot be negative']
  },
  A: {
    type: Number,
    required: [true, 'Current is required'],
    min: [0, 'Current cannot be negative']
  },
  kWh: {
    type: Number,
    required: [true, 'Watt-Hour Meter is required'],
    min: [0, 'kWh cannot be negative']
  },
  dPF: {
    type: Number,
    required: [true, 'Displacement Power Factor is required'],
    min: [0, 'Power factor cannot be negative'],
    max: [1, 'Power factor cannot exceed 1']
  },
  dPFchannel: {
    type: Number,
    required: [true, 'Displacement Power Factor Channel is required'],
    min: [1, 'Channel must be at least 1']
  },
  V: {
    type: Number,
    required: [true, 'Voltage is required'],
    min: [0, 'Voltage cannot be negative']
  },
  kW: {
    type: Number,
    required: [true, 'Watt Demand is required'],
    min: [0, 'kW cannot be negative']
  },
  kWpeak: {
    type: Number,
    required: [true, 'Demand kW Peak is required'],
    min: [0, 'kW peak cannot be negative']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  quality: {
    type: String,
    enum: ['good', 'estimated', 'questionable'],
    default: 'good'
  }
}, {
  timestamps: true,
  // Allow unknown Modbus fields to pass through without being stripped
  // This ensures any new fields the agent writes will be stored and returned
  strict: false
});

// Transform _id to id for frontend compatibility
meterReadingSchema.methods.toJSON = function () {
  const reading = this.toObject();
  
  // Transform _id to id for frontend compatibility
  if (reading._id) {
    reading.id = reading._id.toString();
    delete reading._id;
  }
  delete reading.__v;
  
  return reading;
};

// Indexes for better query performance
meterReadingSchema.index({ meterId: 1, timestamp: -1 });
meterReadingSchema.index({ ip: 1 });
meterReadingSchema.index({ deviceIP: 1 });
meterReadingSchema.index({ quality: 1 });

// Explicitly set collection name to ensure consistency (lowercase plural)
module.exports = mongoose.model('MeterReading', meterReadingSchema, 'meterreadings');