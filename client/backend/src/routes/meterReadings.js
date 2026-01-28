const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { query, validationResult } = require('express-validator');
const db = require('../config/database');
const router = express.Router();

router.use(authenticateToken);

// GET /api/meterreadings - Get all meter readings with filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('tenantId').optional().isString(),
  query('meterId').optional().isString(),
  query('meterElementId').optional().isString(),
], requirePermission('meter:read'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const userTenantId = req.query.tenantId || req.user?.tenantId || req.user?.tenant_id;
    if (!userTenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: tenant context required' });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const meterId = req.query.meterId;
    const meterElementId = req.query.meterElementId;

    console.log('[MeterReadings] Request:', { tenantId: userTenantId, meterId, meterElementId, page, pageSize });

    // Build SQL query with proper parameter placeholders
    let sql = 'SELECT * FROM meter_reading WHERE tenant_id = $1';
    let params = [parseInt(userTenantId)];
    let paramCount = 2;

    if (meterId !== undefined && meterId !== '') {
      sql += ` AND meter_id = $${paramCount}`;
      params.push(parseInt(meterId));
      paramCount++;
    }

    if (meterElementId !== undefined && meterElementId !== '') {
      sql += ` AND meter_element_id = $${paramCount}`;
      params.push(parseInt(meterElementId));
      paramCount++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(pageSize);
    params.push(skip);

    console.log('[MeterReadings] ===== EXECUTING QUERY =====');
    console.log('[MeterReadings] SQL:', sql);
    console.log('[MeterReadings] Params:', params);

    const result = await db.query(sql, params);
    const items = result.rows || [];

    console.log('[MeterReadings] ===== QUERY RESULT =====');
    console.log('[MeterReadings] Returned:', items.length, 'rows');
    if (items.length > 0) {
      console.log('[MeterReadings] First row keys:', Object.keys(items[0]));
      console.log('[MeterReadings] First row:', JSON.stringify(items[0], null, 2));
    }
    console.log('[MeterReadings] ===== END QUERY RESULT =====');

    res.json({
      success: true,
      data: {
        items: items,
        total: items.length,
        page,
        pageSize,
        totalPages: Math.ceil(items.length / pageSize) || 1,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('[MeterReadings] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

module.exports = router;
