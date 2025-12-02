/**
 * Schema API Routes
 * 
 * Exposes entity schemas to the frontend.
 * This allows the frontend to dynamically fetch schema definitions
 * instead of duplicating them.
 * 
 * Endpoints:
 * - GET /api/schema/:entity - Get schema for a specific entity
 * - GET /api/schema - Get all available schemas
 */

const express = require('express');
const router = express.Router();

// Import models with schema definitions
// Add your models here as you create them
const meterReadingsModel = require('../models/MeterReadingsWithSchema');

const models = {
  meter: require('../models/MeterWithSchema'),
  contact: require('../models/ContactWithSchema'),
  device: require('../models/DeviceWithSchema'),
  location: require('../models/LocationWithSchema'),
  meterReadings: meterReadingsModel,
  meter_reading: meterReadingsModel, // Alias for frontend
  user: require('../models/UserWithSchema'),
  tenant: require('../models/TenantWithSchema'),
  emailLogs: require('../models/EmailLogsWithSchema'),
  emailTemplates: require('../models/EmailTemplatesWithSchema'),
  meterMaintenance: require('../models/MeterMaintenanceWithSchema'),
  meterMaps: require('../models/MeterMapsWithSchema'),
  meterMonitoringAlerts: require('../models/MeterMonitoringAlertsWithSchema'),
  meterStatusLog: require('../models/MeterStatusLogWithSchema'),
  meterTriggers: require('../models/MeterTriggersWithSchema'),
  meterUsageAlerts: require('../models/MeterUsageAlertsWithSchema'),
  notificationLogs: require('../models/NotificationLogsWithSchema'),
  // Add more models here
};

/**
 * GET /api/schema
 * Get list of all available schemas
 */
router.get('/', (req, res) => {
  try {
    const availableSchemas = Object.keys(models).map(entityName => {
      const model = models[entityName];
      const schema = model.schema;
      
      return {
        entityName: schema.schema.entityName,
        tableName: schema.schema.tableName,
        description: schema.schema.description,
        endpoint: `/api/schema/${entityName}`,
      };
    });

    res.json({
      success: true,
      data: {
        schemas: availableSchemas,
        count: availableSchemas.length,
      },
    });
  } catch (error) {
    console.error('Error fetching schema list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schema list',
      error: error.message,
    });
  }
});

/**
 * GET /api/schema/:entity
 * Get schema for a specific entity
 * 
 * @param {string} entity - Entity name (e.g., 'meter', 'location')
 * @returns {Object} Schema definition
 */
router.get('/:entity', (req, res) => {
  try {
    const { entity } = req.params;
    
    // Check if model exists
    if (!models[entity]) {
      return res.status(404).json({
        success: false,
        message: `Schema not found for entity: ${entity}`,
        availableEntities: Object.keys(models),
      });
    }

    // Get model and schema
    const model = models[entity];
    const schema = model.schema;

    // Return schema as JSON
    res.json({
      success: true,
      data: schema.toJSON(),
    });
  } catch (error) {
    console.error(`Error fetching schema for ${req.params.entity}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schema',
      error: error.message,
    });
  }
});

/**
 * POST /api/schema/:entity/validate
 * Validate data against entity schema
 * 
 * @param {string} entity - Entity name
 * @param {Object} body - Data to validate
 * @returns {Object} Validation result
 */
router.post('/:entity/validate', (req, res) => {
  try {
    const { entity } = req.params;
    const data = req.body;

    // Check if model exists
    if (!models[entity]) {
      return res.status(404).json({
        success: false,
        message: `Schema not found for entity: ${entity}`,
      });
    }

    // Get model and validate
    const model = models[entity];
    const schema = model.schema;
    const validation = schema.validate(data);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error(`Error validating data for ${req.params.entity}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate data',
      error: error.message,
    });
  }
});

module.exports = router;
