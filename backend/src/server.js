const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const buildingRoutes = require('./routes/buildings');
const equipmentRoutes = require('./routes/equipment');
const contactRoutes = require('./routes/contacts');
const meterRoutes = require('./routes/meters');
const meterReadingRoutes = require('./routes/meterReadings-test');
const templateRoutes = require('./routes/templates');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const modbusRoutes = require('./routes/modbus');

const app = express();
const PORT = process.env.PORT || 3001;

// Mongo connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb';
const MONGODB_DBNAME = process.env.MONGODB_DBNAME; // optional override

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
(async () => {
  try {
    const connectOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Only set dbName if provided; connection string may already include it
      ...(MONGODB_DBNAME ? { dbName: MONGODB_DBNAME } : {}),
    };

    await mongoose.connect(MONGODB_URI, connectOptions);

    const db = mongoose.connection;
    const activeDbName = db.name;
    const hosts = db.hosts?.map(h => `${h.host}:${h.port}`).join(', ') || db.host;

    console.log(`✅ Connected to MongoDB -> db: ${activeDbName} host(s): ${hosts}`);
  } catch (error) {
    // Avoid leaking credentials in logs
    const safeUri = MONGODB_URI.replace(/:\\?[^@/]+@/, '://***@');
    console.error('❌ MongoDB connection error. URI:', safeUri);
    console.error(error);
    process.exit(1);
  }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/meter-readings', meterReadingRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/modbus', modbusRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test endpoint to check database contents
app.get('/api/test/db-status', async (req, res) => {
  try {
    const User = require('./models/User');
    const MeterReading = require('./models/MeterReading');
    
    const userCount = await User.countDocuments();
    const meterReadingCount = await MeterReading.countDocuments();
    const sampleUser = await User.findOne({}, { email: 1, name: 1, role: 1 });
    const sampleReading = await MeterReading.findOne({}, { meterId: 1, kWh: 1, timestamp: 1 });
    
    res.json({
      success: true,
      database: mongoose.connection.db.databaseName,
      collections: {
        users: userCount,
        meterReadings: meterReadingCount
      },
      samples: {
        user: sampleUser,
        meterReading: sampleReading
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to create a test user
app.post('/api/test/create-user', async (req, res) => {
  try {
    const User = require('./models/User');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'admin@example.com' });
    if (existingUser) {
      return res.json({
        success: true,
        message: 'User already exists',
        user: { email: existingUser.email, name: existingUser.name, role: existingUser.role }
      });
    }
    
    // Create test user
    const user = new User({
      email: 'admin@example.com',
      name: 'Test Administrator',
      password: 'admin123', // Will be hashed by the model
      role: 'admin',
      permissions: [
        'user:create', 'user:read', 'user:update', 'user:delete',
        'building:create', 'building:read', 'building:update', 'building:delete',
        'equipment:create', 'equipment:read', 'equipment:update', 'equipment:delete',
        'contact:create', 'contact:read', 'contact:update', 'contact:delete',
        'meter:create', 'meter:read', 'meter:update', 'meter:delete',
        'settings:read', 'settings:update',
        'template:create', 'template:read', 'template:update', 'template:delete'
      ],
      status: 'active'
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Test user created successfully',
      user: { email: user.email, name: user.name, role: user.role },
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(error.keyPattern)[0]
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});