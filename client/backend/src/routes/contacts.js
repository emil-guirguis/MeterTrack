// @ts-nocheck
const express = require('express');
const Contact = require('../models/Contact.js');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get all contacts with filtering and pagination
router.get('/', requirePermission('contact:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      active,
      role
    } = req.query;

    // Build where clause for Contact
    const where = {};
    if (search) where.name = search; // Assuming search by name
    if (active !== undefined) where.active = active;
    if (role) where.role = role;

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    // Get contacts
    const result = await Contact.findAll(options);

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
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
});

// Get single contact by ID
router.get('/:id', requirePermission('contact:read'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact' });
  }
});

// Create contact
router.post('/', requirePermission('contact:create'), async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create contact' });
  }
});

// Update contact
router.put('/:id', requirePermission('contact:update'), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', requirePermission('contact:delete'), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
});


// Get contact statistics
router.get('/stats/overview', requirePermission('contact:read'), async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          customers: { $sum: { $cond: [{ $eq: ['$type', 'customer'] }, 1, 0] } },
          vendors: { $sum: { $cond: [{ $eq: ['$type', 'vendor'] }, 1, 0] } },
          activeContacts: { $sum: { $cond: [{ $eq: ['$active', 'true'] }, 1, 0] } },
          inactiveContacts: { $sum: { $cond: [{ $eq: ['$active', 'false'] }, 1, 0] } }
        }
      }
    ]);

    const industryStats = await Contact.aggregate([
      { $match: { industry: { $exists: true, $ne: null } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalContacts: 0,
          customers: 0,
          vendors: 0,
          activeContacts: 0,
          inactiveContacts: 0
        },
        topIndustries: industryStats
      }
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact statistics' });
  }
});

module.exports = router;