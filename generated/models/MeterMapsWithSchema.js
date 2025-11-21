/**
 * MeterMaps Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for MeterMaps entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class MeterMaps extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        MeterMaps.schema.initializeFromData(this, data);
    }
    
    static get tableName() {
        return 'meter_maps';
    }
    
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    static get schema() {
        return defineSchema({
            entityName: 'MeterMaps',
            tableName: 'meter_maps',
            description: 'MeterMaps entity',
            
            // Form fields - user can edit these
            formFields: {
                name: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Name',
                    dbField: 'name',
                    maxLength: 255,
                }),
                manufacturer: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Manufacturer',
                    dbField: 'manufacturer',
                    maxLength: 100,
                }),
                model: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Model',
                    dbField: 'model',
                    maxLength: 100,
                }),
                description: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Description',
                    dbField: 'description',
                }),
                registerMap: field({
                    type: FieldTypes.OBJECT,
                    default: null,
                    required: true,
                    label: 'Register Map',
                    dbField: 'register_map',
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

module.exports = MeterMaps;
