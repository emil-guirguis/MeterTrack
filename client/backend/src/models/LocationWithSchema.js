/**
 * Location Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Location entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Location extends BaseModel {
    constructor(data = {}) {
        super(data);

        // Auto-initialize all fields from schema
        Location.schema.initializeFromData(this, data);
    }

    /**
     * @override
     */
    static get tableName() {
        return 'location';
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
                model: 'Contact',
                foreignKey: 'contact_id',
                targetKey: 'id'
            },
        };
    }
    /**
     * @override
     */
    static get schema() {
        return defineSchema({
            entityName: 'Location',
            tableName: 'location',
            description: 'Location entity',

            customListColumns: {},

            // Form fields - user can edit these
            formFields: {
                name: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Name',
                    dbField: 'name',
                    maxLength: 200,
                    placeholder: 'Location',
                    filertable: ['main'],
                    showOn: ['list', 'form'],
                }),
                street: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Street',
                    dbField: 'street',
                    maxLength: 200,
                    placeholder: '1234 Street',
                    showOn: ['form'],
                }),
                street2: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Street2',
                    dbField: 'street2',
                    maxLength: 100,
                    placeholder: 'Unit A',
                    showOn: ['form'],
                }),
                city: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'City',
                    dbField: 'city',
                    maxLength: 100,
                    placeholder: 'City',
                    showOn: ['form'],
                }),
                state: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'State',
                    dbField: 'state',
                    maxLength: 50,
                    placeholder: 'State',
                    showOn: ['form'],
                }),
                zip: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Zip',
                    dbField: 'zip',
                    placeholder: 'Zip',
                    showOn: ['form'],
                    maxLength: 20,
                }),
                country: field({
                    type: FieldTypes.COUNTRY,
                    default: '',
                    required: true,
                    label: 'Country',
                    dbField: 'country',
                    maxLength: 100,
                    placeholder: 'USA',
                    showOn: ['form'],
                }),
                type: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Type',
                    dbField: 'type',
                    maxLength: 20,
                    enumValues: ['Warehouse', 'Apartment', 'Ofice', 'Retail', 'Hotel', 'Building', 'Other'],
                    placeholder: 'Warehouse',
                    showOn: ['list', 'form'],
                }),
                status: field({
                    type: FieldTypes.boo,
                    default: true,
                    required: false,
                    label: 'Active',
                    dbField: 'active',
                    showOn: ['list', 'form'],
                }),
                squareFootage: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Square Footage',
                    dbField: 'square_footage',
                    showOn: ['form'],
                }),
                notes: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Notes',
                    dbField: 'notes',
                    showOn: ['form'],
                }),
                contactId: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: false,
                    label: 'Contact',
                    dbField: 'contact_id',
                    validate: true,
                    validationFields: ['name'],
                    showOn: ['form'],
                }),
                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: false,
                    required: false,
                    label: 'Active',
                    dbField: 'active',
                    showOn: ['form'],
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
                    showOn: ['form'],
                }),
                updatedAt: field({
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Updated At',
                    dbField: 'updated_at',
                    showOn: ['form'],
                }),
                tenantId: field({
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Tenant ID',
                    dbField: 'tenant_id',
                })
            },


            validation: {},
        });
    }
}

module.exports = Location;
