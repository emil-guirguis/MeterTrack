/**
 * Migration script to copy data from MongoDB to PostgreSQL
 * Copies all collections from MongoDB to corresponding PostgreSQL tables
 */

const mongoose = require('mongoose');
const { Client } = require('pg');
require('dotenv').config();

// Database configurations
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://emil_user:db2424@cluster0.tveleqd.mongodb.net/meterdb';
const POSTGRES_CONFIG = {
    host: process.env.POSTGRES_HOST || 'aws-1-us-west-1.pooler.supabase.com',
    port: process.env.POSTGRES_PORT || 6543,
    database: process.env.POSTGRES_DB || 'postgres',
    user: process.env.POSTGRES_USER || 'postgres.hpetwjgsfpscjlnzmzby',
    password: process.env.POSTGRES_PASSWORD || 'your-password-here',
    ssl: { rejectUnauthorized: false }
};

class DatabaseMigrator {
    constructor() {
        this.mongoClient = null;
        this.pgClient = null;
        this.stats = {
            users: 0,
            buildings: 0,
            equipment: 0,
            contacts: 0,
            meters: 0,
            meterReadings: 0,
            emailTemplates: 0,
            companySettings: 0
        };
    }

    async connect() {
        console.log('Connecting to databases...');
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        this.mongoClient = mongoose.connection.db;
        console.log('✓ Connected to MongoDB');

        // Connect to PostgreSQL
        this.pgClient = new Client(POSTGRES_CONFIG);
        await this.pgClient.connect();
        console.log('✓ Connected to PostgreSQL');
    }

    async disconnect() {
        if (this.mongoClient) {
            await mongoose.disconnect();
            console.log('✓ Disconnected from MongoDB');
        }
        
        if (this.pgClient) {
            await this.pgClient.end();
            console.log('✓ Disconnected from PostgreSQL');
        }
    }

    // Helper function to format MongoDB ObjectId as UUID for PostgreSQL
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async migrateUsers() {
        console.log('\n📋 Migrating users...');
        
        const users = await this.mongoClient.collection('users').find({}).toArray();
        
        for (const user of users) {
            const query = `
                INSERT INTO users (
                    id, email, name, passwordhash, role, permissions, status, lastlogin, createdat, updatedat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    passwordhash = EXCLUDED.passwordhash,
                    role = EXCLUDED.role,
                    permissions = EXCLUDED.permissions,
                    status = EXCLUDED.status,
                    lastlogin = EXCLUDED.lastlogin,
                    updatedat = EXCLUDED.updatedat
            `;
            
            const values = [
                this.generateUUID(),
                user.email,
                user.name,
                user.password, // MongoDB field is 'password', PostgreSQL is 'passwordhash'
                user.role,
                JSON.stringify(user.permissions || []), // Convert to JSON string
                user.status,
                user.lastLogin ? new Date(user.lastLogin) : null,
                user.createdAt ? new Date(user.createdAt) : new Date(),
                user.updatedAt ? new Date(user.updatedAt) : new Date()
            ];

            try {
                await this.pgClient.query(query, values);
                this.stats.users++;
            } catch (error) {
                console.error(`Error migrating user ${user.email}:`, error.message);
            }
        }
        
        console.log(`✓ Migrated ${this.stats.users} users`);
    }

    async migrateBuildings() {
        console.log('\n🏢 Migrating buildings...');
        
        const buildings = await this.mongoClient.collection('buildings').find({}).toArray();
        
        for (const building of buildings) {
            const query = `
                INSERT INTO buildings (
                    id, name, address_street, address_city, address_state, address_zip_code, address_country,
                    contact_primarycontact, contact_email, contact_phone, contact_website,
                    type, status, totalfloors, totalunits, yearbuilt, squarefootage,
                    description, notes, equipmentcount, metercount, createdat, updatedat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            `;
            
            const values = [
                this.generateUUID(),
                building.name,
                building.address?.street || '',
                building.address?.city || '',
                building.address?.state || '',
                building.address?.zipCode || '',
                building.address?.country || '',
                building.contactInfo?.primaryContact || null,
                building.contactInfo?.email || '',
                building.contactInfo?.phone || '',
                building.contactInfo?.website || null,
                building.type,
                building.status,
                building.totalFloors || null,
                building.totalUnits || null,
                building.yearBuilt || null,
                building.squareFootage || null,
                building.description || null,
                building.notes || null,
                building.equipmentCount || 0,
                building.meterCount || 0,
                new Date(building.createdAt),
                new Date(building.updatedAt)
            ];

            try {
                await this.pgClient.query(query, values);
                this.stats.buildings++;
            } catch (error) {
                console.error(`Error migrating building ${building.name}:`, error.message);
            }
        }
        
        console.log(`✓ Migrated ${this.stats.buildings} buildings`);
    }

    async migrateEquipment() {
        console.log('\n⚙️ Migrating equipment...');
        
        const equipment = await this.mongoClient.collection('equipment').find({}).toArray();
        
        for (const item of equipment) {
            const query = `
                INSERT INTO equipment (
                    id, name, type, buildingid, buildingname, specifications, status,
                    installdate, lastmaintenance, nextmaintenance, serialnumber,
                    manufacturer, model, location, notes, createdat, updatedat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `;
            
            const values = [
                this.generateUUID(),
                item.name,
                item.type,
                item.buildingId && item.buildingId !== "" ? this.generateUUID() : null, // Convert to UUID or null
                item.buildingName || null,
                JSON.stringify(item.specifications || {}), // Convert to JSON string
                item.status,
                item.installationDate ? new Date(item.installationDate) : new Date(),
                item.lastMaintenance ? new Date(item.lastMaintenance) : null,
                item.nextMaintenance ? new Date(item.nextMaintenance) : null,
                item.serialNumber || null,
                item.manufacturer || null,
                item.model || null,
                item.location?.description || null,
                item.notes || null,
                item.createdAt ? new Date(item.createdAt) : new Date(),
                item.updatedAt ? new Date(item.updatedAt) : new Date()
            ];

            try {
                await this.pgClient.query(query, values);
                this.stats.equipment++;
            } catch (error) {
                console.error(`Error migrating equipment ${item.name}:`, error.message);
            }
        }
        
        console.log(`✓ Migrated ${this.stats.equipment} equipment items`);
    }

    async migrateContacts() {
        console.log('\n👥 Migrating contacts...');
        
        const contacts = await this.mongoClient.collection('contacts').find({}).toArray();
        
        for (const contact of contacts) {
            const query = `
                INSERT INTO contacts (
                    id, name, company, role, email, phone, address_street, address_city,
                    address_state, address_zip_code, address_country, category, status,
                    notes, createdat, updatedat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `;
            
            const values = [
                this.generateUUID(),
                contact.name,
                contact.company || null,
                contact.role || null,
                contact.email,
                contact.phone || null,
                contact.address?.street || null,
                contact.address?.city || null,
                contact.address?.state || null,
                contact.address?.zipCode || null,
                contact.address?.country || null,
                contact.category || 'vendor', // Default category if missing
                contact.status || 'active', // Default status if missing
                contact.notes || null,
                contact.createdAt ? new Date(contact.createdAt) : new Date(),
                contact.updatedAt ? new Date(contact.updatedAt) : new Date()
            ];

            try {
                await this.pgClient.query(query, values);
                this.stats.contacts++;
            } catch (error) {
                console.error(`Error migrating contact ${contact.name}:`, error.message);
            }
        }
        
        console.log(`✓ Migrated ${this.stats.contacts} contacts`);
    }

    async migrateMeters() {
        console.log('\n📊 Migrating meters...');
        
        const meters = await this.mongoClient.collection('meters').find({}).toArray();
        
        for (const meter of meters) {
            const query = `
                INSERT INTO meters (
                    id, meterid, name, type, manufacturer, model, serialnumber,
                    installation_date, last_reading_date, status, location_building,
                    location_floor, location_room, location_description,
                    unit_of_measurement, multiplier, notes, createdat, updatedat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            `;
            
            const values = [
                this.generateUUID(),
                meter.meterId || `meter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate meterId if missing
                meter.name || `Meter ${meter.meterId || 'Unknown'}`,
                meter.type || 'electric',
                meter.manufacturer || null,
                meter.model || null,
                meter.serialNumber || null,
                meter.installationDate ? new Date(meter.installationDate) : null,
                meter.lastReadingDate ? new Date(meter.lastReadingDate) : null,
                meter.status || 'active',
                meter.location?.building || null,
                meter.location?.floor || null,
                meter.location?.room || null,
                meter.location?.description || null,
                meter.unitOfMeasurement || 'kWh',
                meter.multiplier || 1,
                meter.notes || null,
                meter.createdAt ? new Date(meter.createdAt) : new Date(),
                meter.updatedAt ? new Date(meter.updatedAt) : new Date()
            ];

            try {
                await this.pgClient.query(query, values);
                this.stats.meters++;
            } catch (error) {
                console.error(`Error migrating meter ${meter.meterId || 'unknown'}:`, error.message);
            }
        }
        
        console.log(`✓ Migrated ${this.stats.meters} meters`);
    }

    async migrateMeterReadings() {
        console.log('\n📈 Migrating meter readings...');
        
        const readings = await this.mongoClient.collection('meterReadings').find({}).toArray();
        
        for (const reading of readings) {
            const query = `
                INSERT INTO meterreadings (
                    id, meterid, reading_date, reading_value, reading_type,
                    multiplier, final_value, unit_of_measurement, status,
                    notes, read_by, verified_by, verified_date, createdat, updatedat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `;
            
            const values = [
                this.generateUUID(),
                reading.meterId,
                new Date(reading.readingDate),
                reading.readingValue,
                reading.readingType || 'manual',
                reading.multiplier || 1,
                reading.finalValue || reading.readingValue,
                reading.unitOfMeasurement || null,
                reading.status || 'active',
                reading.notes || null,
                reading.readBy || null,
                reading.verifiedBy || null,
                reading.verifiedDate ? new Date(reading.verifiedDate) : null,
                new Date(reading.createdAt),
                new Date(reading.updatedAt)
            ];

            try {
                await this.pgClient.query(query, values);
                this.stats.meterReadings++;
            } catch (error) {
                console.error(`Error migrating meter reading for ${reading.meterId}:`, error.message);
            }
        }
        
        console.log(`✓ Migrated ${this.stats.meterReadings} meter readings`);
    }

    async migrateCompanySettings() {
        console.log('\n🏢 Migrating company settings...');
        
        const settings = await this.mongoClient.collection('companySettings').find({}).toArray();
        
        for (const setting of settings) {
            const query = `
                INSERT INTO companysettings (
                    id, company_name, company_address_street, company_address_city,
                    company_address_state, company_address_zip_code, company_address_country,
                    company_phone, company_email, company_website,
                    default_currency, default_timezone, business_hours,
                    notification_settings, createdat, updatedat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `;
            
            const values = [
                this.generateUUID(),
                setting.companyName,
                setting.companyAddress?.street || null,
                setting.companyAddress?.city || null,
                setting.companyAddress?.state || null,
                setting.companyAddress?.zipCode || null,
                setting.companyAddress?.country || null,
                setting.companyPhone || null,
                setting.companyEmail || null,
                setting.companyWebsite || null,
                setting.defaultCurrency || 'USD',
                setting.defaultTimezone || 'UTC',
                JSON.stringify(setting.businessHours || {}), // Convert to JSON string
                JSON.stringify(setting.notificationSettings || {}), // Convert to JSON string
                setting.createdAt ? new Date(setting.createdAt) : new Date(),
                setting.updatedAt ? new Date(setting.updatedAt) : new Date()
            ];

            try {
                await this.pgClient.query(query, values);
                this.stats.companySettings++;
            } catch (error) {
                console.error(`Error migrating company settings:`, error.message);
            }
        }
        
        console.log(`✓ Migrated ${this.stats.companySettings} company settings`);
    }

    async migrateEmailTemplates() {
        console.log('\n📧 Migrating email templates...');
        
        const templates = await this.mongoClient.collection('emailTemplates').find({}).toArray();
        
        for (const template of templates) {
            const query = `
                INSERT INTO email_templates (
                    id, name, subject, body_html, body_text, template_type,
                    status, variables, createdat, updatedat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (name) DO UPDATE SET
                    subject = EXCLUDED.subject,
                    body_html = EXCLUDED.body_html,
                    body_text = EXCLUDED.body_text,
                    template_type = EXCLUDED.template_type,
                    status = EXCLUDED.status,
                    variables = EXCLUDED.variables,
                    updatedat = EXCLUDED.updatedat
            `;
            
            const values = [
                this.generateUUID(),
                template.name,
                template.subject,
                template.bodyHtml || null,
                template.bodyText || null,
                template.templateType || template.type || 'general',
                template.status || 'active',
                JSON.stringify(template.variables || {}), // Convert to JSON string
                template.createdAt ? new Date(template.createdAt) : new Date(),
                template.updatedAt ? new Date(template.updatedAt) : new Date()
            ];

            try {
                await this.pgClient.query(query, values);
                this.stats.emailTemplates++;
            } catch (error) {
                console.error(`Error migrating email template ${template.name}:`, error.message);
            }
        }
        
        console.log(`✓ Migrated ${this.stats.emailTemplates} email templates`);
    }

    async migrate() {
        try {
            await this.connect();
            
            console.log('\n🚀 Starting migration process...\n');
            
            await this.migrateUsers();
            await this.migrateBuildings();
            await this.migrateEquipment();
            await this.migrateContacts();
            await this.migrateMeters();
            await this.migrateMeterReadings();
            await this.migrateEmailTemplates();
            await this.migrateCompanySettings();
            
            console.log('\n✅ Migration completed successfully!');
            console.log('\n📊 Migration Statistics:');
            console.log(`  Users: ${this.stats.users}`);
            console.log(`  Buildings: ${this.stats.buildings}`);
            console.log(`  Equipment: ${this.stats.equipment}`);
            console.log(`  Contacts: ${this.stats.contacts}`);
            console.log(`  Meters: ${this.stats.meters}`);
            console.log(`  Meter Readings: ${this.stats.meterReadings}`);
            console.log(`  Email Templates: ${this.stats.emailTemplates}`);
            console.log(`  Company Settings: ${this.stats.companySettings}`);
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    const migrator = new DatabaseMigrator();
    migrator.migrate().catch(console.error);
}

module.exports = DatabaseMigrator;