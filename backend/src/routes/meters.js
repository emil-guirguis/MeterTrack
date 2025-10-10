const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Meter = require('../models/MeterPG'); // PostgreSQL model
const { authenticateToken, requirePermission } = require('../middleware/auth');

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
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      'filter.brand': filterBrand,
      'filter.status': filterStatus
    } = req.query;

    const numericPage = parseInt(page);
    const numericPageSize = parseInt(pageSize);
    const skip = (numericPage - 1) * numericPageSize;

    // Fetch from PG model (returns already sorted by meterid ASC). We'll sort after mapping.
    const filters = {
      status: filterStatus || undefined,
      // findAll supports a broad search across meterid/name/manufacturer
      search: search || (filterBrand ? String(filterBrand) : undefined)
    };

    const allMeters = await Meter.findAll(filters);

    // Sort in-memory based on requested field
    const sortKeyMap = {
      createdAt: 'createdat',
      meterId: 'meterid',
      meterid: 'meterid',
      status: 'status',
      type: 'type',
      serialNumber: 'serialnumber',
      brand: 'manufacturer',
      model: 'model'
    };
    const key = sortKeyMap[sortBy] || 'createdat';
    const sorted = allMeters.sort((a, b) => {
      const va = (a[key] ?? '').toString().toLowerCase();
      const vb = (b[key] ?? '').toString().toLowerCase();
      if (va < vb) return sortOrder === 'desc' ? 1 : -1;
      if (va > vb) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    const total = sorted.length;
    const itemsPage = sorted.slice(skip, skip + numericPageSize).map(m => ({
      id: m.id,
      meterId: m.meterid,
      serialNumber: m.serialnumber,
      brand: m.manufacturer,
      model: m.model,
      type: m.type,
      status: m.status,
      location: m.fullLocation,
      createdAt: m.createdat,
      updatedAt: m.updatedat,
      // Align with frontend expectations; configuration may not exist in PG
      configuration: undefined,
      lastReading: null
    }));

    const totalPages = Math.ceil(total / numericPageSize) || 1;

    res.json({
      success: true,
      data: {
        items: itemsPage,
        pagination: {
          currentPage: numericPage,
          pageSize: numericPageSize,
          totalItems: total,
          totalPages,
          hasNextPage: numericPage < totalPages,
          hasPreviousPage: numericPage > 1
        }
      }
    });

  } catch (error) {
    console.error('Meters fetch error:', error);
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
    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found'
      });
    }

    const data = {
      id: meter.id,
      meterId: meter.meterid,
      serialNumber: meter.serialnumber,
      brand: meter.manufacturer,
      model: meter.model,
      type: meter.type,
      status: meter.status,
      location: meter.fullLocation,
      createdAt: meter.createdat,
      updatedAt: meter.updatedat,
      configuration: undefined,
      lastReading: null
    };

    res.json({ success: true, data });

  } catch (error) {
    console.error('Meter fetch error:', error);
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
  body('brand').optional().isLength({ max: 100 }).trim(),
  body('manufacturer').optional().isLength({ max: 100 }).trim(),
  body('model').optional().isLength({ max: 100 }).trim(),
  body('serialNumber').optional().isLength({ max: 100 }).trim(),
  body('serialnumber').optional().isLength({ max: 100 }).trim(),
  body('type').optional().isIn(['electric','gas','water']),
  body('status').optional().isIn(['active','inactive','maintenance']),
  body('location').optional().isLength({ max: 200 }).trim(),
  body('notes').optional().isLength({ max: 500 }).trim()
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
    const normalized = {
      meterid: req.body.meterid || req.body.meterId,
      name: req.body.name || req.body.meterId,
      type: req.body.type,
      manufacturer: req.body.manufacturer || req.body.brand,
      model: req.body.model,
      serialnumber: req.body.serialnumber || req.body.serialNumber,
      status: req.body.status || 'active',
      location_building: req.body.location_building || undefined,
      location_floor: req.body.location_floor || undefined,
      location_room: req.body.location_room || undefined,
      location_description: req.body.location || req.body.location_description || undefined,
      unit_of_measurement: req.body.unit_of_measurement || undefined,
      multiplier: req.body.multiplier || 1,
      notes: req.body.notes || undefined
    };

    if (!normalized.meterid) {
      return res.status(400).json({ success: false, message: 'Meter ID is required' });
    }

    // Attempt to create
    const created = await Meter.create(normalized);

    const responseItem = {
      id: created.id,
      meterId: created.meterid,
      serialNumber: created.serialnumber,
      brand: created.manufacturer,
      model: created.model,
      type: created.type,
      status: created.status,
      location: created.fullLocation,
      createdAt: created.createdat,
      updatedAt: created.updatedat,
    };

    res.status(201).json({
      success: true,
      data: responseItem,
      message: 'Meter created successfully'
    });

  } catch (error) {
    console.error('Meter creation error:', error);
    
    if (error.code === 'DUPLICATE_CONNECTION') {
      return res.status(409).json({
        success: false,
        message: 'IP and port combination already exists'
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Meter ID already exists'
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
  body('brand').optional().isLength({ max: 100 }).trim(),
  body('manufacturer').optional().isLength({ max: 100 }).trim(),
  body('model').optional().isLength({ max: 100 }).trim(),
  body('serialNumber').optional().isLength({ max: 100 }).trim(),
  body('serialnumber').optional().isLength({ max: 100 }).trim(),
  body('type').optional().isIn(['electric','gas','water']),
  body('status').optional().isIn(['active','inactive','maintenance']),
  body('location').optional().isLength({ max: 200 }).trim(),
  body('notes').optional().isLength({ max: 500 }).trim()
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

    const updateData = {
      meterid: req.body.meterid || req.body.meterId,
      type: req.body.type,
      manufacturer: req.body.manufacturer || req.body.brand,
      model: req.body.model,
      serialnumber: req.body.serialnumber || req.body.serialNumber,
      status: req.body.status,
      location_building: req.body.location_building,
      location_floor: req.body.location_floor,
      location_room: req.body.location_room,
      location_description: req.body.location || req.body.location_description,
      unit_of_measurement: req.body.unit_of_measurement,
      multiplier: req.body.multiplier,
      notes: req.body.notes
    };

    const updated = await meter.update(updateData);

    const responseItem = {
      id: updated.id,
      meterId: updated.meterid,
      serialNumber: updated.serialnumber,
      brand: updated.manufacturer,
      model: updated.model,
      type: updated.type,
      status: updated.status,
      location: updated.fullLocation,
      createdAt: updated.createdat,
      updatedAt: updated.updatedat,
    };

    res.json({ success: true, data: responseItem, message: 'Meter updated successfully' });

  } catch (error) {
    console.error('Meter update error:', error);
    
    if (error.code === 'DUPLICATE_CONNECTION') {
      return res.status(409).json({
        success: false,
        message: 'IP and port combination already exists'
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Meter ID already exists'
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

    await meter.delete();

    res.json({ success: true, message: 'Meter deleted successfully' });

  } catch (error) {
    console.error('Meter deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete meter', error: error.message });
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
    res.status(500).json({ success: false, message: 'Failed to test connection', error: error.message });
  }
});

module.exports = router;