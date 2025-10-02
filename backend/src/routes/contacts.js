const express = require('express');
const Contact = require('../models/Contact');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get all contacts
router.get('/', requirePermission('contact:read'), async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json({ success: true, data: { items: contacts, total: contacts.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
});

// Create contact
router.post('/', requirePermission('contact:create'), async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create contact' });
  }
});

module.exports = router;