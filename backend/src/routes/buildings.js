const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Building = require('../models/Building');
const Equipment = require('../models/Equipment');
const Meter = require('../models/Meter');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all buildings with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isString()
], requirePermission('building:read'), async (req, res) => {
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
      sortBy = 'name',
      sortOrder = 'asc',
      search,
      'filter.type': filterType,
      'filter.status': filterStatus,
      'filter.city': filterCity
    } = req.query;

    // Build query
    const query = {};
    
    // Apply filters
    if (filterType) query.type = filterType;
    if (filterStatus) query.status = filterStatus;
    if (filterCity) query['address.city'] = new RegExp(filterCity, 'i');
    
    // Apply search
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { 'address.city': new RegExp(search, 'i') },
        { 'address.state': new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * pageSize;
    const [buildings, total] = await Promise.all([
      Building.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(pageSize)),
      Building.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        items: buildings,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + buildings.length < total
      }
    });
  } catch (error) {
    console.error('Get buildings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buildings'
    });
  }
});

// Get building by ID
router.get('/:id', requirePermission('building:read'), async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    res.json({
      success: true,
      data: building
    });
  } catch (error) {
    console.error('Get building error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch building'
    });
  }
});

// Create new building
router.post('/', [
  body('name').notEmpty().trim().withMessage('Building name is required'),
  body('address.street').notEmpty().trim().withMessage('Street address is required'),
  body('address.city').notEmpty().trim().withMessage('City is required'),
  body('address.state').notEmpty().trim().withMessage('State is required'),
  body('address.zipCode').notEmpty().trim().withMessage('ZIP code is required'),
  body('address.country').optional().trim(),
  body('contactInfo.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('contactInfo.phone').notEmpty().trim().withMessage('Phone number is required'),
  body('type').isIn(['office', 'warehouse', 'retail', 'residential', 'industrial']).withMessage('Valid building type is required'),
  body('totalFloors').optional().isInt({ min: 1 }),
  body('totalUnits').optional().isInt({ min: 0 }),
  body('yearBuilt').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
  body('squareFootage').optional().isInt({ min: 1 })
], requirePermission('building:create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const building = new Building(req.body);
    await building.save();

    res.status(201).json({
      success: true,
      data: building,
      message: 'Building created successfully'
    });
  } catch (error) {
    console.error('Create building error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create building'
    });
  }
});

// Update building
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('address.street').optional().notEmpty().trim(),
  body('address.city').optional().notEmpty().trim(),
  body('address.state').optional().notEmpty().trim(),
  body('address.zipCode').optional().notEmpty().trim(),
  body('contactInfo.email').optional().isEmail().normalizeEmail(),
  body('contactInfo.phone').optional().notEmpty().trim(),
  body('type').optional().isIn(['office', 'warehouse', 'retail', 'residential', 'industrial']),
  body('status').optional().isIn(['active', 'inactive', 'maintenance']),
  body('totalFloors').optional().isInt({ min: 1 }),
  body('totalUnits').optional().isInt({ min: 0 }),
  body('yearBuilt').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
  body('squareFootage').optional().isInt({ min: 1 })
], requirePermission('building:update'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const building = await Building.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    res.json({
      success: true,
      data: building,
      message: 'Building updated successfully'
    });
  } catch (error) {
    console.error('Update building error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update building'
    });
  }
});

// Delete building
router.delete('/:id', requirePermission('building:delete'), async (req, res) => {
  try {
    // Check if building has associated equipment or meters
    const [equipmentCount, meterCount] = await Promise.all([
      Equipment.countDocuments({ buildingId: req.params.id }),
      Meter.countDocuments({ buildingId: req.params.id })
    ]);

    if (equipmentCount > 0 || meterCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete building. It has ${equipmentCount} equipment items and ${meterCount} meters associated with it.`
      });
    }

    const building = await Building.findByIdAndDelete(req.params.id);

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    res.json({
      success: true,
      message: 'Building deleted successfully'
    });
  } catch (error) {
    console.error('Delete building error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete building'
    });
  }
});

// Bulk update building status
router.patch('/bulk-status', [
  body('buildingIds').isArray().withMessage('Building IDs must be an array'),
  body('buildingIds.*').isMongoId().withMessage('Invalid building ID'),
  body('status').isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status')
], requirePermission('building:update'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { buildingIds, status } = req.body;

    const result = await Building.updateMany(
      { _id: { $in: buildingIds } },
      { status }
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      },
      message: `${result.modifiedCount} buildings updated successfully`
    });
  } catch (error) {
    console.error('Bulk update buildings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update buildings'
    });
  }
});

// Get building statistics
router.get('/stats', requirePermission('building:read'), async (req, res) => {
  try {
    const [
      total,
      active,
      inactive,
      maintenance,
      byType,
      totalSquareFootage,
      averageSquareFootage
    ] = await Promise.all([
      Building.countDocuments(),
      Building.countDocuments({ status: 'active' }),
      Building.countDocuments({ status: 'inactive' }),
      Building.countDocuments({ status: 'maintenance' }),
      Building.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Building.aggregate([
        { $group: { _id: null, total: { $sum: '$squareFootage' } } }
      ]),
      Building.aggregate([
        { $group: { _id: null, average: { $avg: '$squareFootage' } } }
      ])
    ]);

    const typeStats = {};
    byType.forEach(item => {
      typeStats[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        maintenance,
        byType: typeStats,
        totalSquareFootage: totalSquareFootage[0]?.total || 0,
        averageSquareFootage: Math.round(averageSquareFootage[0]?.average || 0)
      }
    });
  } catch (error) {
    console.error('Get building stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch building statistics'
    });
  }
});

module.exports = router;