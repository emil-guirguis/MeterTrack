/**
 * MeterMaintenance Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for MeterMaintenance entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class MeterMaintenance extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        MeterMaintenance.schema.initializeFromData(this, data);
    }
    
    static get tableName() {
        return 'meter_maintenance';
    }
    
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    static get schema() {
        return defineSchema({
            entityName: 'MeterMaintenance',
            tableName: 'meter_maintenance',
            description: 'MeterMaintenance entity',
            
            // Form fields - user can edit these
            formFields: {
            },
            
            // Entity fields - read-only, system-managed
            entityFields: {
                id: field({
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Id',
                    dbField: 'id',
                })
            },
            
            // Relationships
            relationships: {
                meter: relationship({
                    type: RelationshipTypes.BELONGS_TO,
                    model: 'Meter',
                    foreignKey: 'meter_id',
                    autoLoad: false,
                }),
            },
            
            validation: {},
        });
    }
}

module.exports = MeterMaintenance;
