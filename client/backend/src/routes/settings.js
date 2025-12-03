const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const SettingsService = require('../services/settingsService');

const router = express.Router();
router.use(authenticateToken);

// Get company settings
router.get('/company', requirePermission('settings:read'), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found in user context'
      });
    }
    
    const settings = await SettingsService.getCompanySettings(tenantId);
    
    res.json({ 
      success: true, 
      data: settings 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching company settings:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch company settings',
      error: errorMessage 
    });
  }
});

// Update company settings
router.put('/company', requirePermission('settings:update'), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found in user context'
      });
    }
    
    console.log('Updating company settings with data:', req.body);
    const dbData = SettingsService.formatForDatabase(req.body);
    const settings = await SettingsService.updateCompanySettings(tenantId, dbData);
    
    res.json({ 
      success: true, 
      data: settings,
      message: 'Company settings updated successfully'
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error updating company settings:', err);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update company settings',
      error: errorMessage 
    });
  }
});

// Legacy endpoint for backward compatibility
router.get('/', requirePermission('settings:read'), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found in user context'
      });
    }
    
    const settings = await SettingsService.getCompanySettings(tenantId);
    
    res.json({ 
      success: true, 
      data: { company: settings } 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching settings:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch settings',
      error: errorMessage 
    });
  }
});

module.exports = router;