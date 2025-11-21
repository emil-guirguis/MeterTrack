/**
 * Meter Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Meter entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Meter extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        Meter.schema.initializeFromData(this, data);
    }
    
    static get tableName() {
        return 'meter';
    }
    
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    static get schema() {
        return defineSchema({
            entityName: 'Meter',
            tableName: 'meter',
            description: 'Meter entity',
            
            // Form fields - user can edit these
            formFields: {
                name: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Name',
                    dbField: 'name',
                    maxLength: 200,
                }),
                type: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Type',
                    dbField: 'type',
                    maxLength: 50,
                }),
                serialNumber: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Serial Number',
                    dbField: 'serial_number',
                    maxLength: 200,
                }),
                installationDate: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Installation Date',
                    dbField: 'installation_date',
                }),
                deviceId: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Device Id',
                    dbField: 'device_id',
                }),
                locationId: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Location Id',
                    dbField: 'location_id',
                }),
                ip: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Ip',
                    dbField: 'ip',
                    maxLength: 15,
                }),
                port: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Port',
                    dbField: 'port',
                }),
                protocol: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Protocol',
                    dbField: 'protocol',
                    maxLength: 255,
                }),
                status: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Status',
                    dbField: 'status',
                    maxLength: 20,
                }),
                nextMaintenance: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Next Maintenance',
                    dbField: 'next_maintenance',
                }),
                lastMaintenance: field({
                    type: FieldTypes.DATE,
                    default: '',
                    required: false,
                    label: 'Last Maintenance',
                    dbField: 'last_maintenance',
                }),
                maintenanceInterval: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Maintenance Interval',
                    dbField: 'maintenance_interval',
                    maxLength: 50,
                }),
                maintenanceNotes: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Maintenance Notes',
                    dbField: 'maintenance_notes',
                }),
                registerMap: field({
                    type: FieldTypes.OBJECT,
                    default: null,
                    required: false,
                    label: 'Register Map',
                    dbField: 'register_map',
                }),
                notes: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Notes',
                    dbField: 'notes',
                }),
                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: false,
                    required: false,
                    label: 'Active',
                    dbField: 'active',
                })
            },
            
            // Entity fields - read-only, system-managed
            entityFields: {
                id: field({
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Id',
                    dbField: 'id',
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
                })
            },
            
            // TODO: Add relationships here
            relationships: {
                // Example:
                // device: relationship({
                //     type: RelationshipTypes.BELONGS_TO,
                //     model: 'Device',
                //     foreignKey: 'device_id',
                //     autoLoad: false,
                // }),
            },
            
            validation: {},
        });
    }
}

module.exports = Meter;
