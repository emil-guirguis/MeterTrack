// @ts-nocheck
/**
 * Meter Field Configuration - Single Source of Truth
 * 
 * This file defines all meter fields once with complete validation rules.
 * Both backend and frontend use this schema for:
 * - Backend: Express-validator rules generation
 * - Frontend: Form validation, search, sort, and display
 * 
 * Field Parameters:
 * - type: FieldTypes enum
 * - dbField: database column name (null for computed fields)
 * - readOnly: whether field is editable
 * - label: display label
 * - placeholder: input placeholder text
 * - searchable: whether field can be searched
 * - sortable: whether field can be sorted
 * - required: whether field is required
 * - minLength: minimum string length
 * - maxLength: maximum string length
 * - min: minimum number value
 * - max: maximum number value
 * - pattern: regex pattern for validation
 * - enumValues: array of valid enum values
 */

const { FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

const METER_FIELDS = {
  // Identity fields
  id: {
    type: FieldTypes.NUMBER,
    dbField: 'id',
    readOnly: true,
    label: 'ID',
    searchable: false,
    sortable: false,
  },
  
 
  name: {
    type: FieldTypes.STRING,
    dbField: 'name',
    required: true,
    label: 'Meter Name',
    placeholder: 'Enter meter name',
    minLength: 3,
    maxLength: 100,
    pattern: '^[a-zA-Z0-9\\s-]+$',
    searchable: true,
    sortable: true,
  },
  
  serial_number: {
    type: FieldTypes.STRING,
    dbField: 'serial_number',
    required: true,
    label: 'Serial Number',
    placeholder: 'Enter serial number',
    maxLength: 200,
    pattern: '^[a-zA-Z0-9-]+$',
    searchable: true,
    sortable: true,
  },
  
  // Device relationship
  device_id: {
    type: FieldTypes.NUMBER,
    dbField: 'device_id',
    required: true,
    label: 'Device ID',
    min: 1,
    searchable: false,
    sortable: false,
  },
  
  device: {
    type: FieldTypes.STRING,
    dbField: null, // Computed from device relationship
    readOnly: true,
    label: 'Device Manufacturer',
    searchable: true,
    sortable: false,
  },
  
  model: {
    type: FieldTypes.STRING,
    dbField: null, // Computed from device relationship
    readOnly: true,
    label: 'Model',
    searchable: true,
    sortable: false,
  },
  
  // Network configuration
  ip: {
    type: FieldTypes.STRING,
    dbField: 'ip',
    required: true,
    label: 'IP Address',
    placeholder: '192.168.1.100',
    pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$',
    searchable: true,
    sortable: true,
  },
  
  port: {
    type: FieldTypes.NUMBER,
    dbField: 'port',
    required: true,
    label: 'Port Number',
    placeholder: '502',
    default: 502,
    min: 1,
    max: 65535,
    searchable: false,
    sortable: true,
  },
  
  
  // Meter type and status
  type: {
    type: FieldTypes.STRING,
    dbField: 'type',
    required: true,
    label: 'Meter Type',
    placeholder: 'Select meter type',
    enumValues: ['electric', 'gas', 'water', 'steam', 'other'],
    default: 'electric',
    searchable: true,
    sortable: true,
  },
  
  status: {
    type: FieldTypes.STRING,
    dbField: 'status',
    label: 'Status',
    placeholder: 'Select status',
    enumValues: ['active', 'inactive', 'maintenance'],
    default: 'active',
    searchable: true,
    sortable: true,
  },
  
  // Location
  location_id: {
    type: FieldTypes.NUMBER,
    dbField: 'location_id',
    label: 'Location ID',
    min: 1,
    searchable: false,
    sortable: false,
  },
  
  location: {
    type: FieldTypes.STRING,
    dbField: null, // Computed from location relationship
    readOnly: true,
    label: 'Location',
    searchable: true,
    sortable: true,
  },
  
  locationName: {
    type: FieldTypes.STRING,
    dbField: null, // Computed from location relationship
    readOnly: true,
    label: 'Location Name',
    searchable: true,
    sortable: false,
  },
  
  // Meter configuration and readings
  configuration: {
    type: FieldTypes.OBJECT,
    dbField: null, // Computed
    readOnly: true,
    label: 'Configuration',
    searchable: false,
    sortable: false,
  },
  
  lastReading: {
    type: FieldTypes.OBJECT,
    dbField: null, // Computed
    readOnly: true,
    label: 'Last Reading',
    searchable: false,
    sortable: false,
  },
  
  register_map: {
    type: FieldTypes.OBJECT,
    dbField: 'register_map',
    label: 'Register Map',
    searchable: false,
    sortable: false,
  },
  
  // Metadata
  description: {
    type: FieldTypes.STRING,
    dbField: 'notes',
    label: 'Description',
    placeholder: 'Enter description',
    maxLength: 500,
    searchable: true,
    sortable: false,
  },
  
  notes: {
    type: FieldTypes.STRING,
    dbField: 'notes',
    label: 'Notes',
    placeholder: 'Enter notes',
    maxLength: 500,
    searchable: true,
    sortable: false,
  },
  
  installation_date: {
    type: FieldTypes.DATE,
    dbField: 'installation_date',
    label: 'Installation Date',
    placeholder: 'Select date',
    searchable: false,
    sortable: true,
  },
  
  // Audit fields
  created_at: {
    type: FieldTypes.DATE,
    dbField: 'created_at',
    readOnly: true,
    label: 'Created At',
    searchable: false,
    sortable: true,
  },
  
  updated_at: {
    type: FieldTypes.DATE,
    dbField: 'updated_at',
    readOnly: true,
    label: 'Updated At',
    searchable: false,
    sortable: true,
  },
  
  createdBy: {
    type: FieldTypes.OBJECT,
    dbField: null,
    readOnly: true,
    label: 'Created By',
    searchable: false,
    sortable: false,
  },
  
  updatedBy: {
    type: FieldTypes.OBJECT,
    dbField: null,
    readOnly: true,
    label: 'Updated By',
    searchable: false,
    sortable: false,
  },
  
  tenant_id: {
    type: FieldTypes.NUMBER,
    dbField: 'tenant_id',
    readOnly: true,
    label: 'Tenant ID',
    searchable: false,
    sortable: false,
  },
};

/**
 * Map frontend field names to database column names
 * Used for sorting and filtering
 */
const FIELD_TO_DB_COLUMN = Object.entries(METER_FIELDS).reduce((acc, [fieldName, config]) => {
  if (config.dbField) {
    acc[fieldName] = config.dbField;
  }
  return acc;
}, {});

/**
 * Sort key mapping for API queries
 * Maps frontend sort keys to database columns
 */
const SORT_KEY_MAP = {
  createdAt: 'created_at',
  meterId: 'meterid',
  meterid: 'meterid',
  status: 'status',
  type: 'type',
  serialNumber: 'serial_number',
  model: 'device_id',
  name: 'name',
  ip: 'ip',
  port: 'port',
  portNumber: 'port',
};

/**
 * Get searchable fields for auto-generating search interface
 */
function getSearchableFields() {
  return Object.entries(METER_FIELDS).reduce((acc, [name, config]) => {
    if (config.searchable) {
      acc[name] = {
        label: config.label,
        type: config.type,
        dbField: config.dbField,
      };
    }
    return acc;
  }, {});
}

/**
 * Get sortable fields for auto-generating sort options
 */
function getSortableFields() {
  return Object.entries(METER_FIELDS).reduce((acc, [name, config]) => {
    if (config.sortable) {
      acc[name] = {
        label: config.label,
        dbField: config.dbField,
      };
    }
    return acc;
  }, {});
}

/**
 * Validation rules for meter fields
 */
const VALIDATION_RULES = {
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
};

/**
 * Get database column name from frontend field name
 */
function getDbColumn(fieldName) {
  return FIELD_TO_DB_COLUMN[fieldName] || fieldName;
}

/**
 * Get field configuration
 */
function getFieldConfig(fieldName) {
  return METER_FIELDS[fieldName];
}

/**
 * Get all form fields (editable fields)
 */
function getFormFields() {
  return Object.entries(METER_FIELDS).reduce((acc, [name, config]) => {
    if (!config.readOnly) {
      acc[name] = config;
    }
    return acc;
  }, {});
}

/**
 * Get all entity fields (system-managed fields)
 */
function getEntityFields() {
  return Object.entries(METER_FIELDS).reduce((acc, [name, config]) => {
    if (config.readOnly) {
      acc[name] = config;
    }
    return acc;
  }, {});
}

/**
 * Build express-validator rules from METER_FIELDS schema
 * Automatically generates validation rules from field configuration
 * No need to manually define each validation rule
 */
function buildValidationRules() {
  const { body } = require('express-validator');
  const rules = [];

  Object.entries(METER_FIELDS).forEach(([fieldName, config]) => {
    // Skip read-only fields and computed fields
    if (config.readOnly || !config.dbField) {
      return;
    }

    let rule = body(fieldName).optional();

    // Apply type-specific validations
    switch (config.type) {
      case FieldTypes.STRING:
        // Apply trim for strings
        rule = rule.trim();
        
        // Apply length constraints
        if (config.minLength) {
          rule = rule.isLength({ min: config.minLength });
        }
        if (config.maxLength) {
          rule = rule.isLength({ max: config.maxLength });
        }
        
        // Apply pattern/regex if provided
        if (config.pattern) {
          rule = rule.matches(new RegExp(config.pattern));
        }
        
        // Apply enum validation if provided
        if (config.enumValues && Array.isArray(config.enumValues)) {
          rule = rule.isIn(config.enumValues);
        }
        break;

      case FieldTypes.NUMBER:
      case FieldTypes.INT:
        rule = rule.isInt();
        
        // Apply min/max constraints
        if (config.min !== undefined) {
          rule = rule.isInt({ min: config.min });
        }
        if (config.max !== undefined) {
          rule = rule.isInt({ max: config.max });
        }
        break;

      case FieldTypes.DATE:
        rule = rule.isISO8601();
        break;

      case FieldTypes.OBJECT:
        rule = rule.isObject();
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
 * Maps database column names to frontend field names
 */
function transformMeterToResponse(meterData, relatedData = {}) {
  const { device, location } = relatedData;

  // Ensure serial_number is properly mapped
  const serialNumber = meterData.serial_number || meterData.serialnumber || meterData.serial_number;

  return {
    id: meterData.id,
    name: meterData.name || meterData.meterid,
    meterId: meterData.name || meterData.meterid,
    serialNumber: serialNumber,
    serial_number: serialNumber,
    device: device?.manufacturer || null,
    model: device?.model_number || null,
    deviceDescription: device?.description || null,
    device_id: meterData.device_id,
    ip: meterData.ip,
    port: meterData.port,
    portNumber: meterData.port,
    slaveId: meterData.slave_id || 1,
    type: meterData.type,
    status: meterData.status,
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
 * Maps frontend field names to database column names
 */
function normalizeRequestBody(reqBody) {
  return {
    meterid: reqBody.meterid || reqBody.meterId,
    name: reqBody.name || reqBody.meterId,
    type: reqBody.type,
    device_id: reqBody.device_id,
    serial_number: reqBody.serialnumber || reqBody.serialNumber || reqBody.serial_number,
    status: reqBody.status || 'active',
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
  };
}

/**
 * Transform created/updated meter object to API response format
 * Used for POST and PUT responses
 */
function transformCreatedMeterToResponse(meterData) {
  return {
    id: meterData.id,
    meterId: meterData.meterid,
    name: meterData.name,
    serialNumber: meterData.serial_number,
    serial_number: meterData.serial_number,
    device_id: meterData.device_id || null,
    device: meterData.device_name || null,
    model: meterData.device_description || null,
    type: meterData.type,
    status: meterData.status,
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
 * Enum values for meter fields
 * Used for validation and frontend display
 */
const METER_ENUMS = {
  type: ['electric', 'gas', 'water', 'steam', 'other'],
  status: ['active', 'inactive', 'maintenance'],
  dataType: ['uint16', 'uint32', 'int16', 'int32', 'float32', 'string'],
  readWrite: ['R', 'W', 'R/W'],
  quality: ['good', 'estimated', 'questionable'],
};

/**
 * Type definitions for TypeScript/Frontend
 * Exported as strings for documentation
 */
const TYPE_DEFINITIONS = {
  Meter: {
    id: 'string',
    meterId: 'string',
    name: 'string',
    serialNumber: 'string',
    serial_number: 'string',
    device: 'string',
    model: 'string',
    device_id: 'string | number',
    ip: 'string',
    portNumber: 'number',
    port: 'number',
    slaveId: 'number',
    slave_id: 'number',
    type: "'electric' | 'gas' | 'water' | 'steam' | 'other'",
    status: "'active' | 'inactive' | 'maintenance'",
    location: 'string',
    location_id: 'string | number',
    locationName: 'string',
    description: 'string',
    notes: 'string',
    register_map: 'RegisterMap | null',
    configuration: 'MeterConfig',
    lastReading: 'MeterReading',
    installDate: 'Date',
    createdAt: 'Date',
    updatedAt: 'Date',
    createdBy: 'object',
    updatedBy: 'object',
  },
  CreateMeterRequest: {
    meterId: 'string',
    name: 'string',
    device: 'string',
    model: 'string',
    device_id: 'string | number',
    ip: 'string',
    serialNumber: 'string',
    portNumber: 'number',
    slaveId: 'number',
    type: "'electric' | 'gas' | 'water' | 'steam' | 'other'",
    location: 'string',
    description: 'string',
    register_map: 'RegisterMap | null',
  },
  UpdateMeterRequest: {
    meterId: 'string',
    name: 'string',
    device: 'string',
    model: 'string',
    device_id: 'string | number',
    ip: 'string',
    serialNumber: 'string',
    portNumber: 'number',
    slaveId: 'number',
    type: "'electric' | 'gas' | 'water' | 'steam' | 'other'",
    location: 'string',
    description: 'string',
    register_map: 'RegisterMap | null',
    status: "'active' | 'inactive' | 'maintenance'",
  },
  MeterConfig: {
    readingInterval: 'number',
    units: 'string',
    multiplier: 'number',
    registers: 'number[]',
    communicationProtocol: 'string',
    baudRate: 'number',
    slaveId: 'number',
    ipAddress: 'string',
    port: 'number',
  },
  MeterReading: {
    value: 'number',
    timestamp: 'Date',
    unit: 'string',
    quality: "'good' | 'estimated' | 'questionable'",
  },
};

module.exports = {
  // Field configuration
  METER_FIELDS,
  FIELD_TO_DB_COLUMN,
  SORT_KEY_MAP,
  VALIDATION_RULES,
  METER_ENUMS,
  TYPE_DEFINITIONS,
  
  // Helper functions
  getDbColumn,
  getFieldConfig,
  getFormFields,
  getEntityFields,
  getSearchableFields,
  getSortableFields,
  transformMeterToResponse,
  buildValidationRules,
  normalizeRequestBody,
  transformCreatedMeterToResponse,
};
