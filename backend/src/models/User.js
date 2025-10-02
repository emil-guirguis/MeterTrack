const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'technician', 'viewer'],
    default: 'viewer'
  },
  permissions: [{
    type: String,
    enum: [
      'user:create', 'user:read', 'user:update', 'user:delete',
      'building:create', 'building:read', 'building:update', 'building:delete',
      'equipment:create', 'equipment:read', 'equipment:update', 'equipment:delete',
      'contact:create', 'contact:read', 'contact:update', 'contact:delete',
      'meter:create', 'meter:read', 'meter:update', 'meter:delete',
      'settings:read', 'settings:update',
      'template:create', 'template:read', 'template:update', 'template:delete'
    ]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output and transform _id to id
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;

  // Transform _id to id for frontend compatibility
  if (user._id) {
    user.id = user._id.toString();
    delete user._id;
  }
  delete user.__v;

  return user;
};

module.exports = mongoose.model('User', userSchema);