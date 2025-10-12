/**
 * Email System Setup Script
 * Creates the email_logs table and initializes the email service
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('../src/config/database');
const emailService = require('../src/services/EmailService');

async function setupEmailSystem() {
    console.log('🚀 Setting up email system...');
    
    try {
        // Connect to database
        await db.connect();
        console.log('✅ Database connected');

        // Read and execute the SQL migration for email logs
        const sqlPath = path.join(__dirname, 'create-email-logs-table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📊 Creating email_logs table...');
        await db.query(sqlContent);
        console.log('✅ Email logs table created successfully');

        // Initialize email service
        console.log('📧 Initializing email service...');
        const initResult = await emailService.initialize();
        
        if (initResult.success) {
            console.log('✅ Email service initialized successfully');
            
            // Get health status
            const health = await emailService.getHealthStatus();
            console.log('\n📊 Email Service Status:');
            console.log(`   Healthy: ${health.isHealthy ? '✅' : '❌'}`);
            console.log(`   SMTP Host: ${health.config.host}`);
            console.log(`   SMTP Port: ${health.config.port}`);
            console.log(`   Secure: ${health.config.secure}`);
            console.log(`   Connection: ${health.connection || 'not tested'}`);
            
            if (health.connectionError) {
                console.log(`   Connection Error: ${health.connectionError}`);
            }
        } else {
            console.log('❌ Email service initialization failed:', initResult.error);
            console.log('\n💡 Make sure to configure SMTP settings in your .env file:');
            console.log('   SMTP_HOST=your-smtp-host');
            console.log('   SMTP_PORT=587');
            console.log('   SMTP_SECURE=false');
            console.log('   SMTP_USER=your-email@domain.com');
            console.log('   SMTP_PASSWORD=your-password');
            console.log('   EMAIL_FROM_NAME=Your Name');
            console.log('   EMAIL_FROM_ADDRESS=noreply@yourdomain.com');
        }

        console.log('\n🎉 Email system setup completed!');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        // Close connections
        await emailService.close();
        await db.disconnect();
        console.log('👋 Connections closed');
        process.exit(0);
    }
}

// Handle script arguments
const args = process.argv.slice(2);
const testEmail = args.includes('--test');

if (testEmail) {
    console.log('🧪 Test mode: Will send a test email after setup');
}

// Run the setup
setupEmailSystem().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});