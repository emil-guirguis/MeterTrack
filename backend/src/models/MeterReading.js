const mongoose = require('mongoose');

const meterReadingSchema = new mongoose.Schema({
  meterId: {
    type: String,
    required: [true, 'Meter ID is required'],
    trim: true,
    index: true
  },
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
  timestamps: true
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
meterReadingSchema.index({ quality: 1 });

module.exports = mongoose.model('MeterReading', meterReadingSchema);