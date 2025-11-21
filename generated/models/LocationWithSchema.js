/**
 * Location Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Location entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Location extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        Location.schema.initializeFromData(this, data);
    }
    
    static get tableName() {
        return 'location';
    }
    
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    static get schema() {
        return defineSchema({
            entityName: 'Location',
            tableName: 'location',
            description: 'Location entity',
            
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
                street: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Street',
                    dbField: 'street',
                    maxLength: 200,
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
                    required: true,
                    label: 'City',
                    dbField: 'city',
                    maxLength: 100,
                }),
                state: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'State',
                    dbField: 'state',
                    maxLength: 50,
                }),
                zip: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Zip',
                    dbField: 'zip',
                    maxLength: 20,
                }),
                country: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Country',
                    dbField: 'country',
                    maxLength: 100,
                }),
                type: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Type',
                    dbField: 'type',
                    maxLength: 20,
                }),
                status: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Status',
                    dbField: 'status',
                    maxLength: 20,
                }),
                squareFootage: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Square Footage',
                    dbField: 'square_footage',
                }),
                notes: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Notes',
                    dbField: 'notes',
                }),
                contactId: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Contact Id',
                    dbField: 'contact_id',
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

module.exports = Location;
