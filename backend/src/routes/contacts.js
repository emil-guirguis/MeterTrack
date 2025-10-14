const express = require('express');
const Contact = require('../models/ContactPG'); // Updated to use PostgreSQL model
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
      status,
      category
    } = req.query;

    // Build filters for ContactPG
    const filters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (category) filters.category = category;
    filters.limit = parseInt(limit);
    filters.offset = (parseInt(page) - 1) * parseInt(limit);

    // Get contacts
    const contacts = await Contact.findAll(filters);

    // Get total count for pagination
    const total = await Contact.countAll(filters);

    res.json({
      success: true,
      data: {
        items: contacts,
        total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
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

// Bulk update contact status
router.patch('/bulk/status', requirePermission('contact:update'), async (req, res) => {
  try {
    const { contactIds, status } = req.body;
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Contact IDs are required' });
    }
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const result = await Contact.updateMany(
      { _id: { $in: contactIds } },
      { status, updatedAt: new Date() }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} contacts`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error bulk updating contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to update contacts' });
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
          activeContacts: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveContacts: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
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