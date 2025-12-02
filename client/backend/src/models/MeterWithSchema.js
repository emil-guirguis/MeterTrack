// @ts-nocheck
/**
 * Meter Model with Schema Definition
 * 
 * This example shows how to define the schema once in the backend
 * and expose it to the frontend via API.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');
const db = require('../config/database');

class Meter extends BaseModel {
  constructor(meterData = {}) {
    super(meterData);
    
    // Auto-initialize all fields from schema
    // This eliminates the need to manually list every field!
    Meter.schema.initializeFromData(this, meterData);
  }

  // ===== Static Configuration =====
  
  static get tableName() {
    return 'meter';
  }

  static get primaryKey() {
    return 'id';
  }

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
   * This is the ONLY place where fields are defined!
   */
  static get schema() {
    return defineSchema({
      entityName: 'Meter',
      tableName: 'meter',
      description: 'Meter entity for managing electric, gas, water, and other utility meters',
      
      // Form fields - user can edit these
      formFields: {
        meterId: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Meter ID',
          dbField: 'name', // Maps to 'name' column in database
          minLength: 3,
          maxLength: 100,
        }),
        
        serialNumber: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Serial Number',
          dbField: 'serial_number',
          maxLength: 200,
        }),
        
        device: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Device Manufacturer',
          dbField: null, // Computed from device relationship
          description: 'Populated from device relationship',
        }),
        
        model: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Model',
          dbField: null, // Computed from device relationship
          description: 'Populated from device relationship',
        }),
        
        device_id: field({
          type: FieldTypes.NUMBER,
          default: null,
          required: true,
          label: 'Device ID',
          dbField: 'device_id',
        }),
        
        ip: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'IP Address',
          dbField: 'ip',
          pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$',
          placeholder: '192.168.1.100',
        }),
        
        portNumber: field({
          type: FieldTypes.NUMBER,
          default: 502,
          required: true,
          label: 'Port Number',
          dbField: 'port',
          min: 1,
          max: 65535,
        }),
        
        slaveId: field({
          type: FieldTypes.NUMBER,
          default: 1,
          required: false,
          label: 'Slave ID',
          dbField: null, // Not in database, used for Modbus
          min: 1,
          max: 247,
          description: 'Modbus slave ID',
        }),
        
        type: field({
          type: FieldTypes.STRING,
          default: 'electric',
          required: true,
          label: 'Meter Type',
          dbField: 'type',
          enumValues: ['electric', 'gas', 'water', 'steam', 'other'],
        }),
        
        location: field({
          type: FieldTypes.STRING,
          default: '',
          required: false,
          label: 'Location',
          dbField: null, // Computed from location relationship
          description: 'Computed from location relationship',
        }),
        
        description: field({
          type: FieldTypes.STRING,
          default: '',
          required: false,
          label: 'Description',
          dbField: 'notes',
          maxLength: 500,
        }),
        
        register_map: field({
          type: FieldTypes.OBJECT,
          default: null,
          required: false,
          label: 'Register Map',
          dbField: 'register_map',
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
        
        locationId: field({
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: false,
          label: 'Location ID',
          dbField: 'location_id',
        }),
        
        locationName: field({
          type: FieldTypes.STRING,
          default: null,
          readOnly: true,
          label: 'Location Name',
          dbField: null,
          description: 'Computed from location relationship',
        }),
        
        status: field({
          type: FieldTypes.STRING,
          default: 'active',
          readOnly: false,
          label: 'Status',
          dbField: 'status',
          enumValues: ['active', 'inactive', 'maintenance'],
        }),
        
        installDate: field({
          type: FieldTypes.DATE,
          default: null,
          readOnly: false,
          label: 'Installation Date',
          dbField: 'installation_date',
        }),
        
        configuration: field({
          type: FieldTypes.OBJECT,
          default: null,
          readOnly: true,
          label: 'Configuration',
          dbField: null,
          description: 'Computed configuration object',
        }),
        
        lastReading: field({
          type: FieldTypes.OBJECT,
          default: null,
          readOnly: true,
          label: 'Last Reading',
          dbField: null,
          description: 'Computed from readings relationship',
        }),
        
        notes: field({
          type: FieldTypes.STRING,
          default: '',
          readOnly: false,
          label: 'Notes',
          dbField: 'notes',
        }),
        
        createdAt: field({
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Created At',
          dbField: 'created_at',
        }),
        
        updatedAt: field({
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Updated At',
          dbField: 'updated_at',
        }),
        
        createdBy: field({
          type: FieldTypes.OBJECT,
          default: null,
          readOnly: true,
          label: 'Created By',
          dbField: null,
          description: 'User relationship',
        }),
        
        updatedBy: field({
          type: FieldTypes.OBJECT,
          default: null,
          readOnly: true,
          label: 'Updated By',
          dbField: null,
          description: 'User relationship',
        }),
      },
      
      relationships: this.relationships,
      
      validation: {
        // Entity-level validation rules
        custom: (data) => {
          const errors = {};
          
          // Example: Ensure port and IP are both provided or both empty
          if (data.ip && !data.portNumber) {
            errors.portNumber = 'Port number is required when IP address is provided';
          }
          if (data.portNumber && !data.ip) {
            errors.ip = 'IP address is required when port number is provided';
          }
          
          return errors;
        },
      },
    });
  }

  // ===== Custom Methods =====

  static async findByMeterId(meterid) {
    return this.findOne({ meterid });
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
