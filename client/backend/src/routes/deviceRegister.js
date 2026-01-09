// @ts-nocheck
const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Middleware to authenticate all routes
router.use(authenticateToken);

// GET /api/devices/:deviceId/registers - Get all registers for a device (READ-ONLY)
router.get('/', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Verify device exists
    const deviceResult = await db.query(
      'SELECT device_id FROM device WHERE device_id = $1',
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
      `SELECT dr.device_register_id, dr.device_id, dr.register_id,
              r.id as r_id, r.register, r.name, r.unit, r.field_name
       FROM device_register dr
          JOIN register r ON dr.register_id = r.register_id
       WHERE dr.device_id = $1
       ORDER BY r.register ASC`,
      [deviceId]
    );

    // Transform response to include nested register object
    const data = registers.rows.map((row) => ({
      register_id: row.register_id,
      device_id: row.device_id,
      register_id: row.register_id,
      register: {
        id: row.r_id,
        register: row.register,
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

// NOTE: Device registers are READ-ONLY
// POST, PUT, DELETE operations have been removed
// Device register associations are managed externally

module.exports = router;
