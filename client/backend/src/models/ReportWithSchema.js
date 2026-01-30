/**
 * Report Model with Schema Definition
 * 
 * Single source of truth for Report entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Report extends BaseModel {
    constructor(data = {}) {
        super(data);
        Report.schema.initializeFromData(this, data);
    }

    get report_id() {
        return this.id;
    }

    set report_id(value) {
        this.id = value;
    }

    static get tableName() {
        return 'report';
    }

    static get primaryKey() {
        return 'report_id';
    }

    static get schema() {
        const schemaDefinition = {
            entityName: 'Report',
            tableName: 'report',
            description: 'Scheduled report configuration for automated email delivery',
            formMaxWidth: '600px',

            formTabs: [
                tab({
                    name: 'Report Configuration',
                    order: 1,
                    sections: [
                        section({
                            name: 'Basic Information',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'name',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Report Name',
                                    dbField: 'name',
                                    minLength: 1,
                                    maxLength: 255,
                                    placeholder: 'Monthly Usage Report',
                                    filterable: ['main'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'type',
                                    order: 2,
                                    type: FieldTypes.SELECT,
                                    default: 'meter_readings',
                                    required: true,
                                    label: 'Report Type',
                                    dbField: 'type',
                                    enumValues: ['meter_readings', 'usage_summary', 'daily_summary'],
                                    enumLabels: {
                                        'meter_readings': 'Meter Readings',
                                        'usage_summary': 'Usage Summary',
                                        'daily_summary': 'Daily Summary'
                                    },
                                    filterable: ['true'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'enabled',
                                    order: 3,
                                    type: FieldTypes.BOOLEAN,
                                    default: true,
                                    required: false,
                                    label: 'Enabled',
                                    dbField: 'enabled',
                                    filterable: ['true'],
                                    showOn: ['list', 'form'],
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Schedule & Recipients',
                    order: 2,
                    sections: [
                        section({
                            name: 'Schedule Configuration',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'schedule',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '0 9 * * *',
                                    required: true,
                                    label: 'Schedule (Cron Expression)',
                                    dbField: 'schedule',
                                    placeholder: '0 9 * * * (Daily at 9 AM)',
                                    helpText: 'Cron format: minute hour day month day-of-week. Examples: 0 9 * * * (Daily at 9 AM), 0 9 * * 1 (Weekly on Monday)',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'recipients',
                                    order: 2,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Email Recipients',
                                    dbField: 'recipients',
                                    placeholder: 'user@example.com, admin@example.com',
                                    helpText: 'Comma-separated list of email addresses to receive the report',
                                    showOn: ['form'],
                                    // Transform array to comma-separated string for form display
                                    fromApi: (value) => {
                                        if (Array.isArray(value)) {
                                            return value.join(', ');
                                        }
                                        return value || '';
                                    },
                                    // Transform comma-separated string to array for API
                                    toApi: (value) => {
                                        if (typeof value === 'string') {
                                            return value.split(',').map(email => email.trim()).filter(email => email);
                                        }
                                        return value || [];
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        };

        return defineSchema(schemaDefinition);
    }
}

module.exports = Report;
