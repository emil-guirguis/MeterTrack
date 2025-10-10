const express = require('express');
const Equipment = require('../models/EquipmentPG'); // Updated to use PostgreSQL model
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get all equipment
router.get('/', requirePermission('equipment:read'), async (req, res) => {
  try {
    const equipment = await Equipment.find().populate('buildingId', 'name');
    res.json({ success: true, data: { items: equipment, total: equipment.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch equipment' });
  }
});

// Create equipment
router.post('/', requirePermission('equipment:create'), async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();
    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create equipment' });
  }
});

module.exports = router;