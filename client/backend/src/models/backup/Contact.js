/**
 * Contact Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Contact entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Contact extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        Contact.schema.initializeFromData(this, data);
    }
    
    static get tableName() {
        return 'contact';
    }
    
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    static get schema() {
        return defineSchema({
            entityName: 'Contact',
            tableName: 'contact',
            description: 'Contact entity',
            
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
                company: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Company',
                    dbField: 'company',
                    maxLength: 200,
                }),
                role: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Role',
                    dbField: 'role',
                    maxLength: 100,
                }),
                email: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Email',
                    dbField: 'email',
                    maxLength: 254,
                }),
                phone: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Phone',
                    dbField: 'phone',
                    maxLength: 50,
                }),
                street: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
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
                    required: false,
                    label: 'City',
                    dbField: 'city',
                    maxLength: 100,
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
                    maxLength: 20,
                }),
                country: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Country',
                    dbField: 'country',
                    maxLength: 100,
                }),
                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: false,
                    required: false,
                    label: 'Active',
                    dbField: 'active',
                }),
                notes: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Notes',
                    dbField: 'notes',
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
            },
            
            validation: {},
        });
    }
}

module.exports = Contact;
