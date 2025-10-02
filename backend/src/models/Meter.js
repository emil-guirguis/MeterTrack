const mongoose = require('mongoose');

const meterConfigSchema = new mongoose.Schema({
  readingInterval: {
    type: Number,
    required: [true, 'Reading interval is required'],
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
    trim: true
  },
  baudRate: {
    type: Number
  },
  slaveId: {
    type: Number
  },
  ipAddress: {
    type: String,
    trim: true
  },
  port: {
    type: Number
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
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['electric', 'gas', 'water', 'steam', 'other'],
    required: [true, 'Meter type is required']
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
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  installDate: {
    type: Date,
    required: [true, 'Install date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Install date cannot be in the future'
    }
  },
  manufacturer: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [500, 'Location cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
meterSchema.index({ serialNumber: 1 });
meterSchema.index({ type: 1 });
meterSchema.index({ status: 1 });
meterSchema.index({ buildingId: 1 });
meterSchema.index({ equipmentId: 1 });

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