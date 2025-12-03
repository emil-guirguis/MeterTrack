const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Location = require('../models/LocationWithSchema');
const Meter = require('../models/MeterWithSchema');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Helper: map Location instance to frontend response shape
function mapLocationToResponse(b) {
  if (!b) return null;
  return {
    id: b.id,
    name: b.name,
    type: b.type,
    status: b.status,
    address: {
      street: b.street,
      city: b.city,
      state: b.state,
      zipCode: b.zip,
      country: b.country
    },
    contact: {
      primaryContact: b.contact_id,
      email: null,
      phone: null,
      website: null
    },
    // Keep backward compatible aliases expected by frontend
    contactInfo: {
      primaryContact: b.contact_id,
      email: null,
      phone: null,
      website: null
    },
    totalFloors: null,
    squareFootage: b.square_footage,
    description: null,
    notes: b.notes,
    meterCount: null,
    createdAt: b.created_at,
    updatedAt: b.updated_at
  };
}

// Get all location with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isString()
], requirePermission('location:read'), async (req, res) => {
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

    const numericPage = parseInt(page);
    const numericPageSize = parseInt(pageSize);
    const offset = (numericPage - 1) * numericPageSize;

    // Build where clause for filtering
    const where = {};
    if (filterType) where.type = filterType;
    if (filterStatus) where.status = filterStatus;
    if (search) {
      // Search in name, city, or state
      where.name = { like: `%${search}%` };
    }

    // Map sortBy to database column names
    const sortKeyMap = {
      name: 'name',
      city: 'city',
      state: 'state',
      type: 'type',
      status: 'status',
      createdAt: 'created_at'
    };
    const orderColumn = sortKeyMap[sortBy] || 'name';
    const orderDirection = sortOrder.toUpperCase();

    // Use BaseModel's findAll with proper options
    console.log('🔍 Location findAll called with:', {
      where,
      order: [[orderColumn, orderDirection]],
      limit: numericPageSize,
      offset
    });

    const result = await Location.findAll({
      where,
      order: [[orderColumn, orderDirection]],
      limit: numericPageSize,
      offset,
      tenantId: req.user?.tenantId // Automatic tenant filtering
    });

    console.log('✅ Location .result:', {
      rowCount: result.rows?.length,
      total: result.pagination?.total,
      hasRows: !!result.rows
    });

    const location = result.rows.map(mapLocationToResponse);
    const total = result.pagination.total || 0;
    const totalPages = result.pagination.totalPages || 1;
    const currentPage = result.pagination.currentPage || numericPage;

    res.json({
      success: true,
      data: {
        items: location,
        pagination: {
          currentPage,
          pageSize: numericPageSize,
          totalItems: total,
          totalPages,
          hasNextPage: result.pagination.hasNextPage || false,
          hasPreviousPage: result.pagination.hasPreviousPage || false
        }
      }
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location'
    });
  }
});

// Get location by ID
router.get('/:id', requirePermission('location:read'), async (req, res, next) => {
  try {
    // Allow explicitly defined routes like /stats or /bulk-status to pass through
    if (req.params.id === 'stats' || req.params.id === 'bulk-status') {
      return next();
    }

    const location = await Location.findById(req.params.id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: mapLocationToResponse(location)
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location'
    });
  }
});

// Create new location
router.post('/', [
  body('name').notEmpty().trim().withMessage('Location name is required'),
  body('address.street').notEmpty().trim().withMessage('Street address is required'),
  body('address.city').notEmpty().trim().withMessage('City is required'),
  body('address.state').notEmpty().trim().withMessage('State is required'),
  body('address.zipCode').notEmpty().trim().withMessage('ZIP code is required'),
  body('address.country').optional().trim(),
  body('contactInfo.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('contactInfo.phone').notEmpty().trim().withMessage('Phone number is required'),
  body('type').isIn(['office', 'warehouse', 'retail', 'residential', 'industrial']).withMessage('Valid location type is required'),
  body('totalFloors').optional().isInt({ min: 1 }),
  body('totalUnits').optional().isInt({ min: 0 }),
  body('yearBuilt').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
  body('squareFootage').optional().isInt({ min: 1 })
], requirePermission('location:create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const payload = req.body;
    // Map request body to PG fields
    const toCreate = {
      name: payload.name,
      street: payload.address.street,
      street2: payload.address.street2,
      city: payload.address.city,
      state: payload.address.state,
      zip: payload.address.zipCode,
      country: payload.address.country ?? 'USA',
      contact_id: payload.contactInfo?.primaryContact,
      type: payload.type,
      status: payload.status || 'active',
      square_footage: payload.squareFootage,
      notes: payload.notes,
      active: true
    };

    const location = await Location.create(toCreate);

    res.status(201).json({
      success: true,
      data: mapLocationToResponse(location),
      message: 'Location created successfully'
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location'
    });
  }
});

// Update location
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
], requirePermission('location:update'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const current = await Location.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const payload = req.body;
    const updates = {};

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.type !== undefined) updates.type = payload.type;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.squareFootage !== undefined) updates.square_footage = payload.squareFootage;
    if (payload.notes !== undefined) updates.notes = payload.notes;
    if (payload.address) {
      if (payload.address.street !== undefined) updates.street = payload.address.street;
      if (payload.address.street2 !== undefined) updates.street2 = payload.address.street2;
      if (payload.address.city !== undefined) updates.city = payload.address.city;
      if (payload.address.state !== undefined) updates.state = payload.address.state;
      if (payload.address.zipCode !== undefined) updates.zip = payload.address.zipCode;
      if (payload.address.country !== undefined) updates.country = payload.address.country;
    }
    if (payload.contactInfo) {
      if (payload.contactInfo.primaryContact !== undefined) updates.contact_id = payload.contactInfo.primaryContact;
    }

    const updated = await current.update(updates);

    res.json({
      success: true,
      data: mapLocationToResponse(updated),
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Delete location
router.delete('/:id', requirePermission('location:delete'), async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    // Check if location has associated meters
    const metersResult = await Meter.findAll({ 
      where: { location_id: req.params.id },
      tenantId: req.user?.tenantId
    });
    const meterCount = metersResult?.rows?.length || 0;

    if (meterCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete location. It has ${meterCount} meters associated with it.`
      });
    }

    await location.delete();

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location'
    });
  }
});

// Bulk update location status
router.patch('/bulk-status', [
  body('locationIds').isArray().withMessage('Location IDs must be an array'),
  body('locationIds.*').isInt().withMessage('Invalid location ID'),
  body('status').isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status')
], requirePermission('location:update'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { locationIds, status } = req.body;
    let modifiedCount = 0;
    for (const id of locationIds) {
      const b = await Location.findById(id);
      if (b) {
        await b.update({ status });
        modifiedCount++;
      }
    }

    res.json({
      success: true,
      data: {
        modifiedCount
      },
      message: `${modifiedCount} location updated successfully`
    });
  } catch (error) {
    console.error('Bulk update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Get location statistics
router.get('/stats', requirePermission('location:read'), async (req, res) => {
  try {
    const result = await Location.findAll({ tenantId: req.user?.tenantId });
    const all = result.rows || [];
    const total = all.length;
    const active = all.filter(b => b.status === 'active').length;
    const inactive = all.filter(b => b.status === 'inactive').length;
    const maintenance = all.filter(b => b.status === 'maintenance').length;
    const byType = all.reduce((acc, b) => {
      const key = b.type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const squareValues = all.map(b => Number(b.square_footage) || 0);
    const totalSquareFootage = squareValues.reduce((sum, v) => sum + v, 0);
    const countNonZero = squareValues.filter(v => v > 0).length;
    const averageSquareFootage = countNonZero > 0 ? Math.round(totalSquareFootage / countNonZero) : 0;

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        maintenance,
        byType,
        totalSquareFootage,
        averageSquareFootage
      }
    });
  } catch (error) {
    console.error('Get location stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location statistics'
    });
  }
});

module.exports = router;