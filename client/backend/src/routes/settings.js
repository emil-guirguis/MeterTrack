const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const SettingsService = require('../services/settingsService');

const router = express.Router();
router.use(authenticateToken);

// Get company settings
router.get('/company', requirePermission('settings:read'), async (req, res) => {
  try {
    const settings = await SettingsService.getCompanySettings();
    
    res.json({ 
      success: true, 
      data: settings 
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
    console.log('Updating company settings with data:', req.body);
    const dbData = SettingsService.formatForDatabase(req.body);
    const settings = await SettingsService.updateCompanySettings(dbData);
    
    res.json({ 
      success: true, 
      data: settings,
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update company settings',
      error: error.message 
    });
  }
});

// Legacy endpoint for backward compatibility
router.get('/', requirePermission('settings:read'), async (req, res) => {
  try {
    const settings = await SettingsService.getCompanySettings();
    
    res.json({ 
      success: true, 
      data: { company: settings } 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch settings',
      error: error.message 
    });
  }
});

module.exports = router;