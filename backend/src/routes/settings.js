const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const CompanySettings = require('../models/CompanySettings');

const router = express.Router();
router.use(authenticateToken);

// Get company settings
router.get('/company', requirePermission('settings:read'), async (req, res) => {
  try {
    console.log('Fetching company settings...');
    let settings = await CompanySettings.findOne();
    console.log('Found settings:', settings ? 'Yes' : 'No');
    
    // If no settings exist, create default settings
    if (!settings) {
      console.log('Creating default settings...');
      settings = CompanySettings.createDefaultSettings();
      await settings.save();
      console.log('Default settings created');
    }
    
    const result = settings.toJSON();
    console.log('Returning settings with id:', result.id);
    
    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch company settings',
      error: error.message 
    });
  }
});

// Update company settings
router.put('/company', requirePermission('settings:update'), async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    // If no settings exist, create new ones with the provided data
    if (!settings) {
      settings = new CompanySettings(req.body);
    } else {
      // Update existing settings with provided data
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          if (typeof req.body[key] === 'object' && req.body[key] !== null && !Array.isArray(req.body[key])) {
            // For nested objects, merge with existing data
            settings[key] = { ...settings[key], ...req.body[key] };
          } else {
            // For primitive values, replace directly
            settings[key] = req.body[key];
          }
        }
      });
    }
    
    // Save the updated settings
    await settings.save();
    
    res.json({ 
      success: true, 
      data: settings.toJSON(),
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update company settings' 
    });
  }
});

// Legacy endpoint for backward compatibility
router.get('/', requirePermission('settings:read'), async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    if (!settings) {
      settings = CompanySettings.createDefaultSettings();
      await settings.save();
    }
    
    res.json({ 
      success: true, 
      data: { company: settings.toJSON() } 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch settings' 
    });
  }
});

module.exports = router;