const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isString()
], requirePermission('user:read'), async (req, res) => {
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
      'filter.role': filterRole,
      'filter.status': filterStatus
    } = req.query;

    // Build PostgreSQL query filters
    const filters = {};
    
    // Apply filters
    if (filterRole) filters.role = filterRole;
    if (filterStatus) filters.status = filterStatus;
    
    // Apply search - PostgreSQL version with ILIKE
    if (search) {
      // Pass search directly to the model
    }

    // Execute query with pagination using PostgreSQL model
    const offset = (page - 1) * pageSize;
    const result = await User.findAll({
      filters,
      sortBy,
      sortOrder,
      limit: parseInt(pageSize),
      offset,
      search
    });

    res.json({
      success: true,
      data: {
        items: result.users,
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(result.total / pageSize),
        hasMore: offset + result.users.length < result.total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user by ID
router.get('/:id', requirePermission('user:read'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Create new user
router.post('/', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('role').isIn(['admin', 'manager', 'technician', 'viewer']).withMessage('Valid role is required'),
  body('permissions').optional().isArray(),
  body('status').optional().isIn(['active', 'inactive'])
], requirePermission('user:create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Update user
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'manager', 'technician', 'viewer']),
  body('permissions').optional().isArray(),
  body('status').optional().isIn(['active', 'inactive'])
], requirePermission('user:update'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Remove password from update data - use separate endpoint for password changes
    const updateData = { ...req.body };
    delete updateData.password;

    // First find the user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update the user
    await user.update(updateData);

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Change user password
router.put('/:id/password', [
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('currentPassword').optional().notEmpty().withMessage('Current password is required for own password change')
], requirePermission('user:update'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password, currentPassword } = req.body;
    const userId = req.params.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is changing their own password, verify current password
    if (req.user.id === userId && currentPassword) {
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Update password using the updatePassword method
    await user.updatePassword(password);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Delete user
router.delete('/:id', requirePermission('user:delete'), async (req, res) => {
  try {
    // First find the user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete the user (soft delete)
    await user.delete();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;