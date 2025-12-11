/**
 * Contact Model with Schema Definition
 * 
 * Single source of truth for Contact entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Contact extends BaseModel {
    constructor(data = {}) {
        super(data);

        // Auto-initialize all fields from schema
        // This eliminates the need to manually list every field!
        Contact.schema.initializeFromData(this, data);
    }

    /**
     * @override
     */
    static get tableName() {
        return 'contact';
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
    static get schema() {
        return defineSchema({
            entityName: 'Contact',
            tableName: 'contact',
            description: 'Contact entity for customers, vendors, and other business contacts',

            customListColumns: {  
//                 createTwoLineColumn,
//   createPhoneColumn,
//   createStatusColumn,
//   createLocationColumn,
//   createBadgeListColumn,
                
            },

            // Form fields - user can edit these
            formFields: {
                name: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Name',
                    dbField: 'name',
                    minLength: 2,
                    maxLength: 100,
                    placeholder: 'John Doe',
                    filertable:['main'],
                    showOn: ['list', 'form'],
                }),
                company: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Company',
                    dbField: 'company',
                    maxLength: 200,
                    placeholder: 'Acme Corporation',
                    filertable:['true'],
                    showOn: ['list', 'form'],
                }),

                role: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Role',
                    dbField: 'role',
                    maxLength: 100,
                    enumValues: ['Vendor', 'Customer', 'Contractor', 'Technician', 'Client', 'Sales Manager'],
                    placeholder: 'Vendor',
                    filertable:['true'],
                    showOn: ['list', 'form'],
                }),

                email: field({
                    type: FieldTypes.EMAIL,
                    default: '',
                    required: true,
                    label: 'Email',
                    dbField: 'email',
                    maxLength: 254,
                    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                    placeholder: 'john@example.com',
                    showOn: ['form'],
                }),

                phone: field({
                    type: FieldTypes.PHONE,
                    default: '',
                    required: false,
                    label: 'Phone',
                    dbField: 'phone',
                    maxLength: 50,
                    placeholder: '(555) 123-4567',
                    showOn: ['list', 'form'],
                }),

                street: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Street Address',
                    dbField: 'street',
                    maxLength: 200,
                    placeholder: '123 Main St',
                    showOn: ['form'],
                }),

                street2: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Street Address 2',
                    dbField: 'street2',
                    maxLength: 100,
                    placeholder: 'Suite 100',
                    showOn: ['form'],
                }),

                city: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'City',
                    dbField: 'city',
                    maxLength: 100,
                    placeholder: 'New York',
                    showOn: ['form'],
                }),

                state: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'State',
                    dbField: 'state',
                    maxLength: 50,
                    placeholder: 'NY',
                    showOn: ['form'],
                }),

                zip: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'ZIP Code',
                    dbField: 'zip',
                    maxLength: 20,
                    pattern: '^[0-9]{5}(-[0-9]{4})?$',
                    placeholder: '10001',
                    showOn: ['form'],
                }),

                country: field({
                    type: FieldTypes.STRING,
                    default: 'US',
                    required: false,
                    label: 'Country',
                    dbField: 'country',
                    maxLength: 100,
                    enumValues: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP'],
                    showOn: ['form'],
                }),

                notes: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Notes',
                    dbField: 'notes',
                    maxLength: 5000,
                    placeholder: 'Additional notes...',
                    showOn: ['form'],
                }),

                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: true,
                    readOnly: false,
                    label: 'Active',
                    dbField: 'active',
                    description: 'Whether the contact is active',
                    showOn: ['list', 'form'],
                }),

                // tags: field({
                //     type: FieldTypes.ARRAY,
                //     default: [],
                //     readOnly: false,
                //     label: 'Tags',
                //     description: 'Contact tags for categorization',
                //     showOn: ['list', 'form'],
                // }),

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
                    default: 0,
                    readOnly: true,
                    label: 'Tenant ID',
                    dbField: 'tenant_id',
                }),
            },

            relationships: {},

            validation: {
                // Entity-level validation rules
                custom: (data) => {
                    const errors = {};

                    // Ensure at least one contact method
                    if (!data.email && !data.phone) {
                        errors._form = 'At least one contact method (email or phone) is required';
                    }

                    // Validate ZIP code format if provided
                    if (data.zip && data.country === 'US') {
                        const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
                        if (!zipRegex.test(data.zip)) {
                            errors.zip = 'Invalid US ZIP code format';
                        }
                    }

                    return errors;
                },
            },
        });
    }
}

module.exports = Contact;
