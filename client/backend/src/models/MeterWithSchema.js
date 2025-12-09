// @ts-nocheck
/**
 * Meter Model with Schema Definition
 * 
 * Uses centralized field configuration from meterFieldConfig.js
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field } = require('../../../../framework/backend/api/base/SchemaDefinition');
const db = require('../config/database');
const { getFormFields, getEntityFields, VALIDATION_RULES } = require('../config/meterFieldConfig');

class Meter extends BaseModel {
  constructor(meterData = {}) {
    super(meterData);

    // Auto-initialize all fields from schema
    // This eliminates the need to manually list every field!
    Meter.schema.initializeFromData(this, meterData);
  }

  // ===== TABLE NAME =====

  /**
   * Database table name
   * @override
   */
  static get tableName() {
    return 'meter';
  }

  /**
   * Primary key field name
   * @override
   */
  static get primaryKey() {
    return 'id';
  }

  /**
   * Relationships definition
   * @override
   */
  static get relationships() {
    return {
      device: {
        type: 'belongsTo',
        model: 'Device',
        foreignKey: 'device_id',
        targetKey: 'id'
      },
      location: {
        type: 'belongsTo',
        model: 'Location',
        foreignKey: 'location_id',
        targetKey: 'id'
      }
    };
  }

  // ===== SCHEMA DEFINITION (Single Source of Truth) =====

  /**
   * Schema definition - exposed to frontend via API
   * Uses centralized field configuration from meterFieldConfig.js
   * @override
   */
  static get schema() {
    // Convert field configs to schema format
    const formFieldsConfig = getFormFields();
    const entityFieldsConfig = getEntityFields();

    const formFieldsObj = Object.entries(formFieldsConfig).reduce((acc, [name, config]) => {
      acc[name] = field(config);
      return acc;
    }, {});

    const entityFieldsObj = Object.entries(entityFieldsConfig).reduce((acc, [name, config]) => {
      acc[name] = field(config);
      return acc;
    }, {});

    return defineSchema({
      entityName: 'Meter',
      tableName: 'meter',
      primarykey: 'id',
      description: 'Meter entity for managing electric, gas, water, and other utility meters',
      formFields: formFieldsObj,
      entityFields: entityFieldsObj,
      relationships: {
        device: {
          type: 'belongsTo',
          model: 'Device',
          foreignKey: 'device_id',
          targetKey: 'id'
        },
        location: {
          type: 'belongsTo',
          model: 'Location',
          foreignKey: 'location_id',
          targetKey: 'id'
        }
      },
      validation: VALIDATION_RULES,
    });
  }

  // ===== Custom Methods =====

  static async findByMeterId(id) {
    return this.findOne({ iid });
  }

  static async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_meters,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_meters,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_meters,
        COUNT(CASE WHEN type = 'electric' THEN 1 END) as electric_meters,
        COUNT(CASE WHEN type = 'gas' THEN 1 END) as gas_meters,
        COUNT(CASE WHEN type = 'water' THEN 1 END) as water_meters,
        COUNT(DISTINCT location_id) as locations_with_meters
      FROM meter
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  toJSON() {
    return {
      ...this,
    };
  }
}

module.exports = Meter;
