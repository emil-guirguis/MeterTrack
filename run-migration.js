/**
 * Simple migration runner that creates tables and migrates data
 * This script handles both PostgreSQL table creation and data migration
 */

const fs = require('fs');
const path = require('path');
const DatabaseMigrator = require('./migrate-mongo-to-postgres');

class MigrationRunner {
    constructor() {
        this.migrator = new DatabaseMigrator();
    }

    async createTables() {
        console.log('📋 Creating PostgreSQL tables...');
        
        try {
            // Read the table creation SQL file
            const sqlFile = path.join(__dirname, 'create-postgres-tables.sql');
            const sql = fs.readFileSync(sqlFile, 'utf8');
            
            // Split SQL into individual statements (simple split on semicolon)
            const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
            
            // Connect to PostgreSQL
            await this.migrator.connect();
            
            // Execute each statement
            for (const statement of statements) {
                const trimmedStatement = statement.trim();
                if (trimmedStatement) {
                    try {
                        await this.migrator.pgClient.query(trimmedStatement);
                    } catch (error) {
                        // Ignore errors for statements that might already exist (like CREATE TABLE IF NOT EXISTS)
                        if (!error.message.includes('already exists')) {
                            console.warn(`Warning executing SQL: ${error.message}`);
                        }
                    }
                }
            }
            
            console.log('✓ PostgreSQL tables created successfully');
            
            // Disconnect temporarily
            await this.migrator.disconnect();
            
        } catch (error) {
            console.error('❌ Error creating tables:', error.message);
            throw error;
        }
    }

    async run() {
        try {
            console.log('🚀 Starting MongoDB to PostgreSQL Migration');
            console.log('==============================================\n');
            
            // Check if .env.migration exists
            if (!fs.existsSync('.env.migration')) {
                console.error('❌ .env.migration file not found!');
                console.log('Please copy .env.migration to .env.migration and configure your database connections.');
                process.exit(1);
            }
            
            // Load environment variables
            require('dotenv').config({ path: '.env.migration' });
            
            // Step 1: Create tables
            await this.createTables();
            
            console.log('');
            
            // Step 2: Migrate data
            await this.migrator.migrate();
            
            console.log('\n🎉 Migration completed successfully!');
            console.log('\nNext Steps:');
            console.log('1. Update your application configuration to use PostgreSQL');
            console.log('2. Test your application with the new PostgreSQL database');
            console.log('3. Consider backing up your MongoDB data before making the switch permanent');
            
        } catch (error) {
            console.error('\n❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    const runner = new MigrationRunner();
    runner.run().catch(console.error);
}

module.exports = MigrationRunner;