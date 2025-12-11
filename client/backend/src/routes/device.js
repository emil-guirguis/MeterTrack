// @ts-nocheck
const express = require('express');
const Device = require('../models/DeviceWithSchema.js');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

// Get all devices with filtering and pagination
router.get('/', requirePermission('device:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      active,
      type
    } = req.query;

    // Build where clause for Device
    const where = {};
    if (search) where.description = search; // Assuming search by description
    if (active !== undefined) where.active = active;
    if (type) where.type = type;

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenantId: req.user?.tenantId // Automatic tenant filtering
    };

    // Get devices
    const result = await Device.findAll(options);

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
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch devices' });
  }
});

// Get single device by ID
router.get('/:id', requirePermission('device:read'), async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.json({ success: true, data: device });
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device' });
  }
});

// Create device
router.post('/', requirePermission('device:create'), async (req, res) => {
  try {
    const device = new Device(req.body);
    await device.save();
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    console.error('Error creating device:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create device' });
  }
});

// Update device
router.put('/:id', requirePermission('device:update'), async (req, res) => {
  try {
    // Find the device first
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    
    // Update the device using instance method
    await device.update(req.body);
    
    res.json({ success: true, data: device });
  } catch (error) {
    console.error('Error updating device:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: 'Failed to update device' });
  }
});

// Delete device
router.delete('/:id', requirePermission('device:delete'), async (req, res) => {
  try {
    // Find the device first
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    
    // Delete the device using instance method
    await device.delete();
    
    res.json({ success: true, message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ success: false, message: 'Failed to delete device' });
  }
});

module.exports = router;
