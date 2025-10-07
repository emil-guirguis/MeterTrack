const express = require('express');
const { query, validationResult } = require('express-validator');
const MeterReading = require('../models/MeterReading');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes (temporarily disabled for testing)
// router.use(authenticateToken);

// Get all meter readings with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('meterId').optional().isString(),
  query('quality').optional().isIn(['good', 'estimated', 'questionable'])
], requirePermission('meter:read'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      pageSize = 20,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      meterId,
      quality
    } = req.query;

    // Build query
    const query = {};
    
    // Apply filters
    if (meterId) query.meterId = meterId;
    if (quality) query.quality = quality;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * pageSize;
    const [readings, total] = await Promise.all([
      MeterReading.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(pageSize)),
      MeterReading.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        items: readings,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + readings.length < total
      }
    });
  } catch (error) {
    console.error('Get meter readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings'
    });
  }
});

// Get latest readings for dashboard
router.get('/latest', requirePermission('meter:read'), async (req, res) => {
  try {
    // Get the latest reading for each meter
    const latestReadings = await MeterReading.aggregate([
      {
        $sort: { meterId: 1, timestamp: -1 }
      },
      {
        $group: {
          _id: '$meterId',
          latestReading: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestReading' }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $limit: 10 // Limit to 10 most recent readings
      }
    ]);

    res.json({
      success: true,
      data: latestReadings
    });
  } catch (error) {
    console.error('Get latest readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest readings'
    });
  }
});

// Get meter reading by ID
router.get('/:id', requirePermission('meter:read'), async (req, res) => {
  try {
    const reading = await MeterReading.findById(req.params.id);
    
    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Meter reading not found'
      });
    }

    res.json({
      success: true,
      data: reading
    });
  } catch (error) {
    console.error('Get meter reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter reading'
    });
  }
});

// Get readings by meter ID
router.get('/meter/:meterId', [
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], requirePermission('meter:read'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { meterId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    // Build query
    const query = { meterId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const readings = await MeterReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: readings
    });
  } catch (error) {
    console.error('Get meter readings by meter ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings'
    });
  }
});

// Get meter statistics
router.get('/stats/summary', requirePermission('meter:read'), async (req, res) => {
  try {
    const stats = await MeterReading.aggregate([
      {
        $group: {
          _id: null,
          totalReadings: { $sum: 1 },
          totalKWh: { $sum: '$kWh' },
          totalKVAh: { $sum: '$kVAh' },
          totalKVARh: { $sum: '$kVARh' },
          avgPowerFactor: { $avg: '$dPF' },
          avgVoltage: { $avg: '$V' },
          avgCurrent: { $avg: '$A' },
          maxKWpeak: { $max: '$kWpeak' },
          uniqueMeters: { $addToSet: '$meterId' },
          
          // Extended statistics for new fields
          totalActiveEnergyWh: { $sum: '$totalActiveEnergyWh' },
          totalReactiveEnergyVARh: { $sum: '$totalReactiveEnergyVARh' },
          totalApparentEnergyVAh: { $sum: '$totalApparentEnergyVAh' },
          avgTotalReactivePower: { $avg: '$totalReactivePower' },
          avgTotalApparentPower: { $avg: '$totalApparentPower' },
          avgTemperature: { $avg: '$temperatureC' },
          avgNeutralCurrent: { $avg: '$neutralCurrent' },
          avgVoltageThd: { $avg: '$voltageThd' },
          avgCurrentThd: { $avg: '$currentThd' },
          maxDemandKW: { $max: '$maxDemandKW' },
          maxDemandKVAR: { $max: '$maxDemandKVAR' },
          maxDemandKVA: { $max: '$maxDemandKVA' },
          
          // Phase averages
          avgPhaseAVoltage: { $avg: '$phaseAVoltage' },
          avgPhaseBVoltage: { $avg: '$phaseBVoltage' },
          avgPhaseCVoltage: { $avg: '$phaseCVoltage' },
          avgPhaseACurrent: { $avg: '$phaseACurrent' },
          avgPhaseBCurrent: { $avg: '$phaseBCurrent' },
          avgPhaseCCurrent: { $avg: '$phaseCCurrent' },
          avgPhaseAPower: { $avg: '$phaseAPower' },
          avgPhaseBPower: { $avg: '$phaseBPower' },
          avgPhaseCPower: { $avg: '$phaseCPower' },
          
          // Line-to-line voltage averages
          avgLineToLineVoltageAB: { $avg: '$lineToLineVoltageAB' },
          avgLineToLineVoltageBC: { $avg: '$lineToLineVoltageBC' },
          avgLineToLineVoltageCA: { $avg: '$lineToLineVoltageCA' }
        }
      },
      {
        $project: {
          _id: 0,
          totalReadings: 1,
          totalKWh: { $round: ['$totalKWh', 2] },
          totalKVAh: { $round: ['$totalKVAh', 2] },
          totalKVARh: { $round: ['$totalKVARh', 2] },
          avgPowerFactor: { $round: ['$avgPowerFactor', 3] },
          avgVoltage: { $round: ['$avgVoltage', 1] },
          avgCurrent: { $round: ['$avgCurrent', 1] },
          maxKWpeak: { $round: ['$maxKWpeak', 1] },
          uniqueMeters: { $size: '$uniqueMeters' },
          
          // Extended statistics
          totalActiveEnergyWh: { $round: ['$totalActiveEnergyWh', 2] },
          totalReactiveEnergyVARh: { $round: ['$totalReactiveEnergyVARh', 2] },
          totalApparentEnergyVAh: { $round: ['$totalApparentEnergyVAh', 2] },
          avgTotalReactivePower: { $round: ['$avgTotalReactivePower', 1] },
          avgTotalApparentPower: { $round: ['$avgTotalApparentPower', 1] },
          avgTemperature: { $round: ['$avgTemperature', 1] },
          avgNeutralCurrent: { $round: ['$avgNeutralCurrent', 2] },
          avgVoltageThd: { $round: ['$avgVoltageThd', 2] },
          avgCurrentThd: { $round: ['$avgCurrentThd', 2] },
          maxDemandKW: { $round: ['$maxDemandKW', 1] },
          maxDemandKVAR: { $round: ['$maxDemandKVAR', 1] },
          maxDemandKVA: { $round: ['$maxDemandKVA', 1] },
          
          // Phase averages
          avgPhaseAVoltage: { $round: ['$avgPhaseAVoltage', 1] },
          avgPhaseBVoltage: { $round: ['$avgPhaseBVoltage', 1] },
          avgPhaseCVoltage: { $round: ['$avgPhaseCVoltage', 1] },
          avgPhaseACurrent: { $round: ['$avgPhaseACurrent', 2] },
          avgPhaseBCurrent: { $round: ['$avgPhaseBCurrent', 2] },
          avgPhaseCCurrent: { $round: ['$avgPhaseCCurrent', 2] },
          avgPhaseAPower: { $round: ['$avgPhaseAPower', 1] },
          avgPhaseBPower: { $round: ['$avgPhaseBPower', 1] },
          avgPhaseCPower: { $round: ['$avgPhaseCPower', 1] },
          
          // Line-to-line voltage averages
          avgLineToLineVoltageAB: { $round: ['$avgLineToLineVoltageAB', 1] },
          avgLineToLineVoltageBC: { $round: ['$avgLineToLineVoltageBC', 1] },
          avgLineToLineVoltageCA: { $round: ['$avgLineToLineVoltageCA', 1] }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalReadings: 0,
        totalKWh: 0,
        totalKVAh: 0,
        totalKVARh: 0,
        avgPowerFactor: 0,
        avgVoltage: 0,
        avgCurrent: 0,
        maxKWpeak: 0,
        uniqueMeters: 0,
        totalActiveEnergyWh: 0,
        totalReactiveEnergyVARh: 0,
        totalApparentEnergyVAh: 0,
        avgTotalReactivePower: 0,
        avgTotalApparentPower: 0,
        avgTemperature: 0,
        avgNeutralCurrent: 0,
        avgVoltageThd: 0,
        avgCurrentThd: 0,
        maxDemandKW: 0,
        maxDemandKVAR: 0,
        maxDemandKVA: 0,
        avgPhaseAVoltage: 0,
        avgPhaseBVoltage: 0,
        avgPhaseCVoltage: 0,
        avgPhaseACurrent: 0,
        avgPhaseBCurrent: 0,
        avgPhaseCCurrent: 0,
        avgPhaseAPower: 0,
        avgPhaseBPower: 0,
        avgPhaseCPower: 0,
        avgLineToLineVoltageAB: 0,
        avgLineToLineVoltageBC: 0,
        avgLineToLineVoltageCA: 0
      }
    });
  } catch (error) {
    console.error('Get meter stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter statistics'
    });
  }
});

module.exports = router;