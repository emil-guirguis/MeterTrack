const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Building = require('../models/Building');
const Equipment = require('../models/Equipment');
const Meter = require('../models/Meter');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Helper: map Building instance to frontend response shape
function mapBuildingToResponse(b) {
  if (!b) return null;
  return {
    id: b.id,
    name: b.name,
    type: b.type,
    status: b.status,
    address: {
      street: b.address_street,
      city: b.address_city,
      state: b.address_state,
      zipCode: b.address_zip_code,
      country: b.address_country
    },
    contact: {
      primaryContact: b.contact_primarycontact,
      email: b.contact_email,
      phone: b.contact_phone,
      website: b.contact_website
    },
    // Keep backward compatible aliases expected by frontend
    contactInfo: {
      primaryContact: b.contact_primarycontact,
      email: b.contact_email,
      phone: b.contact_phone,
      website: b.contact_website
    },
    totalFloors: b.totalfloors,
    totalUnits: b.totalunits,
    yearBuilt: b.yearbuilt,
    squareFootage: b.squarefootage,
    description: b.description,
    notes: b.notes,
    equipmentCount: b.equipmentcount,
    meterCount: b.metercount,
    createdAt: b.createdat,
    updatedAt: b.updatedat
  };
}

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

    const numericPage = parseInt(page);
    const numericPageSize = parseInt(pageSize);
    const skip = (numericPage - 1) * numericPageSize;

    // Use PG model findAll with filters
    const filters = {
      type: filterType || undefined,
      status: filterStatus || undefined,
      search: search || undefined
    };

    const allBuildings = await Building.findAll(filters);
    
    // Sort in-memory
    const sortKeyMap = {
      name: 'name',
      city: 'address_city',
      state: 'address_state',
      type: 'type',
      status: 'status',
      createdAt: 'createdat'
    };
    const key = sortKeyMap[sortBy] || 'name';
    const sorted = allBuildings.sort((a, b) => {
      const va = (a[key] ?? '').toString().toLowerCase();
      const vb = (b[key] ?? '').toString().toLowerCase();
      if (va < vb) return sortOrder === 'desc' ? 1 : -1;
      if (va > vb) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    const total = sorted.length;
    const buildings = sorted.slice(skip, skip + numericPageSize).map(mapBuildingToResponse);

    res.json({
      success: true,
      data: {
        items: buildings,
        pagination: {
          currentPage: numericPage,
          pageSize: numericPageSize,
          totalItems: total,
          totalPages: Math.ceil(total / numericPageSize),
          hasNextPage: numericPage < Math.ceil(total / numericPageSize),
          hasPreviousPage: numericPage > 1
        }
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
router.get('/:id', requirePermission('building:read'), async (req, res, next) => {
  try {
    // Allow explicitly defined routes like /stats or /bulk-status to pass through
    if (req.params.id === 'stats' || req.params.id === 'bulk-status') {
      return next();
    }

    const building = await Building.findById(req.params.id);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    res.json({
      success: true,
      data: mapBuildingToResponse(building)
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

    const payload = req.body;
    // Map request body to PG fields
    const toCreate = {
      name: payload.name,
      address_street: payload.address.street,
      address_city: payload.address.city,
      address_state: payload.address.state,
      address_zip_code: payload.address.zipCode,
      address_country: payload.address.country ?? 'USA',
      contact_primarycontact: payload.contactInfo?.primaryContact,
      contact_email: payload.contactInfo.email,
      contact_phone: payload.contactInfo.phone,
      contact_website: payload.contactInfo?.website,
      type: payload.type,
      status: payload.status || 'active',
      totalfloors: payload.totalFloors,
      totalunits: payload.totalUnits,
      yearbuilt: payload.yearBuilt,
      squarefootage: payload.squareFootage,
      description: payload.description,
      notes: payload.notes
    };

    const building = await Building.create(toCreate);

    res.status(201).json({
      success: true,
      data: mapBuildingToResponse(building),
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

    const current = await Building.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    const payload = req.body;
    const updates = {};

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.type !== undefined) updates.type = payload.type;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.totalFloors !== undefined) updates.totalfloors = payload.totalFloors;
    if (payload.totalUnits !== undefined) updates.totalunits = payload.totalUnits;
    if (payload.yearBuilt !== undefined) updates.yearbuilt = payload.yearBuilt;
    if (payload.squareFootage !== undefined) updates.squarefootage = payload.squareFootage;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.notes !== undefined) updates.notes = payload.notes;
    if (payload.address) {
      if (payload.address.street !== undefined) updates.address_street = payload.address.street;
      if (payload.address.city !== undefined) updates.address_city = payload.address.city;
      if (payload.address.state !== undefined) updates.address_state = payload.address.state;
      if (payload.address.zipCode !== undefined) updates.address_zip_code = payload.address.zipCode;
      if (payload.address.country !== undefined) updates.address_country = payload.address.country;
    }
    if (payload.contactInfo) {
      if (payload.contactInfo.primaryContact !== undefined) updates.contact_primarycontact = payload.contactInfo.primaryContact;
      if (payload.contactInfo.email !== undefined) updates.contact_email = payload.contactInfo.email;
      if (payload.contactInfo.phone !== undefined) updates.contact_phone = payload.contactInfo.phone;
      if (payload.contactInfo.website !== undefined) updates.contact_website = payload.contactInfo.website;
    }

    const updated = await current.update(updates);

    res.json({
      success: true,
      data: mapBuildingToResponse(updated),
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
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    // Check if building has associated equipment or meters
    const [equipmentList, metersList] = await Promise.all([
      Equipment.findAll({ buildingid: req.params.id }),
      Meter.findAll({ location_building: building.name })
    ]);

    const equipmentCount = equipmentList.length;
    const meterCount = metersList.length;

    if (equipmentCount > 0 || meterCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete building. It has ${equipmentCount} equipment items and ${meterCount} meters associated with it.`
      });
    }

    await building.delete();

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
  body('buildingIds.*').isUUID().withMessage('Invalid building ID'),
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
    let modifiedCount = 0;
    for (const id of buildingIds) {
      const b = await Building.findById(id);
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
      message: `${modifiedCount} buildings updated successfully`
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
    const all = await Building.findAll();
    const total = all.length;
    const active = all.filter(b => b.status === 'active').length;
    const inactive = all.filter(b => b.status === 'inactive').length;
    const maintenance = all.filter(b => b.status === 'maintenance').length;
    const byType = all.reduce((acc, b) => {
      const key = b.type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const squareValues = all.map(b => Number(b.squarefootage) || 0);
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
    console.error('Get building stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch building statistics'
    });
  }
});

module.exports = router;