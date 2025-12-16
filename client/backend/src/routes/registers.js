const express = require('express');
const router = express.Router();
const db = require('../config/database');


// GET /api/registers - Get all registers for the tenant
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    // Get all registers for the tenant
    const registers = await db.query(
      `SELECT id, number, name, unit, field_name, tenant_id
       FROM register
       WHERE tenant_id = ?
       ORDER BY number ASC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: registers,
    });
  } catch (error) {
    console.error('Error fetching registers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registers',
      error: error.message,
    });
  }
});

module.exports = router;
