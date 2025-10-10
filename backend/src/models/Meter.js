const mongoose = require('mongoose');

// Meter configuration sub-schema
const meterConfigSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Please enter a valid IP address']
  },
  portNumber: {
    type: Number,
    required: [true, 'Port number is required'],
    min: [1, 'Port number must be between 1 and 65535'],
    max: [65535, 'Port number must be between 1 and 65535'],
    default: 502
  },
  slaveId: {
    type: Number,
    default: 1,
    min: [1, 'Slave ID must be between 1 and 247'],
    max: [247, 'Slave ID must be between 1 and 247']
  },
  timeout: {
    type: Number,
    default: 5000,
    min: [1000, 'Timeout must be at least 1000ms']
  },
  readingInterval: {
    type: Number,
    default: 300, // 5 minutes
    min: [1, 'Reading interval must be at least 1 second']
  },
  registers: {
    voltage: { address: { type: Number, default: 5 }, scale: { type: Number, default: 200 } },
    current: { address: { type: Number, default: 6 }, scale: { type: Number, default: 100 } },
    power: { address: { type: Number, default: 7 }, scale: { type: Number, default: 1 } },
    frequency: { address: { type: Number, default: 0 }, scale: { type: Number, default: 10 } },
    powerFactor: { address: { type: Number, default: 9 }, scale: { type: Number, default: 1000 } }
  }
});

// Meter reading sub-schema
const meterReadingSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: [true, 'Reading value is required']
  },
  timestamp: {
    type: Date,
    required: [true, 'Reading timestamp is required']
  },
  unit: {
    type: String,
    required: [true, 'Reading unit is required'],
    trim: true
  },
  quality: {
    type: String,
    enum: ['good', 'estimated', 'questionable'],
    default: 'good'
  }
});

// Main meter schema
const meterSchema = new mongoose.Schema({
  meterId: {
    type: String,
    required: [true, 'Meter ID is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Meter ID cannot exceed 50 characters']
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true,
    maxlength: [100, 'Serial number cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['electric', 'gas', 'water', 'steam', 'other'],
    required: [true, 'Meter type is required']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [100, 'Brand cannot exceed 100 characters']
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    maxlength: [100, 'Model cannot exceed 100 characters']
  },
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building'
  },
  buildingName: {
    type: String,
    trim: true
  },
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  equipmentName: {
    type: String,
    trim: true
  },
  configuration: {
    type: meterConfigSchema,
    required: true
  },
  lastReading: {
    type: meterReadingSchema
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error'],
    default: 'active'
  },
  installationDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date <= new Date();
      },
      message: 'Installation date cannot be in the future'
    }
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  },
  location: {
    type: String,
    trim: true,
    maxlength: [500, 'Location cannot exceed 500 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for connection string
meterSchema.virtual('connectionString').get(function() {
  return `${this.configuration.ip}:${this.configuration.portNumber}`;
});

// Virtual for full meter identifier
meterSchema.virtual('fullIdentifier').get(function() {
  return `${this.brand} ${this.model} (${this.meterId})`;
});

// Indexes for better query performance
meterSchema.index({ meterId: 1 });
meterSchema.index({ serialNumber: 1 });
meterSchema.index({ type: 1 });
meterSchema.index({ status: 1 });
meterSchema.index({ buildingId: 1 });
meterSchema.index({ equipmentId: 1 });
meterSchema.index({ 'configuration.ip': 1 });

// Pre-save middleware
meterSchema.pre('save', async function(next) {
  try {
    // Update building and equipment names
    if (this.isModified('buildingId') && this.buildingId) {
      const Building = mongoose.model('Building');
      const building = await Building.findById(this.buildingId);
      if (building) {
        this.buildingName = building.name;
      }
    }
    
    if (this.isModified('equipmentId') && this.equipmentId) {
      const Equipment = mongoose.model('Equipment');
      const equipment = await Equipment.findById(this.equipmentId);
      if (equipment) {
        this.equipmentName = equipment.name;
      }
    }

    // Validate IP and port combination is unique
    if (this.isModified('configuration.ip') || this.isModified('configuration.portNumber')) {
      const Meter = mongoose.model('Meter');
      const existingMeter = await Meter.findOne({ 
        'configuration.ip': this.configuration.ip, 
        'configuration.portNumber': this.configuration.portNumber,
        _id: { $ne: this._id }
      });
      
      if (existingMeter) {
        const error = new Error('IP and port combination already exists');
        error.code = 'DUPLICATE_CONNECTION';
        return next(error);
      }
    }
  } catch (error) {
    console.error('Error in meter pre-save middleware:', error);
  }
  next();
});

module.exports = mongoose.model('Meter', meterSchema);