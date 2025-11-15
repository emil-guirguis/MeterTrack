const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateSyncServer } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

/**
 * POST /api/sync/auth
 * Authenticate Sync and verify API key
 */
router.post('/auth', authenticateSyncServer, async (req, res) => {
  try {
    // If middleware passes, authentication is successful
    const result = await db.query(
      'SELECT id, name FROM sites WHERE id = $1',
      [req.siteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    const site = result.rows[0];

    res.json({
      success: true,
      message: 'Authentication successful',
      site: {
        id: site.id,
        name: site.name
      }
    });
  } catch (error) {
    console.error('Sync auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
});

/**
 * POST /api/sync/readings/batch
 * Upload batch meter readings from Sync
 */
router.post(
  '/readings/batch',
  authenticateSyncServer,
  [
    body('readings').isArray().withMessage('Readings must be an array'),
    body('readings.*.meter_external_id').isString().notEmpty().withMessage('meter_external_id is required'),
    body('readings.*.timestamp').isISO8601().withMessage('timestamp must be valid ISO8601 date'),
    body('readings.*.data_point').isString().notEmpty().withMessage('data_point is required'),
    body('readings.*.value').isNumeric().withMessage('value must be numeric'),
    body('readings.*.unit').optional().isString()
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { readings } = req.body;
      const siteId = req.siteId;

      if (!readings || readings.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No readings provided'
        });
      }

      // Process readings in a transaction
      const result = await db.transaction(async (client) => {
        let insertedCount = 0;
        let skippedCount = 0;
        const errors = [];

        for (const reading of readings) {
          try {
            // Find or create meter
            let meterResult = await client.query(
              'SELECT id FROM meters WHERE site_id = $1 AND external_id = $2',
              [siteId, reading.meter_external_id]
            );

            let meterId;
            if (meterResult.rows.length === 0) {
              // Create meter if it doesn't exist
              const insertMeterResult = await client.query(
                `INSERT INTO meters (site_id, external_id, name, created_at) 
                 VALUES ($1, $2, $3, NOW()) 
                 RETURNING id`,
                [siteId, reading.meter_external_id, reading.meter_external_id]
              );
              meterId = insertMeterResult.rows[0].id;
            } else {
              meterId = meterResult.rows[0].id;
            }

            // Insert meter reading
            await client.query(
              `INSERT INTO meter_readings (meter_id, timestamp, data_point, value, unit, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [
                meterId,
                reading.timestamp,
                reading.data_point,
                reading.value,
                reading.unit || null
              ]
            );

            insertedCount++;
          } catch (error) {
            console.error('Error inserting reading:', error);
            errors.push({
              meter_external_id: reading.meter_external_id,
              error: error.message
            });
            skippedCount++;
          }
        }

        return { insertedCount, skippedCount, errors };
      });

      res.json({
        success: true,
        message: 'Batch upload completed',
        inserted: result.insertedCount,
        skipped: result.skippedCount,
        errors: result.errors
      });
    } catch (error) {
      console.error('Batch upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Batch upload error',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/sync/config
 * Download configuration for Sync
 */
router.get('/config', authenticateSyncServer, async (req, res) => {
  try {
    const siteId = req.siteId;

    // Get site information
    const siteResult = await db.query(
      'SELECT id, name FROM sites WHERE id = $1',
      [siteId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Get meters for this site
    const metersResult = await db.query(
      `SELECT id, external_id, name, bacnet_device_id, bacnet_ip 
       FROM meters 
       WHERE site_id = $1`,
      [siteId]
    );

    const site = siteResult.rows[0];
    const meters = metersResult.rows;

    res.json({
      success: true,
      config: {
        site: {
          id: site.id,
          name: site.name
        },
        meters: meters.map(meter => ({
          external_id: meter.external_id,
          name: meter.name,
          bacnet_device_id: meter.bacnet_device_id,
          bacnet_ip: meter.bacnet_ip
        })),
        sync_interval_minutes: 5,
        batch_size: 1000
      }
    });
  } catch (error) {
    console.error('Config download error:', error);
    res.status(500).json({
      success: false,
      message: 'Config download error',
      error: error.message
    });
  }
});

/**
 * POST /api/sync/heartbeat
 * Health check and heartbeat from Sync
 */
router.post('/heartbeat', authenticateSyncServer, async (req, res) => {
  try {
    const siteId = req.siteId;
    const { status, queue_size, last_collection } = req.body;

    // Update last heartbeat timestamp
    await db.query(
      'UPDATE sites SET last_heartbeat = NOW() WHERE id = $1',
      [siteId]
    );

    res.json({
      success: true,
      message: 'Heartbeat received',
      server_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({
      success: false,
      message: 'Heartbeat error',
      error: error.message
    });
  }
});

module.exports = router;
