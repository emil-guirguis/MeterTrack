const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    maxlength: [200, 'Equipment name cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Equipment type is required'],
    trim: true
  },
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: [true, 'Building assignment is required']
  },
  buildingName: {
    type: String,
    trim: true
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'offline'],
    default: 'operational'
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
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  },
  serialNumber: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
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
equipmentSchema.index({ name: 1 });
equipmentSchema.index({ type: 1 });
equipmentSchema.index({ status: 1 });
equipmentSchema.index({ buildingId: 1 });
equipmentSchema.index({ serialNumber: 1 });
equipmentSchema.index({ nextMaintenance: 1 });

// Pre-save middleware to update building name
equipmentSchema.pre('save', async function(next) {
  if (this.isModified('buildingId') && this.buildingId) {
    try {
      const Building = mongoose.model('Building');
      const building = await Building.findById(this.buildingId);
      if (building) {
        this.buildingName = building.name;
      }
    } catch (error) {
      console.error('Error updating building name:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);