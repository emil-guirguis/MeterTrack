/**
 * Email Templates Setup Script
 * Creates the email_templates table and seeds default templates
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('../src/config/database');
const EmailTemplateSeeder = require('../src/services/EmailTemplateSeeder');

async function setupEmailTemplates() {
    console.log('🚀 Setting up email templates system...');
    
    try {
        // Connect to database
        await db.connect();
        console.log('✅ Database connected');

        // Read and execute the SQL migration
        const sqlPath = path.join(__dirname, 'create-email-templates-table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📊 Creating email_templates table...');
        await db.query(sqlContent);
        console.log('✅ Email templates table created successfully');

        // Seed default templates
        console.log('🌱 Seeding default email templates...');
        const seedResult = await EmailTemplateSeeder.seedDefaultTemplates();
        console.log(`✅ Default templates seeded: ${seedResult.created} created, ${seedResult.skipped} skipped`);

        console.log('🎉 Email templates system setup completed successfully!');
        
        // Display summary
        const EmailTemplate = require('../src/models/EmailTemplatePG');
        const stats = await EmailTemplate.getStats();
        console.log('\n📈 Email Templates Summary:');
        console.log(`   Total templates: ${stats.total_templates}`);
        console.log(`   Active templates: ${stats.active_templates}`);
        console.log(`   Default templates: ${stats.default_templates}`);
        console.log(`   Categories:`);
        console.log(`     - Meter readings: ${stats.meter_reading_templates}`);
        console.log(`     - Meter errors: ${stats.meter_error_templates}`);
        console.log(`     - Maintenance: ${stats.maintenance_templates}`);
        console.log(`     - General: ${stats.general_templates}`);

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        // Close database connection
        await db.disconnect();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

// Handle script arguments
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');

if (shouldReset) {
    console.log('⚠️  Reset mode: This will remove existing default templates first');
}

// Run the setup
setupEmailTemplates().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});