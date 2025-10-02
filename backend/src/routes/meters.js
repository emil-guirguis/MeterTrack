const express = require('express');
const Meter = require('../models/Meter');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get all meters
router.get('/', requirePermission('meter:read'), async (req, res) => {
  try {
    const meters = await Meter.find().populate('buildingId', 'name').populate('equipmentId', 'name');
    res.json({ success: true, data: { items: meters, total: meters.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch meters' });
  }
});

// Create meter
router.post('/', requirePermission('meter:create'), async (req, res) => {
  try {
    const meter = new Meter(req.body);
    await meter.save();
    res.status(201).json({ success: true, data: meter });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create meter' });
  }
});

module.exports = router;