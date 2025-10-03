const express = require('express');
const { query, validationResult } = require('express-validator');
const MeterReading = require('../models/MeterReading');

const router = express.Router();

// Get latest readings for dashboard (no auth for testing)
router.get('/latest', async (req, res) => {
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

// Get meter statistics (no auth for testing)
router.get('/stats/summary', async (req, res) => {
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
          uniqueMeters: { $addToSet: '$meterId' }
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
          uniqueMeters: { $size: '$uniqueMeters' }
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
        uniqueMeters: 0
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

// Get all meter readings with filtering and pagination (no auth for testing)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('meterId').optional().isString(),
  query('quality').optional().isIn(['good', 'estimated', 'questionable'])
], async (req, res) => {
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

module.exports = router;