/**
 * Simple PostgreSQL connection test
 */

const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
    const client = new Client({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔗 Testing PostgreSQL connection...');
        console.log(`Host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
        console.log(`Database: ${process.env.POSTGRES_DB}`);
        console.log(`User: ${process.env.POSTGRES_USER}`);
        
        await client.connect();
        console.log('✅ Connected to PostgreSQL successfully!');
        
        // Test if our tables exist
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('\n📋 Available tables:');
        tables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Test if we have data
        console.log('\n📊 Data check:');
        
        try {
            const userCount = await client.query('SELECT COUNT(*) as count FROM users');
            console.log(`  Users: ${userCount.rows[0].count}`);
        } catch (err) {
            console.log(`  Users table: Error - ${err.message}`);
        }
        
        try {
            const buildingCount = await client.query('SELECT COUNT(*) as count FROM buildings');
            console.log(`  Buildings: ${buildingCount.rows[0].count}`);
        } catch (err) {
            console.log(`  Buildings table: Error - ${err.message}`);
        }
        
        try {
            const meterCount = await client.query('SELECT COUNT(*) as count FROM meters');
            console.log(`  Meters: ${meterCount.rows[0].count}`);
        } catch (err) {
            console.log(`  Meters table: Error - ${err.message}`);
        }
        
        // Test a simple user query
        try {
            const sampleUser = await client.query('SELECT email, name, role FROM users LIMIT 1');
            if (sampleUser.rows.length > 0) {
                console.log('\n👤 Sample user:');
                console.log(`  Email: ${sampleUser.rows[0].email}`);
                console.log(`  Name: ${sampleUser.rows[0].name}`);
                console.log(`  Role: ${sampleUser.rows[0].role}`);
            }
        } catch (err) {
            console.log(`  Sample user query: Error - ${err.message}`);
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Connection details:');
        console.error(`  Host: ${process.env.POSTGRES_HOST}`);
        console.error(`  Port: ${process.env.POSTGRES_PORT}`);
        console.error(`  Database: ${process.env.POSTGRES_DB}`);
        console.error(`  User: ${process.env.POSTGRES_USER}`);
    } finally {
        await client.end();
        console.log('\n🔌 Connection closed');
    }
}

testConnection();