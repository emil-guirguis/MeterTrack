const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import PostgreSQL database connection
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const buildingRoutes = require('./routes/buildings');
const equipmentRoutes = require('./routes/equipment');
const contactRoutes = require('./routes/contacts');
const meterRoutes = require('./routes/meters');
const meterReadingRoutes = require('./routes/meterReadings');
const templateRoutes = require('./routes/templates');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const modbusRoutes = require('./routes/modbus');
const directMeterRoutes = require('./routes/directMeter');
// const { router: threadingRoutes, initializeThreadingService } = require('./routes/threading');

const app = express();
const PORT = process.env.PORT || 3001;

// Threading service (will be initialized after PostgreSQL connection)
let threadingService = null;

// PostgreSQL connection will be handled by the database module
// Legacy MongoDB configuration (keeping for reference during transition)
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

// Connect to PostgreSQL and initialize threading service
(async () => {
  try {
    // Connect to PostgreSQL
    await db.connect();

    // Initialize threading service after successful database connection
    // await initializeThreadingSystem(); // TEMPORARILY DISABLED
    console.log('✅ Threading system disabled for debugging');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
})();

/**
 * Initialize the threading system
 */
async function initializeThreadingSystem() {
  try {
    console.log('🧵 Initializing MCP threading system...');
    
    // Import ThreadingService
    const { ThreadingService } = require('./services/threading/ThreadingService.js');
    
    // Create threading service with default configuration
    const threadingConfig = {
      worker: {
        maxMemoryMB: parseInt(process.env.WORKER_MAX_MEMORY_MB) || 512,
        logLevel: process.env.WORKER_LOG_LEVEL || 'info',
        moduleConfig: {
          modbus: {
            host: process.env.MODBUS_HOST || 'localhost',
            port: parseInt(process.env.MODBUS_PORT) || 502,
            timeout: parseInt(process.env.MODBUS_TIMEOUT) || 5000,
            retryAttempts: parseInt(process.env.MODBUS_RETRY_ATTEMPTS) || 3,
            retryDelay: parseInt(process.env.MODBUS_RETRY_DELAY) || 1000,
            unitId: parseInt(process.env.MODBUS_UNIT_ID) || 1,
            registers: {
              start: parseInt(process.env.MODBUS_REGISTER_START) || 0,
              count: parseInt(process.env.MODBUS_REGISTER_COUNT) || 10,
              interval: parseInt(process.env.MODBUS_COLLECTION_INTERVAL) || 5000
            }
          },
          database: {
            connectionString: MONGODB_URI,
            poolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
            timeout: parseInt(process.env.DB_TIMEOUT) || 10000,
            retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS) || 3,
            batchSize: parseInt(process.env.DB_BATCH_SIZE) || 100,
            flushInterval: parseInt(process.env.DB_FLUSH_INTERVAL) || 5000
          }
        }
      }
    };
    
    threadingService = new ThreadingService(threadingConfig);
    
    // Initialize the threading routes with the service
    initializeThreadingService(threadingService);
    
    // Setup threading service event handlers
    setupThreadingEventHandlers();
    
    // Start the threading service if auto-start is enabled
    if (process.env.THREADING_AUTO_START !== 'false') {
      const result = await threadingService.start();
      if (result.success) {
        console.log(`✅ MCP threading system started -> Thread ID: ${result.threadId}`);
      } else {
        console.warn(`⚠️ MCP threading system failed to start: ${result.error}`);
      }
    } else {
      console.log('🧵 MCP threading system initialized (auto-start disabled)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize threading system:', error);
    // Don't exit the process - the server can still run without threading
  }
}

/**
 * Setup event handlers for the threading service
 */
function setupThreadingEventHandlers() {
  if (!threadingService) return;
  
  threadingService.on('workerStarted', (data) => {
    console.log(`🧵 Worker thread started: ${data.threadId}`);
  });
  
  threadingService.on('workerStopped', () => {
    console.log('🧵 Worker thread stopped');
  });
  
  threadingService.on('workerError', (data) => {
    console.error('🧵 Worker thread error:', data.error.message);
  });
  
  threadingService.on('workerUnhealthy', (data) => {
    console.warn('🧵 Worker thread unhealthy:', data.reason);
  });
  
  threadingService.on('restartSuccess', (data) => {
    console.log(`🧵 Worker thread restarted successfully (attempt ${data.attemptNumber})`);
  });
  
  threadingService.on('restartFailed', (data) => {
    console.error(`🧵 Worker thread restart failed (attempt ${data.attemptNumber}): ${data.error}`);
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/meter-readings', meterReadingRoutes);
// Alias without hyphen to match frontend service paths
app.use('/api/meterreadings', meterReadingRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/modbus', modbusRoutes);
app.use('/api', directMeterRoutes);
// app.use('/api/threading', threadingRoutes); // TEMPORARILY DISABLED

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Get PostgreSQL health status
    const dbHealth = await db.healthCheck();
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth.status === 'healthy' ? 'Connected' : 'Disconnected',
      databaseDetails: dbHealth,
      threading: null
    };

    // Add threading system health if available
    if (threadingService) {
      try {
        const threadingHealth = await threadingService.getHealthStatus();
        healthData.threading = {
          status: threadingHealth.isHealthy ? 'Healthy' : 'Unhealthy',
          worker: {
            running: threadingHealth.worker.isRunning,
            threadId: threadingHealth.worker.threadId
          },
          lastHealthCheck: threadingHealth.lastCheck,
          uptime: threadingHealth.uptime,
          memoryUsage: threadingHealth.memory
        };
      } catch (error) {
        healthData.threading = {
          status: 'Error',
          error: error.message
        };
      }
    } else {
      healthData.threading = {
        status: 'Not Initialized'
      };
    }

    // Determine overall status
    const isHealthy = healthData.database === 'Connected' && 
                     (!threadingService || healthData.threading.status === 'Healthy');
    
    healthData.status = isHealthy ? 'OK' : 'Degraded';

    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Test endpoint to check database contents
// TEMPORARILY DISABLED - methods may not be implemented
/*
app.get('/api/test/db-status', async (req, res) => {
  try {
    const User = require('./models/UserPG');
    
    // Get database status and stats
    const dbStatus = await db.getStatus();
    const userStats = await User.getStats();
    const sampleUsers = await User.findAll({ limit: 1 });
    
    // Get some sample data from meter readings table
    const meterReadingCount = await db.query('SELECT COUNT(*) as count FROM meterreadings');
    const sampleReading = await db.query('SELECT meterid, reading_value, reading_date FROM meterreadings LIMIT 1');
    
    res.json({
      success: true,
      database: process.env.POSTGRES_DB,
      connectionPool: dbStatus,
      tables: {
        users: userStats.total_users,
        meterReadings: meterReadingCount.rows[0].count
      },
      samples: {
        user: sampleUsers[0] || null,
        meterReading: sampleReading.rows[0] || null
      },
      userStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
*/

// Test endpoint to create a test user
// TEMPORARILY DISABLED - methods may not be implemented
/*
app.post('/api/test/create-user', async (req, res) => {
  try {
    const User = require('./models/UserPG'); // Updated to use PostgreSQL model
    
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
*/

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

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop threading service first
    if (threadingService) {
      console.log('🧵 Stopping threading service...');
      await threadingService.stop(true);
      console.log('✅ Threading service stopped');
    }
    
    // Close PostgreSQL database connections
    console.log('📊 Closing database connections...');
    await db.disconnect();
    console.log('✅ Database connections closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Setup graceful shutdown handlers
// TEMPORARILY DISABLED for debugging
/*
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
*/

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // gracefulShutdown('uncaughtException'); // TEMPORARILY DISABLED
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // gracefulShutdown('unhandledRejection'); // TEMPORARILY DISABLED
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🧵 Threading auto-start: ${process.env.THREADING_AUTO_START !== 'false' ? 'enabled' : 'disabled'}`);
});

// Handle server shutdown
server.on('close', () => {
  console.log('🚀 HTTP server closed');
});