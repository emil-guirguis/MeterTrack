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

            customListColumns: {},

            // Form fields - user can edit these
            formFields: {
                description: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Description',
                    dbField: 'description',
                    maxLength: 255,
                    placeholder: 'Device description',
                    showOn: ['list', 'form'],
                    formGrouping: {
                        tabName: 'General',
                        sectionName: 'Device Information',
                        tabOrder: 1,
                        sectionOrder: 1,
                        fieldOrder: 3,
                    },
                }),
                manufacturer: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Manufacturer',
                    dbField: 'manufacturer',
                    maxLength: 255,
                    placeholder: 'DENT Instruments',
                    enumValues: ['DENT Instruments', 'Honeywell', 'Siemens'],
                    showOn: ['list', 'form'],
                    formGrouping: {
                        tabName: 'General',
                        sectionName: 'Device Information',
                        tabOrder: 1,
                        sectionOrder: 1,
                        fieldOrder: 1,
                    },
                }),
                modelNumber: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Model Number',
                    dbField: 'model_number',
                    maxLength: 255,
                    placeholder: 'Model',
                    showOn: ['list', 'form'],
                    formGrouping: {
                        tabName: 'General',
                        sectionName: 'Device Information',
                        tabOrder: 1,
                        sectionOrder: 1,
                        fieldOrder: 2,
                    },
                }),

                type: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Type',
                    dbField: 'type',
                    maxLength: 255,
                    enumValues: ['Electric', 'Gas', 'Water', 'Steam', 'Other'],
                    placeholder: 'Electric',
                    showOn: ['list', 'form'],
                    formGrouping: {
                        tabName: 'General',
                        sectionName: 'Device Information',
                        tabOrder: 1,
                        sectionOrder: 1,
                        fieldOrder: 4,
                    },
                }),
                active: field({
                    type: FieldTypes.BOOLEAN,
                    default: true,
                    required: true,
                    label: 'Active',
                    dbField: 'active',
                    showOn: ['list', 'form'],
                    formGrouping: {
                        tabName: 'General',
                        sectionName: 'Status',
                        tabOrder: 1,
                        sectionOrder: 2,
                        fieldOrder: 1,
                    },
                }),
                registers: field({
                    type: FieldTypes.OBJECT,
                    default: null,
                    required: false,
                    label: 'Registers',
                    showOn: ['form'],
                    formGrouping: {
                        tabName: 'Registers',
                        sectionName: 'Meter Registers',
                        tabOrder: 2,
                        sectionOrder: 1,
                        fieldOrder: 1,
                    },
                }),
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
                    formGrouping: {
                        tabName: 'General',
                        sectionName: 'Meter Registers',
                        tabOrder: 2,
                        sectionOrder: 1,
                        fieldOrder: 2,
                    },
                }),
                updatedAt: field({
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Updated At',
                    dbField: 'updated_at',
                    showOn: ['form'],
                    formGrouping: {
                        tabName: 'General',
                        sectionName: 'Meter Registers',
                        tabOrder: 2,
                        sectionOrder: 1,
                        fieldOrder: 3,
                    },
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

module.exports = Device;
