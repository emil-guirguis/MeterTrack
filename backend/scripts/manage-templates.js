#!/usr/bin/env node

/**
 * Email Templates Management CLI
 * Command-line interface for managing email templates
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('../src/config/database');
const EmailTemplateSeeder = require('../src/services/EmailTemplateSeeder');

// Command line argument parsing
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    console.log('📧 Email Templates Management CLI\n');

    if (!command) {
        showHelp();
        process.exit(0);
    }

    try {
        // Connect to database
        await db.connect();

        switch (command) {
            case 'seed':
                await handleSeed(args.slice(1));
                break;
            case 'health':
                await handleHealth();
                break;
            case 'repair':
                await handleRepair();
                break;
            case 'reset':
                await handleReset();
                break;
            case 'list':
                await handleList();
                break;
            case 'stats':
                await handleStats();
                break;
            default:
                console.error(`❌ Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ Command failed:', error.message);
        process.exit(1);
    } finally {
        await db.disconnect();
        process.exit(0);
    }
}

function showHelp() {
    console.log(`Usage: node manage-templates.js <command> [options]

Commands:
  seed [--force] [--update]  Seed default email templates
  health                     Check template system health
  repair                     Repair missing templates
  reset                      Remove all default templates
  list                       List all templates
  stats                      Show template statistics

Options:
  --force                    Continue on errors
  --update                   Update existing templates
  --verbose                  Show detailed output

Examples:
  node manage-templates.js seed
  node manage-templates.js seed --force --update
  node manage-templates.js health
  node manage-templates.js repair
`);
}

async function handleSeed(options) {
    const force = options.includes('--force');
    const update = options.includes('--update');
    const verbose = options.includes('--verbose');

    console.log('🌱 Seeding default email templates...');
    
    const result = await EmailTemplateSeeder.seedDefaultTemplates({
        force,
        updateExisting: update,
        verbose: true
    });

    console.log('\n📊 Seeding Results:');
    console.log(`   Created: ${result.created}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Total: ${result.total}`);

    if (result.errors > 0) {
        console.log('\n⚠️  Some templates failed to seed. Use --force to continue on errors.');
    } else {
        console.log('\n✅ Template seeding completed successfully!');
    }
}

async function handleHealth() {
    console.log('🔍 Checking template system health...');
    
    const health = await EmailTemplateSeeder.checkTemplateHealth();

    console.log('\n📊 Template System Health:');
    console.log(`   Status: ${health.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   Total Templates: ${health.totalTemplates}`);
    console.log(`   Default Templates: ${health.defaultTemplates}`);
    console.log(`   Active Templates: ${health.activeTemplates}`);
    console.log(`   Required Templates: ${health.requiredTemplates}`);

    if (health.missingTemplates.length > 0) {
        console.log(`\n❌ Missing Templates (${health.missingTemplates.length}):`);
        health.missingTemplates.forEach(name => {
            console.log(`   - ${name}`);
        });
        console.log('\n💡 Run "repair" command to fix missing templates.');
    }

    console.log('\n📈 Templates by Category:');
    console.log(`   Meter Readings: ${health.categories.meterReadings}`);
    console.log(`   Meter Errors: ${health.categories.meterErrors}`);
    console.log(`   Maintenance: ${health.categories.maintenance}`);
    console.log(`   General: ${health.categories.general}`);

    if (health.error) {
        console.log(`\n❌ Health Check Error: ${health.error}`);
    }
}

async function handleRepair() {
    console.log('🔧 Repairing template system...');
    
    const result = await EmailTemplateSeeder.repairTemplates();

    console.log(`\n✅ Repair completed: ${result.repaired} templates restored`);
}

async function handleReset() {
    console.log('⚠️  This will remove ALL default templates!');
    console.log('Are you sure? This action cannot be undone.');
    
    // Simple confirmation (in a real CLI, you'd use a proper prompt library)
    const confirm = process.env.CONFIRM_RESET === 'yes';
    
    if (!confirm) {
        console.log('❌ Reset cancelled. Set CONFIRM_RESET=yes to proceed.');
        return;
    }

    console.log('🗑️  Removing default templates...');
    
    const result = await EmailTemplateSeeder.removeDefaultTemplates();

    console.log(`\n✅ Reset completed: ${result.removed} templates removed`);
}

async function handleList() {
    console.log('📋 Listing all email templates...');
    
    const EmailTemplate = require('../src/models/EmailTemplatePG');
    const result = await EmailTemplate.findAll({ 
        sortBy: 'category',
        sortOrder: 'asc'
    });

    if (result.templates.length === 0) {
        console.log('\n📭 No templates found.');
        return;
    }

    console.log(`\n📊 Found ${result.total} templates:\n`);

    let currentCategory = '';
    result.templates.forEach(template => {
        if (template.category !== currentCategory) {
            currentCategory = template.category;
            console.log(`\n📁 ${currentCategory.toUpperCase()}:`);
        }

        const status = template.isactive ? '✅' : '❌';
        const isDefault = template.isdefault ? '[DEFAULT]' : '';
        const usage = template.usagecount > 0 ? `(used ${template.usagecount} times)` : '';
        
        console.log(`   ${status} ${template.name} ${isDefault} ${usage}`);
    });
}

async function handleStats() {
    console.log('📊 Template system statistics...');
    
    const EmailTemplate = require('../src/models/EmailTemplatePG');
    const stats = await EmailTemplate.getStats();

    console.log('\n📈 Template Statistics:');
    console.log(`   Total Templates: ${stats.total_templates}`);
    console.log(`   Active Templates: ${stats.active_templates}`);
    console.log(`   Default Templates: ${stats.default_templates}`);
    console.log(`   Total Usage: ${stats.total_usage || 0}`);
    console.log(`   Average Usage: ${parseFloat(stats.average_usage || 0).toFixed(2)}`);

    console.log('\n📁 Templates by Category:');
    console.log(`   Meter Readings: ${stats.meter_reading_templates}`);
    console.log(`   Meter Errors: ${stats.meter_error_templates}`);
    console.log(`   Maintenance: ${stats.maintenance_templates}`);
    console.log(`   General: ${stats.general_templates}`);
}

// Run the CLI
main().catch(error => {
    console.error('❌ CLI error:', error);
    process.exit(1);
});