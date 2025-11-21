/**
 * Tenant Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Tenant entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Tenant extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        Tenant.schema.initializeFromData(this, data);
    }
    
    static get tableName() {
        return 'tenant';
    }
    
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    static get schema() {
        return defineSchema({
            entityName: 'Tenant',
            tableName: 'tenant',
            description: 'Tenant entity',
            
            // Form fields - user can edit these
            formFields: {
                name: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Name',
                    dbField: 'name',
                    maxLength: 100,
                }),
                url: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Url',
                    dbField: 'url',
                    maxLength: 255,
                }),
                street: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Street',
                    dbField: 'street',
                    maxLength: 100,
                }),
                street2: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Street2',
                    dbField: 'street2',
                    maxLength: 100,
                }),
                city: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'City',
                    dbField: 'city',
                    maxLength: 50,
                }),
                state: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'State',
                    dbField: 'state',
                    maxLength: 50,
                }),
                zip: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Zip',
                    dbField: 'zip',
                    maxLength: 15,
                }),
                country: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Country',
                    dbField: 'country',
                    maxLength: 50,
                }),
                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: false,
                    required: false,
                    label: 'Active',
                    dbField: 'active',
                }),
                meterReadingBatchCount: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Meter Reading Batch Count',
                    dbField: 'meter_reading_batch_count',
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

module.exports = Tenant;
