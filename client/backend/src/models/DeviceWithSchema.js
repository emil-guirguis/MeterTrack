/**
 * Device Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Device entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Device extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        Device.schema.initializeFromData(this, data);
    }
    
    /**
     * @override
     */
    static get tableName() {
        return 'device';
    }
    
    /**
     * @override
     */
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    /**
     * @override
     */
    static get schema() {
        return defineSchema({
            entityName: 'Device',
            tableName: 'device',
            description: 'Device entity',
            
            // Form fields - user can edit these
            formFields: {
                description: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Description',
                    dbField: 'description',
                    maxLength: 255,
                }),
                manufacturer: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Manufacturer',
                    dbField: 'manufacturer',
                    maxLength: 255,
                }),
                modelNumber: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Model Number',
                    dbField: 'model_number',
                    maxLength: 255,
                }),
                type: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Type',
                    dbField: 'type',
                    maxLength: 255,
                }),
                registerMap: field({
                    type: FieldTypes.OBJECT,
                    default: null,
                    required: false,
                    label: 'Register Map',
                    dbField: 'register_map',
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
                }),
                tenantId: field({
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Tenant Id',
                    dbField: 'tenant_id',
                })
            },
            
            // Relationships
            relationships: {
                tenant: relationship({
                    type: RelationshipTypes.BELONGS_TO,
                    model: 'Tenant',
                    foreignKey: 'tenant_id',
                    autoLoad: false,
                }),
                meters: relationship({
                    type: RelationshipTypes.HAS_MANY,
                    model: 'Meter',
                    foreignKey: 'device_id',
                    autoLoad: false,
                }),
            },
            
            validation: {},
        });
    }
}

module.exports = Device;
