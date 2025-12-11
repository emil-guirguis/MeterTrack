// @ts-nocheck
/**
 * Meter Model with Schema Definition
 * 
 * Single source of truth for Meter entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Meter extends BaseModel {
  constructor(data = {}) {
    super(data);

    // Auto-initialize all fields from schema
    // This eliminates the need to manually list every field!
    Meter.schema.initializeFromData(this, data);
  }

  /**
   * @override
   */
  static get tableName() {
    return 'meter';
  }

  /**
   * @override
   */
  static get primaryKey() {
    return 'id';
  }

  /**
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

  /**
   * @override
   */
  static get schema() {
    return defineSchema({
      entityName: 'Meter',
      tableName: 'meter',
      description: 'Meter entity for managing electric, gas, water, and other utility meters',

      customListColumns: {},


      // Form fields - user can edit these
      formFields: {
        name: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Meter Name',
          dbField: 'name',
          minLength: 3,
          maxLength: 100,
          placeholder: 'Enter meter name',
          showOn: ['list', 'form'],

        }),

        serial_number: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Serial Number',
          dbField: 'serial_number',
          maxLength: 200,
          placeholder: 'Enter serial number',
          showOn: ['list', 'form'],
        }),

        location_id: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: true,
          label: 'Location',
          dbField: 'location_id',
          min: 1,
          showOn: ['form'],
          validate: true,
          validationFields: ['name'],
        }),

        device_id: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: true,
          label: 'Device',
          dbField: 'device_id',
          min: 1,
          showOn: ['list', 'form'],
          validate: true,
          validationFields: ['manufacturer', 'model_number'],
        }),


        device: field({
          type: FieldTypes.STRING,
          default: '',
          readOnly: true,
          label: 'Device Manufacturer',
          dbField: null,
          showOn: ['list'],
        }),


        model: field({
          type: FieldTypes.STRING,
          default: '',
          readOnly: true,
          label: 'Model',
          dbField: null,
          showOn: ['list'],
        }),

        ip: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'IP Address',
          dbField: 'ip',
          placeholder: '192.168.1.100',
          showOn: ['list', 'form'],
        }),

        port: field({
          type: FieldTypes.NUMBER,
          default: 502,
          required: true,
          label: 'Port Number',
          dbField: 'port',
          min: 1,
          max: 65535,
          placeholder: '502',
          showOn: ['form'],
        }),

        type: field({
          type: FieldTypes.STRING,
          default: 'electric',
          required: true,
          label: 'Meter Type',
          dbField: 'type',
          enumValues: ['electric', 'gas', 'water', 'steam', 'other'],
          showOn: ['form'],
        }),

        notes: field({
          type: FieldTypes.STRING,
          default: '',
          required: false,
          label: 'Notes',
          dbField: 'notes',
          maxLength: 500,
          placeholder: 'Enter notes',
          showOn: ['form'],
        }),

        installation_date: field({
          type: FieldTypes.DATE,
          default: null,
          required: false,
          label: 'Installation Date',
          dbField: 'installation_date',
          placeholder: 'Select date',
          showOn: ['form'],
        }),

        register_map: field({
          type: FieldTypes.JSON,
          default: null,
          required: false,
          label: 'Register Map',
          dbField: 'register_map',
          showOn: ['form'],
        }),
      },

      // Entity fields - read-only, system-managed
      entityFields: {
        id: field({
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: true,
          label: 'ID',
          dbField: 'id',
        }),

        created_at: field({
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Created At',
          dbField: 'created_at',
        }),

        updated_at: field({
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Updated At',
          dbField: 'updated_at',
        }),

        tenant_id: field({
          type: FieldTypes.NUMBER,
          default: 0,
          readOnly: true,
          label: 'Tenant ID',
          dbField: 'tenant_id',
        }),
      },

      validation: {
        custom: (data) => {
          const errors = {};

          // Ensure port and IP are both provided or both empty
          if (data.ip && !data.port) {
            errors.port = 'Port number is required when IP address is provided';
          }
          if (data.port && !data.ip) {
            errors.ip = 'IP address is required when port number is provided';
          }

          return errors;
        },
      },
    });
  }

  // ===== Custom Methods =====

  static async getStats() {
    const db = this._getDb();
    const query = `
      SELECT
        COUNT(*) as total_meters,
        COUNT(CASE WHEN type = 'electric' THEN 1 END) as electric_meters,
        COUNT(CASE WHEN type = 'gas' THEN 1 END) as gas_meters,
        COUNT(CASE WHEN type = 'water' THEN 1 END) as water_meters,
        COUNT(DISTINCT location_id) as locations_with_meters
      FROM meter
    `;

    const result = await db.query(query);
    return result.rows[0];
  }
}

// ===== Helper Functions for Routes =====

/**
 * Build express-validator rules from schema
 */
function buildValidationRules() {
  const { body } = require('express-validator');
  const schema = Meter.schema.schema;
  const rules = [];

  // Combine form and entity fields
  const allFields = { ...schema.formFields, ...schema.entityFields };

  Object.entries(allFields).forEach(([fieldName, fieldDef]) => {
    // Skip read-only fields and computed fields
    if (fieldDef.readOnly || !fieldDef.dbField) {
      return;
    }

    let rule = body(fieldName).optional();

    // Apply type-specific validations
    switch (fieldDef.type) {
      case FieldTypes.STRING:
        rule = rule.trim();
        if (fieldDef.minLength) {
          rule = rule.isLength({ min: fieldDef.minLength });
        }
        if (fieldDef.maxLength) {
          rule = rule.isLength({ max: fieldDef.maxLength });
        }
        if (fieldDef.enumValues && Array.isArray(fieldDef.enumValues)) {
          rule = rule.isIn(fieldDef.enumValues);
        }
        break;

      case FieldTypes.NUMBER:
      case FieldTypes.INT:
        rule = rule.isInt();
        if (fieldDef.min !== undefined) {
          rule = rule.isInt({ min: fieldDef.min });
        }
        if (fieldDef.max !== undefined) {
          rule = rule.isInt({ max: fieldDef.max });
        }
        break;

      case FieldTypes.DATE:
        // For optional DATE fields, only validate format if value is provided
        rule = rule.custom((value) => {
          if (value === null || value === undefined || value === '') {
            return true; // Allow empty values for optional fields
          }
          // Validate ISO8601 format if value is provided
          if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) {
            throw new Error('Invalid date format');
          }
          return true;
        });
        break;

      case FieldTypes.OBJECT:
        if (fieldDef.required) {
          rule = rule.isObject();
        }
        break;

      case FieldTypes.BOOLEAN:
        rule = rule.isBoolean();
        break;
    }

    rules.push(rule);
  });

  return rules;
}

/**
 * Transform raw database meter object to API response format
 */
function transformMeterToResponse(meterData, relatedData = {}) {
  const { device, location } = relatedData;
  const serialNumber = meterData.serial_number || meterData.serialnumber;

  return {
    id: meterData.id,
    name: meterData.name,
    serial_number: serialNumber,
    device: device?.manufacturer || null,
    model: device?.model_number || null,
    device_description: device?.description || null,
    device_id: meterData.device_id,
    ip: meterData.ip,
    port: meterData.port,
    portNumber: meterData.port,
    slaveId: meterData.slave_id || 1,
    type: meterData.type,
    location: location?.name || null,
    location_id: meterData.location_id,
    locationName: location?.name || null,
    description: meterData.notes,
    notes: meterData.notes,
    installation_date: meterData.installation_date || null,
    installDate: meterData.installation_date || null,
    createdAt: meterData.created_at,
    updatedAt: meterData.updated_at,
    created_at: meterData.created_at,
    updated_at: meterData.updated_at,
    register_map: meterData.register_map ?? null,
    configuration: undefined,
    lastReading: null,
  };
}

/**
 * Normalize request body to database field names
 */
function normalizeRequestBody(reqBody) {
  return {
    name: reqBody.name,
    type: reqBody.type,
    device_id: reqBody.device_id,
    serial_number: reqBody.serialnumber || reqBody.serialNumber || reqBody.serial_number,
    location_location: reqBody.location_location,
    location_floor: reqBody.location_floor,
    location_room: reqBody.location_room,
    location_description: reqBody.location || reqBody.location_description,
    unit_of_measurement: reqBody.unit_of_measurement,
    multiplier: reqBody.multiplier || 1,
    notes: reqBody.notes,
    register_map: reqBody.register_map || null,
    ip: reqBody.ip,
    port: reqBody.portNumber || reqBody.port,
    slave_id: reqBody.slaveId || reqBody.slave_id,
    installation_date: reqBody.installation_date,
  };
}

/**
 * Transform created/updated meter object to API response format
 */
function transformCreatedMeterToResponse(meterData) {
  return {
    id: meterData.id,
    name: meterData.name,
    serialNumber: meterData.serial_number,
    serial_number: meterData.serial_number,
    device_id: meterData.device_id || null,
    device: meterData.device_name || null,
    model: meterData.device_description || null,
    type: meterData.type,
    location: meterData.fullLocation || null,
    location_id: meterData.location_id || null,
    description: meterData.notes,
    notes: meterData.notes,
    port: meterData.port || null,
    portNumber: meterData.port || null,
    installation_date: meterData.installation_date || null,
    installDate: meterData.installation_date || null,
    createdAt: meterData.created_at,
    updatedAt: meterData.updated_at,
    created_at: meterData.created_at,
    updated_at: meterData.updated_at,
    register_map: meterData.register_map ?? null,
  };
}

/**
 * Sort key mapping for API queries
 */
const SORT_KEY_MAP = {
  createdAt: 'created_at',
  type: 'type',
  serialNumber: 'serial_number',
  model: 'device_id',
  name: 'name',
  ip: 'ip',
  port: 'port',
  portNumber: 'port',
};

module.exports = Meter;
module.exports.buildValidationRules = buildValidationRules;
module.exports.transformMeterToResponse = transformMeterToResponse;
module.exports.normalizeRequestBody = normalizeRequestBody;
module.exports.transformCreatedMeterToResponse = transformCreatedMeterToResponse;
module.exports.SORT_KEY_MAP = SORT_KEY_MAP;
