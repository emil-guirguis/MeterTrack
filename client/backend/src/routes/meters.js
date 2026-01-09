// @ts-nocheck
const express = require('express');
const Meter = require('../models/MeterWithSchema');
const Device = require('../models/DeviceWithSchema');
const { requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

// Get all meters with filtering and pagination
router.get('/', requirePermission('meter:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search
    } = req.query;

    // Build where clause for Meter using framework filter processing
    let where = {};
    if (search) where.name = search; // Assuming search by name
    
    // Use framework method to process filters from query parameters
    const filters = Meter.processFilters(req.query);
    where = { ...where, ...filters };

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenant_id: req.user?.tenant_id || req.user?.tenantId // Automatic tenant filtering
    };

    // Get meters
    const result = await Meter.findAll(options);

    res.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching meters:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meters' });
  }
});

// Get single meter by ID
router.get('/:id', requirePermission('meter:read'), async (req, res) => {
  try {
    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({ success: false, message: 'Meter not found' });
    }
    res.json({ success: true, data: meter });
  } catch (error) {
    console.error('Error fetching meter:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meter' });
  }
});

// Create meter
router.post('/', requirePermission('meter:create'), async (req, res) => {
  try {
    // CRITICAL: Always set tenant_id from authenticated user
    // This is required for the foreign key constraint on tenant_id
    const tenantId = req.user?.tenant_id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id to create meters'
      });
    }
    
    const meterData = {
      ...req.body,
      tenant_id: tenantId
    };
    
    const meter = new Meter(meterData);
    await meter.save();
    res.status(201).json({ success: true, data: meter });
  } catch (error) {
    console.error('Error creating meter:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create meter',
      error: error.message,
      detail: error.detail,
      code: error.code
    });
  }
});

// Update meter
router.put('/:id', requirePermission('meter:update'), asyncHandler(async (req, res) => {
  console.log('\n' + '='.repeat(100));
  console.log('PUT /meters/:id - Update Request');
  console.log('='.repeat(100));
  console.log('Meter ID:', req.params.id);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  
  // Find the meter first
  const meter = await Meter.findById(req.params.id);
  if (!meter) {
    return res.status(404).json({ success: false, message: 'Meter not found' });
  }
  
  // CRITICAL: Protect tenant_id from being changed
  // Validate that the meter belongs to the authenticated user's tenant
  const userTenantId = req.user?.tenant_id || req.user?.tenantId;
  if (meter.tenant_id !== userTenantId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this meter'
    });
  }
  
  console.log('Found meter:', JSON.stringify(meter, null, 2));
  
  // Filter out fields that don't exist in the database or are read-only
  const updateData = { ...req.body };
  delete updateData.device;  // read-only computed field
  delete updateData.model;   // read-only computed field
  delete updateData.status;  // doesn't exist in database
  delete updateData.tenant_id;  // cannot be changed
  delete updateData.tenantId;   // cannot be changed
  
  console.log('Filtered update data:', JSON.stringify(updateData, null, 2));
  
  // Update the meter using instance method
  await meter.update(updateData);
  
  console.log('Update successful');
  console.log('='.repeat(100) + '\n');
  
  res.json({ success: true, data: meter });
}));

// Delete meter
router.delete('/:id', requirePermission('meter:delete'), async (req, res) => {
  try {
    // Find the meter first
    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({ success: false, message: 'Meter not found' });
    }
    
    // Delete the meter using instance method
    await meter.delete();
    
    res.json({ success: true, message: 'Meter deleted successfully' });
  } catch (error) {
    console.error('Error deleting meter:', error);
    res.status(500).json({ success: false, message: 'Failed to delete meter' });
  }
});

module.exports = router;