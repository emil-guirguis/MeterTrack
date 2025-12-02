/**
 * Contact Model with Schema Definition
 * 
 * Single source of truth for Contact entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Contact extends BaseModel {
    constructor(contactData = {}) {
        super(contactData);

        // Auto-initialize all fields from schema
        // This eliminates the need to manually list every field!
        Contact.schema.initializeFromData(this, contactData);
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

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====

    /**
     * Schema definition - exposed to frontend via API
     * This is the ONLY place where fields are defined!
     */
    static get schema() {
        return defineSchema({
            entityName: 'Contact',
            tableName: 'contact',
            description: 'Contact entity for customers, vendors, and other business contacts',

            // Form fields - user can edit these
            formFields: {
                name: field({ type: FieldTypes.STRING, default: '', required: true, label: 'Name', dbField: 'name', minLength: 2, maxLength: 100, placeholder: 'John Doe', }),
                company: field({ type: FieldTypes.STRING, default: '', required: false, label: 'Company', dbField: 'company', maxLength: 200, placeholder: 'AcmeCorporation', }),

                role: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Role',
                    dbField: 'role',
                    maxLength: 100,
                    placeholder: 'Sales Manager',
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
                }),

                phone: field({
                    type: FieldTypes.PHONE,
                    default: '',
                    required: false,
                    label: 'Phone',
                    dbField: 'phone',
                    maxLength: 50,
                    placeholder: '(555) 123-4567',
                }),

                street: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Street Address',
                    dbField: 'street',
                    maxLength: 200,
                    placeholder: '123 Main St',
                }),

                street2: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Street Address 2',
                    dbField: 'street2',
                    maxLength: 100,
                    placeholder: 'Suite 100',
                }),

                city: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'City',
                    dbField: 'city',
                    maxLength: 100,
                    placeholder: 'New York',
                }),

                state: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'State',
                    dbField: 'state',
                    maxLength: 50,
                    placeholder: 'NY',
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
                }),

                country: field({
                    type: FieldTypes.STRING,
                    default: 'US',
                    required: false,
                    label: 'Country',
                    dbField: 'country',
                    maxLength: 100,
                    enumValues: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP'],
                }),

                notes: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Notes',
                    dbField: 'notes',
                    maxLength: 5000,
                    placeholder: 'Additional notes...',
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

                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: true,
                    readOnly: false,
                    label: 'Active',
                    dbField: 'active',
                    description: 'Whether the contact is active',
                }),

                category: field({
                    type: FieldTypes.STRING,
                    default: 'customer',
                    readOnly: false,
                    label: 'Category',
                    enumValues: ['customer', 'vendor', 'contractor', 'technician', 'client'],
                    description: 'Contact category/type',
                }),

                status: field({
                    type: FieldTypes.STRING,
                    default: 'active',
                    readOnly: false,
                    label: 'Status',
                    enumValues: ['active', 'inactive'],
                    description: 'Contact status',
                }),

                tags: field({
                    type: FieldTypes.ARRAY,
                    default: [],
                    readOnly: false,
                    label: 'Tags',
                    description: 'Contact tags for categorization',
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
