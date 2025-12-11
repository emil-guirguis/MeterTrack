// @ts-nocheck
const express = require('express');
const User = require('../models/UserWithSchema');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

// Get all users with filtering and pagination
router.get('/', requirePermission('user:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      role,
      status
    } = req.query;

    // Build where clause for User
    const where = {};
    if (search) where.name = search; // Assuming search by name
    if (role) where.role = role;
    if (status) where.status = status;

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenantId: req.user?.tenantId // Automatic tenant filtering
    };

    // Get users
    const result = await User.findAll(options);

    res.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Get single user by ID
router.get('/:id', requirePermission('user:read'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Create user
router.post('/', requirePermission('user:create'), async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', requirePermission('user:update'), async (req, res) => {
  try {
    // Find the user first
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove password from update data - use separate endpoint for password changes
    const updateData = { ...req.body };
    delete updateData.password;
    
    // Update the user using instance method
    await user.update(updateData);
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Change user password
router.put('/:id/password', requirePermission('user:update'), async (req, res) => {
  try {
    const { password, currentPassword } = req.body;
    const userId = req.params.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Delete user
router.delete('/:id', requirePermission('user:delete'), async (req, res) => {
  try {
    // Find the user first
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Delete the user using instance method
    await user.delete();
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

module.exports = router;