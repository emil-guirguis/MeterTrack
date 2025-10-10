/**
 * Script to create PostgreSQL tables for the facility management system
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const POSTGRES_CONFIG = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false }
};

async function createTables() {
    const client = new Client(POSTGRES_CONFIG);
    
    try {
        console.log('Connecting to PostgreSQL...');
        await client.connect();
        console.log('✓ Connected to PostgreSQL');
        
        console.log('Reading SQL file...');
        const sqlFile = path.join(__dirname, 'create-postgres-tables.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('Creating tables...');
        await client.query(sql);
        console.log('✅ Tables created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error);
    } finally {
        await client.end();
        console.log('✓ Disconnected from PostgreSQL');
    }
}

createTables();