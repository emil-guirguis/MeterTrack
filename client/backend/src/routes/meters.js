// @ts-nocheck
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Meter = require('../models/MeterWithSchema');
const DeviceService = require('../services/deviceService');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyError,
  NotFoundError,
  NotNullError
} = require('../../../../framework/backend/api/base/errors');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all meters with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isString()
], requirePermission('meter:read'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      pageSize = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      'filter.status': filterStatus
    } = req.query;

    const numericPage = parseInt(page);
    const numericPageSize = parseInt(pageSize);
    const offset = (numericPage - 1) * numericPageSize;

    // Build where clause for filtering
    const where = {};
    
    if (filterStatus) {
      where.status = filterStatus;
    }

    // Map sortBy to database column names
    const sortKeyMap = {
      createdAt: 'created_at',
      meterId: 'meterid',
      meterid: 'meterid',
      status: 'status',
      type: 'type',
      serialNumber: 'serial_number',
      model: 'device_id'
    };
    const orderColumn = sortKeyMap[sortBy] || 'created_at';
    const orderDirection = sortOrder.toUpperCase();

    // Use BaseModel's findAll with proper options
    // Tenant filtering is automatically applied by BaseModel if tenantId is provided
    const result = await Meter.findAll({
      where,
      order: [[orderColumn, orderDirection]],
      limit: numericPageSize,
      offset,
      tenantId: req.user?.tenantId // Framework will automatically filter by tenant
    });

    // Map results to frontend format
    const itemsPage = result.rows.map(m => ({
      id: m.id,
      meterId: m.meterid,
      serialNumber: m.serial_number || m.serialnumber,
      device: m.device_name || null,
      model: m.device_description || null,
      device_id: m.device_id,
      type: m.type,
      status: m.status,
      location: m.location_name || null,
      location_id: m.location_id,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      register_map: m.register_map ?? null,
      configuration: undefined,
      lastReading: null
    }));

    const totalPages = result.pagination.totalPages;

    res.json({
      success: true,
      data: {
        items: itemsPage,
        pagination: {
          currentPage: numericPage,
          pageSize: numericPageSize,
          totalItems: result.pagination.total,
          totalPages,
          hasNextPage: numericPage < totalPages,
          hasPreviousPage: numericPage > 1
        }
      }
    });

  } catch (error) {
    console.error('=== METERS FETCH ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('==========================');
    
    // Handle specific error types
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meters',
      error: error.message
    });
  }
});

// Get meter by ID
router.get('/:id', requirePermission('meter:read'), async (req, res) => {
  try {
    // Use BaseModel's findById without relationships first
    const meter = await Meter.findById(req.params.id);
    
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found'
      });
    }

    // Fetch related device and location separately if needed
    let deviceName = null;
    let deviceModel = null;
    let locationName = null;

    if (meter.device_id) {
      const Device = require('../models/DeviceWithSchema');
      const device = await Device.findById(meter.device_id);
      if (device) {
        deviceName = device.manufacturer;
        deviceModel = device.model_number;
      }
    }

    if (meter.location_id) {
      const Location = require('../models/LocationWithSchema');
      const location = await Location.findById(meter.location_id);
      if (location) {
        locationName = location.name;
      }
    }

    const data = {
      id: meter.id,
      meterId: meter.meterid,
      serialNumber: meter.serial_number || meter.serialnumber,
      device: deviceName,
      model: deviceModel,
      device_id: meter.device_id,
      type: meter.type,
      status: meter.status,
      location: locationName,
      location_id: meter.location_id,
      createdAt: meter.created_at,
      updatedAt: meter.updated_at,
      register_map: meter.register_map ?? null,
      configuration: undefined,
      lastReading: null
    };

    res.json({ success: true, data });

  } catch (error) {
    console.error('Meter fetch error:', error);
    
    // Handle specific error types
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter',
      error: error.message
    });
  }
});

// Create new meter
router.post('/', [
  body('meterId').optional().isLength({ max: 50 }).trim(),
  body('meterid').optional().isLength({ max: 50 }).trim(),
  body('device_id').optional().isInt(),
  body('device').optional().isLength({ max: 100 }).trim(),
  body('model').optional().isLength({ max: 100 }).trim(),
  body('serialNumber').optional().isLength({ max: 100 }).trim(),
  body('serialnumber').optional().isLength({ max: 100 }).trim(),
  body('type').optional().isIn(['electric','gas','water']),
  body('status').optional().isIn(['active','inactive','maintenance']),
  body('location').optional().isLength({ max: 200 }).trim(),
  body('notes').optional().isLength({ max: 500 }).trim(),
  body('register_map').optional().isObject()
], requirePermission('meter:create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Normalize body to PG model fields
    // Resolve device_id: accept device_id directly, or device and model strings and upsert into devices table
    let resolvedDeviceId = req.body.device_id || null;
    const deviceName = (req.body.device || req.body.brand || '').trim();
    if (!resolvedDeviceId && (deviceName || req.body.model)) {
      const deviceDescription = (req.body.model || '').trim() || null;
      const tenantId = req.user?.tenantId;
      if (deviceName) {
        try {
          // Try to find existing device by manufacturer and model_number
          const allDevices = await DeviceService.getAllDevices(tenantId);
          let existingDevice = allDevices.find(device => 
            device.manufacturer === deviceName && 
            (device.model_number === deviceDescription || (!device.model_number && !deviceDescription))
          );
          
          if (!existingDevice && deviceDescription) {
            // If not found with model_number, try by manufacturer only
            existingDevice = allDevices.find(device => device.manufacturer === deviceName);
          }
          
          if (existingDevice) {
            resolvedDeviceId = existingDevice.id;
          } else {
            // Create new device using DeviceService
            const newDevice = await DeviceService.createDevice({
              manufacturer: deviceName,
              model_number: deviceDescription,
              description: null
            });
            resolvedDeviceId = newDevice.id;
          }
        } catch (error) {
          console.error('Error resolving device:', error);
          // If device creation fails due to duplicate manufacturer, try to find it again
          if (error.message.includes('already exists')) {
            const allDevices = await DeviceService.getAllDevices(tenantId);
            const existingDevice = allDevices.find(device => device.manufacturer === deviceName);
            if (existingDevice) {
              resolvedDeviceId = existingDevice.id;
            }
          } else {
            throw error;
          }
        }
      }
    }

    const normalized = {
      meterid: req.body.meterid || req.body.meterId,
      name: req.body.name || req.body.meterId,
      type: req.body.type,
      device_id: resolvedDeviceId,
      serialnumber: req.body.serialnumber || req.body.serialNumber,
      status: req.body.status || 'active',
      location_location: req.body.location_location || undefined,
      location_floor: req.body.location_floor || undefined,
      location_room: req.body.location_room || undefined,
      location_description: req.body.location || req.body.location_description || undefined,
      unit_of_measurement: req.body.unit_of_measurement || undefined,
      multiplier: req.body.multiplier || 1,
      notes: req.body.notes || undefined,
      register_map: req.body.register_map || null
    };

    if (!normalized.meterid) {
      return res.status(400).json({ success: false, message: 'Meter ID is required' });
    }

    // Use BaseModel's create method
    const created = await Meter.create(normalized);

    const responseItem = {
      id: created.id,
      meterId: created.meterid,
      device_id: created.device_id || null,
      serialNumber: created.serial_number || created.serial_number,
      device: created.device_name || null,
      model: created.device_description || null,
      type: created.type,
      status: created.status,
      location: created.fullLocation,
      createdAt: created.created_at || created.created_at,
      updatedAt: created.updated_at || created.updated_at,
      register_map: created.register_map ?? null,
    };

    res.status(201).json({
      success: true,
      data: responseItem,
      message: 'Meter created successfully'
    });

  } catch (error) {
    console.error('Meter creation error:', error);
    
    // Handle BaseModel custom errors
    if (error instanceof UniqueConstraintError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }
    
    if (error instanceof ForeignKeyError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }
    
    if (error instanceof NotNullError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create meter',
      error: error.message
    });
  }
});

// Update meter
router.put('/:id', [
  body('meterId').optional().isLength({ max: 50 }).trim(),
  body('meterid').optional().isLength({ max: 50 }).trim(),
  body('device_id').optional().isInt(),
  body('device').optional().isLength({ max: 100 }).trim(),
  body('model').optional().isLength({ max: 100 }).trim(),
  body('serialNumber').optional().isLength({ max: 100 }).trim(),
  body('serialnumber').optional().isLength({ max: 100 }).trim(),
  body('type').optional().isIn(['electric','gas','water']),
  body('status').optional().isIn(['active','inactive','maintenance']),
  body('location').optional().isLength({ max: 200 }).trim(),
  body('notes').optional().isLength({ max: 500 }).trim(),
  body('register_map').optional().isObject()
], requirePermission('meter:update'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({ success: false, message: 'Meter not found' });
    }

    // Resolve device_id: accept device_id directly, or device/brand and model strings and upsert into devices table
    let resolvedDeviceId = req.body.device_id || null;
    const deviceName = (req.body.device || req.body.brand || '').trim();
    const tenantId = req.user?.tenantId;
    if (!resolvedDeviceId && (deviceName || req.body.model)) {
      const deviceDescription = (req.body.model || '').trim() || null;
      if (deviceName) {
        try {
          // Try to find existing device by manufacturer and model_number
          const allDevices = await DeviceService.getAllDevices(tenantId);
          let existingDevice = allDevices.find(device => 
            device.manufacturer === deviceName && 
            (device.model_number === deviceDescription || (!device.model_number && !deviceDescription))
          );
          
          if (!existingDevice && deviceDescription) {
            // If not found with model_number, try by manufacturer only
            existingDevice = allDevices.find(device => device.manufacturer === deviceName);
          }
          
          if (existingDevice) {
            resolvedDeviceId = existingDevice.id;
          } else {
            // Create new device using DeviceService
            const newDevice = await DeviceService.createDevice({
              manufacturer: deviceName,
              model_number: deviceDescription,
              description: null
            });
            resolvedDeviceId = newDevice.id;
          }
        } catch (error) {
          console.error('Error resolving device during update:', error);
          // If device creation fails due to duplicate manufacturer, try to find it again
          if (error.message.includes('already exists')) {
            const allDevices = await DeviceService.getAllDevices(tenantId);
            const existingDevice = allDevices.find(device => device.manufacturer === deviceName);
            if (existingDevice) {
              resolvedDeviceId = existingDevice.id;
            }
          } else {
            throw error;
          }
        }
      }
    }

    const updateData = {
      meterid: req.body.meterid || req.body.meterId,
      type: req.body.type,
      device_id: resolvedDeviceId,
      serial_number: req.body.serialnumber || req.body.serialNumber,
      status: req.body.status,
      location_location: req.body.location_location,
      location_floor: req.body.location_floor,
      location_room: req.body.location_room,
      location_description: req.body.location || req.body.location_description,
      unit_of_measurement: req.body.unit_of_measurement,
      multiplier: req.body.multiplier,
      notes: req.body.notes,
      register_map: req.body.register_map
    };

    // Use BaseModel's instance update method
    const updated = await meter.update(updateData);

    const responseItem = {
      id: updated.id,
      meterId: updated.meterid,
      serialNumber: updated.serial_number || updated.serialnumber,
      device: updated.device_name || null,
      model: updated.device_description || null,
      type: updated.type,
      status: updated.status,
      location: updated.fullLocation,
      createdAt: updated.created_at || updated.created_at,
      updatedAt: updated.updated_at || updated.updated_at,
      register_map: updated.register_map ?? null,
    };

    res.json({ success: true, data: responseItem, message: 'Meter updated successfully' });

  } catch (error) {
    console.error('Meter update error:', error);
    
    // Handle BaseModel custom errors
    if (error instanceof UniqueConstraintError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }
    
    if (error instanceof ForeignKeyError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }
    
    if (error instanceof NotNullError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }
    
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update meter',
      error: error.message
    });
  }
});

// Delete meter
router.delete('/:id', requirePermission('meter:delete'), async (req, res) => {
  try {
    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({ success: false, message: 'Meter not found' });
    }

    // Use BaseModel's instance delete method
    await meter.delete();

    res.json({ success: true, message: 'Meter deleted successfully' });

  } catch (error) {
    console.error('Meter deletion error:', error);
    
    // Handle BaseModel custom errors
    if (error instanceof ForeignKeyError) {
      return res.status(error.statusCode).json({
        success: false,
        message: 'Cannot delete meter: it is referenced by other records',
        details: error.details
      });
    }
    
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete meter', 
      error: error.message 
    });
  }
});

// Test meter connection
router.post('/:id/test-connection', requirePermission('meter:read'), async (req, res) => {
  try {
    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({ success: false, message: 'Meter not found' });
    }

    // PostgreSQL model does not store Modbus connection details (ip/port/slaveId) yet
    return res.status(400).json({
      success: false,
      message: 'Connection configuration not available for this meter'
    });

  } catch (error) {
    console.error('Connection test error:', error);
    
    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test connection', 
      error: error.message 
    });
  }
});

// Get all meter maps (templates)
router.get('/maps/templates', requirePermission('meter:read'), async (req, res) => {
  try {
    // Use BaseModel's database connection
    const db = Meter.getDb();
    const query = `
      SELECT id, name, created_at, manufacturer, model, description, register_map
      FROM meter_maps 
      ORDER BY name ASC
    `;
    
    const result = await db.query(query);
    
    const templates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      manufacturer: row.manufacturer || 'Generic',
      model: row.model || 'Universal',
      description: row.description || '',
      registerMap: row.register_map
    }));

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Meter maps fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter map templates',
      error: error.message
    });
  }
});

module.exports = router;