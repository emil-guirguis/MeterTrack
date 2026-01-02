// @ts-nocheck
const express = require('express');
const Contact = require('../models/ContactWithSchema.js');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

// Get all contacts with filtering and pagination
router.get('/', requirePermission('contact:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search
    } = req.query;

    console.log('\n' + '='.repeat(80));
    console.log('[API] GET /contacts - Fetch Contacts');
    console.log('='.repeat(80));
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('='.repeat(80) + '\n');

    // Build where clause for Contact
    let where = {};
    
    // Handle search parameter
    if (search) {
      where.name = search; // Assuming search by name
    }

    // Use framework method to process filters from query parameters
    const filters = Contact.processFilters(req.query);
    where = { ...where, ...filters };

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenantId: req.user?.tenantId // Automatic tenant filtering
    };

    console.log('[API] Query options:', JSON.stringify(options, null, 2));

    // Get contacts
    const result = await Contact.findAll(options);

    console.log('[API] Query result - items count:', result.rows.length, 'total:', result.pagination.total);
    console.log('='.repeat(80) + '\n');

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
  console.log('\n' + '='.repeat(80));
  console.log('[API] PUT /contacts/:id - Update Contact');
  console.log('='.repeat(80));
  console.log('Contact ID:', req.params.id);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('='.repeat(80) + '\n');
  
  try {
    // Find the contact first
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    // Update the contact using instance method
    await contact.update(req.body);
    
    console.log('\n' + '='.repeat(80));
    console.log('[API] Contact Updated Successfully');
    console.log('='.repeat(80));
    console.log('Updated Contact:', JSON.stringify(contact, null, 2));
    console.log('='.repeat(80) + '\n');
    
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('[API ERROR] Failed to update contact');
    console.error('='.repeat(80));
    console.error('Error:', error);
    console.error('Error Stack:', error.stack);
    console.error('='.repeat(80) + '\n');
    
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
    // Find the contact first
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    // Delete the contact using instance method
    await contact.delete();
    
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