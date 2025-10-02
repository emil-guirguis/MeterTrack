const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'US',
    trim: true
  }
});

const contactInfoSchema = new mongoose.Schema({
  primaryContact: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  website: {
    type: String,
    trim: true
  }
});

const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Building name is required'],
    trim: true,
    maxlength: [200, 'Building name cannot exceed 200 characters']
  },
  address: {
    type: addressSchema,
    required: true
  },
  contactInfo: {
    type: contactInfoSchema,
    required: true
  },
  type: {
    type: String,
    enum: ['office', 'warehouse', 'retail', 'residential', 'industrial'],
    required: [true, 'Building type is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  totalFloors: {
    type: Number,
    min: [1, 'Total floors must be at least 1']
  },
  totalUnits: {
    type: Number,
    min: [0, 'Total units cannot be negative']
  },
  yearBuilt: {
    type: Number,
    min: [1800, 'Year built must be after 1800'],
    max: [new Date().getFullYear(), 'Year built cannot be in the future']
  },
  squareFootage: {
    type: Number,
    min: [1, 'Square footage must be positive']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  equipmentCount: {
    type: Number,
    default: 0,
    min: [0, 'Equipment count cannot be negative']
  },
  meterCount: {
    type: Number,
    default: 0,
    min: [0, 'Meter count cannot be negative']
  }
}, {
  timestamps: true
});

// Transform _id to id for frontend compatibility
buildingSchema.methods.toJSON = function () {
  const building = this.toObject();
  
  // Transform _id to id for frontend compatibility
  if (building._id) {
    building.id = building._id.toString();
    delete building._id;
  }
  delete building.__v;
  
  return building;
};

// Indexes for better query performance
buildingSchema.index({ name: 1 });
buildingSchema.index({ type: 1 });
buildingSchema.index({ status: 1 });
buildingSchema.index({ 'address.city': 1 });
buildingSchema.index({ 'address.state': 1 });

module.exports = mongoose.model('Building', buildingSchema);