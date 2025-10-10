const mongoose = require('mongoose');

const meterConfigSchema = new mongoose.Schema({
  readingInterval: {
    type: Number,
    default: 15,
    min: [1, 'Reading interval must be at least 1 minute']
  },
  units: {
    type: String,
    required: [true, 'Units are required'],
    trim: true
  },
  multiplier: {
    type: Number,
    default: 1,
    min: [0.001, 'Multiplier must be positive']
  },
  registers: [{
    type: Number
  }],
  communicationProtocol: {
    type: String,
    enum: ['Modbus TCP', 'Modbus RTU', 'BACnet', 'Pulse', 'AMR', 'Other'],
    default: 'Modbus TCP'
  },
  baudRate: {
    type: Number,
    default: 9600
  },
  slaveId: {
    type: Number,
    default: 1,
    min: [1, 'Slave ID must be between 1 and 247'],
    max: [247, 'Slave ID must be between 1 and 247']
  },
  ipAddress: {
    type: String,
    trim: true
  },
  port: {
    type: Number,
    default: 502
  }
});

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

const meterSchema = new mongoose.Schema({
  meterId: {
    type: String,
    required: [true, 'Meter ID is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Meter ID cannot exceed 50 characters']
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
  ip: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Please enter a valid IP address']
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true,
    maxlength: [100, 'Serial number cannot exceed 100 characters']
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
  type: {
    type: String,
    enum: ['electric', 'gas', 'water', 'steam', 'other'],
    default: 'electric'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
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
    default: () => ({
      readingInterval: 15,
      units: 'kWh',
      multiplier: 1,
      registers: [5, 6, 7],
      communicationProtocol: 'Modbus TCP',
      port: 502,
      slaveId: 1
    })
  },
  lastReading: {
    type: meterReadingSchema
  },
  installDate: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Install date cannot be in the future'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual properties
meterSchema.virtual('connectionString').get(function() {
  return `${this.ip}:${this.portNumber}`;
});

meterSchema.virtual('fullIdentifier').get(function() {
  return `${this.meterId} (${this.brand} ${this.model})`;
});

// Indexes for better query performance
meterSchema.index({ meterId: 1 });
meterSchema.index({ ip: 1 });
meterSchema.index({ brand: 1, model: 1 });
meterSchema.index({ status: 1 });
meterSchema.index({ type: 1 });
meterSchema.index({ buildingId: 1 });
meterSchema.index({ equipmentId: 1 });
meterSchema.index({ serialNumber: 1 });

// Compound unique index to prevent duplicate IP:port combinations
meterSchema.index({ ip: 1, portNumber: 1 }, { 
  unique: true,
  partialFilterExpression: { 
    ip: { $type: "string" },
    portNumber: { $type: "number" }
  }
});

// Pre-save middleware
meterSchema.pre('save', function(next) {
  // Validate IP and port combination uniqueness
  if (this.isModified('ip') || this.isModified('portNumber')) {
    const connectionExists = this.constructor.findOne({
      _id: { $ne: this._id },
      ip: this.ip,
      portNumber: this.portNumber
    });
    
    connectionExists.then(existing => {
      if (existing) {
        const error = new Error('IP and port combination already exists');
        error.code = 'DUPLICATE_CONNECTION';
        return next(error);
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Pre-save middleware to update building and equipment names
meterSchema.pre('save', async function(next) {
  try {
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
  } catch (error) {
    console.error('Error updating meter references:', error);
  }
  next();
});

module.exports = mongoose.model('Meter', meterSchema);