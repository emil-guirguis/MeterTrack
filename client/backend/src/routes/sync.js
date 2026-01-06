const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateSyncServer } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

/**
 * Helper function to log SQL queries
 */
const logQuery = (query, params = []) => {
  console.log('\n=== SQL QUERY ===');
  console.log('Query:', query);
  if (params && params.length > 0) {
    console.log('Parameters:', params);
  }
  console.log('==================\n');
};

/**
 * POST /api/sync/auth
 * Authenticate Sync and verify API key
 */
router.post('/auth', authenticateSyncServer, async (req, res) => {
  try {
    // If middleware passes, authentication is successful
    const query = 'SELECT id, name FROM sites WHERE id = $1';
    const params = [req.siteId];
    logQuery(query, params);
    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    const site = result.rows[0];
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    res.json({
      success: true,
      message: 'Authentication successful',
      site: {
        id: site['id'],
        name: site['name']
      }
    });
  } catch (error) {
    console.error('Sync auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: errorMessage
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
    // body('readings.*.timestamp').isISO8601().withMessage('timestamp must be valid ISO8601 date'),
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
            const meterQuery = 'SELECT id FROM meter WHERE  tenant_id = $2';
            const meterParams = [siteId, reading.meter_id];
            logQuery(meterQuery, meterParams);
            let meterResult = await client.query(meterQuery, meterParams);

            let meterId;
            if (meterResult.rows.length === 0) {
              // Create meter if it doesn't exist
              const insertMeterQuery = `INSERT INTO meter (id, name, device_id, ip, port, element) 
                 VALUES ($1, $2, $3, $4,$5) 
                 RETURNING id`;
              const insertMeterParams = [siteId, reading.meter_id, reading.meter_element];
              logQuery(insertMeterQuery, insertMeterParams);
              const insertMeterResult = await client.query(insertMeterQuery, insertMeterParams);
              meterId = insertMeterResult.rows[0] && insertMeterResult.rows[0].id;
            } else {
              meterId = meterResult.rows[0] && meterResult.rows[0].id;
            }

            // Insert meter reading
            const readingQuery = `INSERT INTO meter_reading (meter_id, timestamp, data_point, value, unit)
               VALUES ($1, $2, $3, $4, $5)`;
            const readingParams = [
              meterId,
              reading.timestamp,
              reading.data_point,
              reading.value,
              reading.unit || null
            ];
            logQuery(readingQuery, readingParams);
            await client.query(readingQuery, readingParams);

            insertedCount++;
          } catch (error) {
            console.error('Error inserting reading:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({
              meter_external_id: reading.meter_external_id,
              error: errorMessage
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Batch upload error',
        error: errorMessage
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
    const siteQuery = 'SELECT id, name FROM sites WHERE id = $1';
    const siteParams = [siteId];
    logQuery(siteQuery, siteParams);
    const siteResult = await db.query(siteQuery, siteParams);

    if (siteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Get meters for this site
    const metersQuery = `SELECT id, external_id, name, bacnet_device_id, bacnet_ip 
       FROM meter 
       WHERE site_id = $1`;
    const metersParams = [siteId];
    logQuery(metersQuery, metersParams);
    const metersResult = await db.query(metersQuery, metersParams);

    const site = siteResult.rows[0];
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    const meters = metersResult.rows || [];

    res.json({
      success: true,
      config: {
        site: {
          id: site['id'],
          name: site['name']
        },
        meters: meters.map(meter => ({
          external_id: meter['external_id'],
          name: meter['name'],
          bacnet_device_id: meter['bacnet_device_id'],
          bacnet_ip: meter['bacnet_ip']
        })),
        sync_interval_minutes: 5,
        batch_size: 1000
      }
    });
  } catch (error) {
    console.error('Config download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Config download error',
      error: errorMessage
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

    // Update last heartbeat timestamp
    const heartbeatQuery = 'UPDATE sites SET last_heartbeat = NOW() WHERE id = $1';
    const heartbeatParams = [siteId];
    logQuery(heartbeatQuery, heartbeatParams);
    await db.query(heartbeatQuery, heartbeatParams);

    res.json({
      success: true,
      message: 'Heartbeat received',
      server_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Heartbeat error',
      error: errorMessage
    });
  }
});

/**
 * GET /api/sync/getmeters  
 * Download get meters for Sync
 */
router.get('/getmeters', authenticateSyncServer, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const sql = `select m.id as meter_id, m.device_id, m.ip, m.port, m.active ,  
                me.meter_element_id, me.element, me.name as name 
                 from meter m
                 	  join meter_element me on me.meter_id = m.id
                 where m.tenant_id = $1`;

    const params = [tenantId];
    logQuery(sql, params);
    const result = await db.query(sql, params);

    const meter = result.rows[0];
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'meter not found'
      });
    }

    const meters = result.rows || [];

    res.json({
      success: true,
      config: {
        site: {
          id: meter['meter_id'],
          ip: meter['ip']
        },
        meters: meters.map(meter => ({
          meter_id: meter['meter_id'],
          device_id: meter['device_id'],
          ip: meter['ip'],
          port: meter['port'],
          element: meter['element'],
          active: meter['active']
        })),
        sync_interval_minutes: 5,
        batch_size: 1000
      }
    });
  } catch (error) {
    console.error('Meter download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Meter  download error',
      error: errorMessage
    });
  }
});


/**
 * GET /api/sync/getmregisters
 * Download get registers for Sync
 */
router.get('/getmregisters', authenticateSyncServer, async (req, res) => {
  try {
    const deviceId = req.deviceId;
    const sql = `select dr.device_id, register, field_name
                 from register r 
                    join device_register dr on dr.register_id = r.id 
                 where dr.device_id = $1`;

    const params = [deviceId];
    logQuery(sql, params);
    const result = await db.query(sql, params);

    const register = result.rows[0];
    if (!register) {
      return res.status(404).json({
        success: false,
        message: 'register not found'
      });
    }

    const registers = result.rows || [];

    res.json({
      success: true,
      config: {
        register: {
          id: register['id'],
          name: register['name']
        },
        registers: registers.map(register => ({
          device_id: register['device_id'],
          register: register['register'],
          field_name: register['field_name'],
        })),
        sync_interval_minutes: 5,
        batch_size: 1000
      }
    });
  } catch (error) {
    console.error('register download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'register  download error',
      error: errorMessage
    });
  }
});

module.exports = router;
