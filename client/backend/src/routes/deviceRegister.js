// @ts-nocheck
const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Middleware to authenticate all routes
router.use(authenticateToken);

// GET /api/devices/:deviceId/registers - Get all registers for a device
router.get('/', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Verify device exists
    const deviceResult = await db.query(
      'SELECT id FROM device WHERE id = $1',
      [deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Get all device registers with joined register data
    const registers = await db.query(
      `SELECT dr.id, dr.device_id, dr.register_id, 
              r.id as r_id, r.number, r.name, r.unit, r.field_name
       FROM device_register dr
       JOIN register r ON dr.register_id = r.id
       WHERE dr.device_id = $1
       ORDER BY r.number ASC`,
      [deviceId]
    );

    // Transform response to include nested register object
    const data = registers.rows.map((row) => ({
      id: row.id,
      device_id: row.device_id,
      register_id: row.register_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      register: {
        id: row.r_id,
        number: row.number,
        name: row.name,
        unit: row.unit,
        field_name: row.field_name,
      },
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching device registers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device registers',
      error: errorMessage,
    });
  }
});

// POST /api/devices/:deviceId/registers - Add a register to a device
router.post('/', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { register_id } = req.body;

    // Validate input
    if (!register_id) {
      return res.status(400).json({
        success: false,
        message: 'register_id is required',
      });
    }

    // Verify device exists
    const deviceResult = await db.query(
      'SELECT id FROM device WHERE id = $1',
      [deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Verify register exists
    const registerResult = await db.query(
      'SELECT id FROM register WHERE id = $1',
      [register_id]
    );

    if (registerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Register not found',
      });
    }

    // Check if register is already associated with device
    const existingResult = await db.query(
      'SELECT id FROM device_register WHERE device_id = $1 AND register_id = $2',
      [deviceId, register_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Register is already associated with this device',
      });
    }

    // Create device_register record
    const result = await db.query(
      'INSERT INTO device_register (device_id, register_id) VALUES ($1, $2)',
      [deviceId, register_id]
    );

    // Fetch the created record with register data
    const newRecord = await db.query(
      `SELECT dr.id, dr.device_id, dr.register_id,
              r.id as r_id, r.number, r.name, r.unit, r.field_name
       FROM device_register dr
       JOIN register r ON dr.register_id = r.id
       WHERE dr.id = $1`,
      [result.rows[0].id]
    );

    if (newRecord.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create device register',
      });
    }

    const row = newRecord.rows[0];
    const data = {
      id: row.id,
      device_id: row.device_id,
      register_id: row.register_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      register: {
        id: row.r_id,
        number: row.number,
        name: row.name,
        unit: row.unit,
        field_name: row.field_name,
      },
    };

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error adding device register:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to add device register',
      error: errorMessage,
    });
  }
});

// PUT /api/devices/:deviceId/registers/:registerId - Update a device register
router.put('/:registerId', async (req, res) => {
  try {
    const { deviceId, registerId } = req.params;

    // Verify device exists
    const deviceResult = await db.query(
      'SELECT id FROM device WHERE id = $1',
      [deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Verify device_register exists
    const registerResult = await db.query(
      'SELECT id FROM device_register WHERE device_id = $1 AND register_id = $2',
      [deviceId, registerId]
    );

    if (registerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device register not found',
      });
    }

    // For now, just return the existing record (update logic can be extended)
    const updated = await db.query(
      `SELECT dr.id, dr.device_id, dr.register_id,
              r.id as r_id, r.number, r.name, r.unit, r.field_name
       FROM device_register dr
       JOIN register r ON dr.register_id = r.id
       WHERE dr.device_id = $1 AND dr.register_id = $2`,
      [deviceId, registerId]
    );

    if (updated.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update device register',
      });
    }

    const row = updated.rows[0];
    const data = {
      id: row.id,
      device_id: row.device_id,
      register_id: row.register_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      register: {
        id: row.r_id,
        number: row.number,
        name: row.name,
        unit: row.unit,
        field_name: row.field_name,
      },
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating device register:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to update device register',
      error: errorMessage,
    });
  }
});

// DELETE /api/devices/:deviceId/registers/:registerId - Delete a device register
router.delete('/:registerId', async (req, res) => {
  try {
    const { deviceId, registerId } = req.params;

    // Verify device exists
    const deviceResult = await db.query(
      'SELECT id FROM device WHERE id = $1',
      [deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Verify device_register exists
    const registerResult = await db.query(
      'SELECT id FROM device_register WHERE device_id = $1 AND register_id = $2',
      [deviceId, registerId]
    );

    if (registerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device register not found',
      });
    }

    // Delete the device_register record
    await db.query(
      'DELETE FROM device_register WHERE device_id = $1 AND register_id = $2',
      [deviceId, registerId]
    );

    res.json({
      success: true,
      message: 'Register removed successfully',
    });
  } catch (error) {
    console.error('Error deleting device register:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to delete device register',
      error: errorMessage,
    });
  }
});

module.exports = router;
