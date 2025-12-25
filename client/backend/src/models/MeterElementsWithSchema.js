// @ts-nocheck
/**
 * Meter Elements Model with Schema Definition
 * 
 * Single source of truth for Meter Element entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class MeterElement extends BaseModel {
  constructor(data = {}) {
    super(data);

    // Auto-initialize all fields from schema
    MeterElement.schema.initializeFromData(this, data);
  }

  /**
   * @override
   */
  static get tableName() {
    return 'meter_element';
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
      meter: {
        type: 'belongsTo',
        model: 'Meter',
        foreignKey: 'meter_id',
        targetKey: 'id'
      }
    };
  }

  /**
   * @override
   */
  static get schema() {
    return defineSchema({
      entityName: 'MeterElement',
      tableName: 'meter_element',
      description: 'Meter element entity for managing individual elements within a meter',

      customListColumns: {},

      // Form fields - user can edit these
      formFields: {
        name: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Name',
          dbField: 'name',
          maxLength: 255,
          placeholder: 'Enter element name',
          showOn: ['list', 'form'],
        }),

        element: field({
          type: FieldTypes.STRING,
          default: '',
          required: true,
          label: 'Element',
          dbField: 'element',
          maxLength: 255,
          placeholder: 'Enter element value',
          showOn: ['list', 'form'],
        }),

        status: field({
          type: FieldTypes.STRING,
          default: 'active',
          required: false,
          readOnly: true,
          label: 'Status',
          dbField: 'status',
          enumValues: ['active', 'inactive'],
          showOn: ['list', 'form'],
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

        meter_id: field({
          type: FieldTypes.NUMBER,
          default: null,
          readOnly: true,
          label: 'Meter ID',
          dbField: 'meter_id',
        }),

        created_at: field({
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Created At',
          dbField: 'created_at',
        }),

        updated_at: field({
          type: FieldTypes.DATE,
          default: null,
          readOnly: true,
          label: 'Updated At',
          dbField: 'updated_at',
        }),
      },

      validation: {},
    });
  }
}

module.exports = MeterElement;
