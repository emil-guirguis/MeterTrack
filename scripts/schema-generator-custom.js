#!/usr/bin/env node
/**
 * Database Schema to Code Generator with Custom Mappings
 * 
 * This enhanced version supports custom field mappings for cases where
 * frontend field names don't match database column names.
 * 
 * Usage: node scripts/schema-generator-custom.js <table_name> [mapping_file]
 * Example: node scripts/schema-generator-custom.js meter scripts/schema-mappings/meter-mapping.json
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

// Convert snake_case to camelCase
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Convert snake_case to PascalCase
function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
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
                c.udt_name,
                pgd.description
            FROM information_schema.columns c
            LEFT JOIN pg_catalog.pg_statio_all_tables st 
                ON c.table_schema = st.schemaname 
                AND c.table_name = st.relname
            LEFT JOIN pg_catalog.pg_description pgd 
                ON pgd.objoid = st.relid 
                AND pgd.objsubid = c.ordinal_position
            WHERE c.table_name = $1
            ORDER BY c.ordinal_position;
        `, [tableName]);

        if (result.rows.length === 0) {
            throw new Error(`Table '${tableName}' not found in database`);
        }

        return result.rows;
    } catch (error) {
        throw new Error(`Failed to query schema: ${error.message}`);
    }
}

// Generate frontend schema with custom mappings
function generateFrontendSchemaWithMapping(tableName, mapping) {
    const className = toPascalCase(tableName);
    const varName = toCamelCase(tableName);
    
    let code = `/**
 * ${className} Configuration
 * 
 * Centralized configuration for ${className} entity including:
 * - Form schema (field definitions, validation, API mapping)
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * This configuration is shared between ${className}Form and ${className}List components.
 */

import React from 'react';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission } from '../../types/auth';
import { field } from '@framework/forms/utils/formSchema';
import { defineEntitySchema } from '@framework/forms/utils/entitySchema';
import {
  createStatusColumn,
  createStandardStatusActions,
  createExportAction,
} from '../../config/listHelpers';

// ============================================================================
// UNIFIED SCHEMA DEFINITION
// ============================================================================

/**
 * ${className} entity schema - single source of truth for ${className} entity
 * Defines form fields, entity fields, and legacy field mappings
 */
export const ${varName}Schema = defineEntitySchema({
  formFields: {
`;

    // Add form fields from mapping
    const formFieldEntries = Object.entries(mapping.customFormFields);
    formFieldEntries.forEach(([fieldName, config], idx) => {
        const typeStr = config.type === 'object' ? "'string' as any" : `'${config.type}'`;
        const defaultVal = config.type === 'number' ? config.default :
                          config.type === 'boolean' ? config.default :
                          config.type === 'object' ? 'null' :
                          config.default === null ? 'null' :
                          `'${config.default}'`;
        
        const requiredStr = config.required ? 'required: true, ' : '';
        const comment = config.comment ? ` // ${config.comment}` : '';
        
        code += `    ${fieldName}: field({ type: ${typeStr}, default: ${defaultVal}, ${requiredStr}label: '${config.label}' })${idx < formFieldEntries.length - 1 ? ',' : ''}${comment}\n`;
    });

    code += `  },
  
  entityFields: {
`;

    // Add entity fields from mapping
    const entityFieldEntries = Object.entries(mapping.entityFields);
    entityFieldEntries.forEach(([fieldName, config], idx) => {
        const typeStr = config.type === 'object' ? "'string' as any" : `'${config.type}'`;
        const readOnlyStr = config.readOnly ? ', readOnly: true' : '';
        const defaultVal = config.default !== undefined ? 
            (config.type === 'number' ? config.default :
             config.type === 'boolean' ? config.default :
             config.type === 'object' ? '{}' :
             config.default === null ? 'undefined' :
             `'${config.default}'`) : 
            (config.type === 'number' ? '0' :
             config.type === 'boolean' ? 'false' :
             config.type === 'date' ? 'new Date()' :
             config.type === 'object' ? 'undefined' :
             'undefined');
        
        const comment = config.comment ? ` // ${config.comment}` : '';
        
        if (config.enumValues) {
            code += `    ${fieldName}: { \n      type: ${typeStr} as const,\n      enumValues: [${config.enumValues.map(v => `'${v}'`).join(', ')}] as const,\n      default: '${config.default}' as const${readOnlyStr}\n    }${idx < entityFieldEntries.length - 1 ? ',' : ''}${comment}\n`;
        } else {
            code += `    ${fieldName}: { type: ${typeStr} as const, default: ${defaultVal}${readOnlyStr} }${idx < entityFieldEntries.length - 1 ? ',' : ''}${comment}\n`;
        }
    });

    code += `  },
  
  entityName: '${className}',
  description: '${className} entity for managing ${tableName} records',
} as const);

/**
 * ${className} form schema - exported for backward compatibility
 * Used by ${className}Form component
 */
export const ${varName}FormSchema = ${varName}Schema.form;

// Add your existing types, columns, filters, and export config here...
// (Keep the rest of your existing meterConfig.ts content)
`;

    return code;
}

// Main function
async function main() {
    const tableName = process.argv[2];
    const mappingFile = process.argv[3];
    
    if (!tableName) {
        console.error('Usage: node scripts/schema-generator-custom.js <table_name> [mapping_file]');
        console.error('Example: node scripts/schema-generator-custom.js meter scripts/schema-mappings/meter-mapping.json');
        process.exit(1);
    }

    console.log(`\n🔍 Querying schema for table: ${tableName}\n`);

    try {
        // Query schema
        const columns = await queryTableSchema(tableName);
        console.log(`✅ Found ${columns.length} columns\n`);

        // Load custom mapping if provided
        let mapping = null;
        if (mappingFile) {
            if (!fs.existsSync(mappingFile)) {
                console.error(`❌ Mapping file not found: ${mappingFile}`);
                process.exit(1);
            }
            mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
            console.log(`📋 Loaded custom mapping from: ${mappingFile}\n`);
        }

        if (mapping) {
            // Generate with custom mapping
            console.log('📝 Generating frontend schema with custom mappings...');
            const frontendCode = generateFrontendSchemaWithMapping(tableName, mapping);
            const frontendPath = path.join(__dirname, '..', 'generated', `${toCamelCase(tableName)}Config-custom.ts`);
            fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
            fs.writeFileSync(frontendPath, frontendCode);
            console.log(`✅ Frontend schema saved to: ${frontendPath}\n`);
            
            console.log('💡 Note: This generated the schema definition only.');
            console.log('   Copy the rest of your existing config (types, columns, filters, etc.)');
            console.log('   from your current meterConfig.ts file.\n');
        } else {
            console.log('ℹ️  No mapping file provided. Use the standard generator instead.');
            console.log('   Or create a mapping file like: scripts/schema-mappings/meter-mapping.json\n');
        }

        console.log('✨ Generation complete!\n');
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run
main();
