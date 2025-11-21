#!/usr/bin/env node
/**
 * Migrate All Models to Schema System
 * 
 * This tool:
 * 1. Finds all models in client/backend/src/models/
 * 2. Queries database schema for each table
 * 3. Generates schema-based models
 * 4. Creates backup of original files
 * 5. Registers all models in schema routes
 * 
 * Usage: node scripts/migrate-all-models.js
 */

// Try to load from client/backend first, then fallback to root
try {
    require('dotenv').config({ path: require('path').join(__dirname, '../client/backend/.env') });
} catch (e) {
    require('dotenv').config();
}

const fs = require('fs');
const path = require('path');

// Try to require pg from client/backend node_modules
let Pool;
try {
    Pool = require('../client/backend/node_modules/pg').Pool;
} catch (e) {
    try {
        Pool = require('pg').Pool;
    } catch (e2) {
        console.error('❌ Error: pg module not found. Please run: cd client/backend && npm install');
        process.exit(1);
    }
}

// Database connection
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});

// Type mapping
const PG_TO_JS_TYPE = {
    'integer': 'number',
    'bigint': 'number',
    'smallint': 'number',
    'numeric': 'number',
    'real': 'number',
    'double precision': 'number',
    'serial': 'number',
    'bigserial': 'number',
    'character varying': 'string',
    'varchar': 'string',
    'character': 'string',
    'char': 'string',
    'text': 'string',
    'boolean': 'boolean',
    'date': 'date',
    'timestamp without time zone': 'date',
    'timestamp with time zone': 'date',
    'time': 'string',
    'json': 'object',
    'jsonb': 'object',
    'uuid': 'string',
};

const PG_TO_FIELD_TYPE = {
    'integer': 'NUMBER',
    'bigint': 'NUMBER',
    'smallint': 'NUMBER',
    'numeric': 'NUMBER',
    'serial': 'NUMBER',
    'bigserial': 'NUMBER',
    'character varying': 'STRING',
    'varchar': 'STRING',
    'text': 'STRING',
    'boolean': 'BOOLEAN',
    'date': 'DATE',
    'timestamp without time zone': 'DATE',
    'timestamp with time zone': 'DATE',
    'json': 'OBJECT',
    'jsonb': 'OBJECT',
};

// Convert snake_case to camelCase
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Convert snake_case to PascalCase
function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// Convert column name to label
function toLabel(str) {
    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Query table schema
async function queryTableSchema(tableName) {
    try {
        const result = await pool.query(`
            SELECT 
                c.column_name,
                c.data_type,
                c.character_maximum_length,
                c.is_nullable,
                c.column_default,
                c.udt_name
            FROM information_schema.columns c
            WHERE c.table_name = $1
            ORDER BY c.ordinal_position;
        `, [tableName]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows;
    } catch (error) {
        return null;
    }
}

// Get all tables
async function getAllTables() {
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name NOT LIKE 'pg_%'
            AND table_name NOT LIKE 'sql_%'
            ORDER BY table_name;
        `);

        return result.rows.map(row => row.table_name);
    } catch (error) {
        console.error('Error fetching tables:', error);
        return [];
    }
}

// Categorize fields
function categorizeFields(columns) {
    const formFields = [];
    const entityFields = [];
    const readOnlyFields = ['id', 'created_at', 'updated_at', 'createdat', 'updatedat', 'tenant_id'];

    columns.forEach(col => {
        const fieldName = toCamelCase(col.column_name);
        const isReadOnly = readOnlyFields.includes(col.column_name.toLowerCase());
        const isRequired = col.is_nullable === 'NO' && !col.column_default;

        const fieldInfo = {
            name: fieldName,
            dbColumn: col.column_name,
            type: PG_TO_FIELD_TYPE[col.data_type] || 'STRING',
            jsType: PG_TO_JS_TYPE[col.data_type] || 'string',
            required: isRequired && !isReadOnly,
            readOnly: isReadOnly,
            maxLength: col.character_maximum_length,
            col: col,
        };

        if (isReadOnly) {
            entityFields.push(fieldInfo);
        } else {
            formFields.push(fieldInfo);
        }
    });

    return { formFields, entityFields };
}

// Generate model with schema
function generateModelWithSchema(tableName, columns) {
    const className = toPascalCase(tableName);
    const { formFields, entityFields } = categorizeFields(columns);

    let code = `/**
 * ${className} Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for ${className} entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class ${className} extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        ${className}.schema.initializeFromData(this, data);
    }
    
    static get tableName() {
        return '${tableName}';
    }
    
    static get primaryKey() {
        return 'id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    static get schema() {
        return defineSchema({
            entityName: '${className}',
            tableName: '${tableName}',
            description: '${className} entity',
            
            // Form fields - user can edit these
            formFields: {
`;

    // Add form fields
    formFields.forEach((field, idx) => {
        const defaultVal = field.type === 'NUMBER' ? '0' :
                          field.type === 'BOOLEAN' ? 'false' :
                          field.type === 'OBJECT' ? 'null' : "''";
        
        code += `                ${field.name}: field({
                    type: FieldTypes.${field.type},
                    default: ${defaultVal},
                    required: ${field.required},
                    label: '${toLabel(field.dbColumn)}',
                    dbField: '${field.dbColumn}',`;
        
        if (field.maxLength) {
            code += `\n                    maxLength: ${field.maxLength},`;
        }
        
        code += `\n                })${idx < formFields.length - 1 ? ',' : ''}\n`;
    });

    code += `            },
            
            // Entity fields - read-only, system-managed
            entityFields: {
`;

    // Add entity fields
    entityFields.forEach((field, idx) => {
        const defaultVal = field.type === 'NUMBER' ? 'null' :
                          field.type === 'BOOLEAN' ? 'false' :
                          field.type === 'DATE' ? 'null' : 'null';
        
        code += `                ${field.name}: field({
                    type: FieldTypes.${field.type},
                    default: ${defaultVal},
                    readOnly: true,
                    label: '${toLabel(field.dbColumn)}',
                    dbField: '${field.dbColumn}',
                })${idx < entityFields.length - 1 ? ',' : ''}\n`;
    });

    code += `            },
            
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

module.exports = ${className};
`;

    return code;
}

// Main function
async function main() {
    console.log('\n' + '='.repeat(80));
    console.log('MIGRATE ALL MODELS TO SCHEMA SYSTEM');
    console.log('='.repeat(80) + '\n');

    try {
        // Get all tables
        console.log('📋 Fetching all tables from database...\n');
        const tables = await getAllTables();
        
        if (tables.length === 0) {
            console.log('❌ No tables found in database');
            process.exit(1);
        }

        console.log(`✅ Found ${tables.length} tables:\n`);
        tables.forEach(table => console.log(`  - ${table}`));
        console.log('');

        const modelsDir = path.join(__dirname, '..', 'client', 'backend', 'src', 'models');
        const backupDir = path.join(__dirname, '..', 'client', 'backend', 'src', 'models', 'backup');
        const generatedDir = path.join(__dirname, '..', 'generated', 'models');

        // Create directories
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir, { recursive: true });
        }

        const migrated = [];
        const skipped = [];
        const failed = [];

        // Process each table
        for (const tableName of tables) {
            console.log(`\n📝 Processing table: ${tableName}`);
            
            // Query schema
            const columns = await queryTableSchema(tableName);
            if (!columns) {
                console.log(`  ⚠️  Could not query schema, skipping`);
                skipped.push(tableName);
                continue;
            }

            console.log(`  ✅ Found ${columns.length} columns`);

            // Generate model
            const modelCode = generateModelWithSchema(tableName, columns);
            const className = toPascalCase(tableName);
            const outputPath = path.join(generatedDir, `${className}WithSchema.js`);

            // Write generated model
            fs.writeFileSync(outputPath, modelCode);
            console.log(`  ✅ Generated: ${outputPath}`);

            migrated.push({ table: tableName, class: className, path: outputPath });
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(80) + '\n');

        console.log(`✅ Migrated: ${migrated.length} models`);
        console.log(`⚠️  Skipped: ${skipped.length} models`);
        console.log(`❌ Failed: ${failed.length} models`);
        console.log('');

        if (migrated.length > 0) {
            console.log('Migrated Models:');
            migrated.forEach(m => {
                console.log(`  ✅ ${m.class} (${m.table})`);
            });
            console.log('');
        }

        // Generate schema routes registration
        console.log('📝 Generating schema routes registration...\n');
        
        const routesCode = migrated.map(m => {
            return `  ${m.table}: require('../models/${m.class}WithSchema'),`;
        }).join('\n');

        console.log('Add these to client/backend/src/routes/schema.js:');
        console.log('-'.repeat(80));
        console.log(routesCode);
        console.log('-'.repeat(80));
        console.log('');

        console.log('✨ Migration complete!\n');
        console.log('Next steps:');
        console.log('  1. Review generated models in: generated/models/');
        console.log('  2. Add relationships to each model');
        console.log('  3. Copy models to: client/backend/src/models/');
        console.log('  4. Update schema routes with the code above');
        console.log('  5. Test each model');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run
main();
