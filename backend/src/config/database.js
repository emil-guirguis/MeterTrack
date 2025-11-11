/**
 * PostgreSQL Database Connection Module
 * Replaces MongoDB/Mongoose for the facility management system
 */

const { Pool } = require('pg');
require('dotenv').config();

class PostgresDB {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    /**
     * Initialize PostgreSQL connection pool
     */
    async connect() {
        try {
            console.log('=== DATABASE CONNECTION CONFIG ===');
            console.log('Host:', process.env.POSTGRES_HOST);
            console.log('Port:', process.env.POSTGRES_PORT);
            console.log('Database:', process.env.POSTGRES_DB);
            console.log('User:', process.env.POSTGRES_USER);
            console.log('Password length:', process.env.POSTGRES_PASSWORD?.length);
            console.log('==================================');
            
            this.pool = new Pool({
                host: process.env.POSTGRES_HOST,
                port: process.env.POSTGRES_PORT,
                database: process.env.POSTGRES_DB,
                user: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASSWORD,
                ssl: { rejectUnauthorized: false },
                max: 20, // Maximum number of clients in the pool
                idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
                connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
            });

            // Test the connection
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            console.log(`✅ Connected to PostgreSQL -> db: ${process.env.POSTGRES_DB} host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
            console.log(`Database connection established at: ${result.rows[0].now}`);
            
            return this.pool;
        } catch (error) {
            console.error('❌ PostgreSQL connection error:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Get a client from the connection pool
     */
    async getClient() {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return await this.pool.connect();
    }

    /**
     * Execute a query with parameters
     */
    async query(text, params = []) {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const client = await this.pool.connect();
        try {
            console.log('=== SQL QUERY ===');
            console.log('Query:', text);
            console.log('Params:', params);
            console.log('=================');
            const result = await client.query(text, params);
            console.log('Result rows:', result.rows.length);
            return result;
        } catch (error) {
            console.error('=== SQL ERROR ===');
            console.error('Query:', text);
            console.error('Params:', params);
            console.error('Error:', error.message);
            console.error('=================');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Execute a transaction
     */
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Close all connections
     */
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            console.log('✅ PostgreSQL connections closed');
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            totalCount: this.pool?.totalCount || 0,
            idleCount: this.pool?.idleCount || 0,
            waitingCount: this.pool?.waitingCount || 0
        };
    }

    /**
     * Health check for the database
     */
    async healthCheck() {
        try {
            const result = await this.query('SELECT 1 as health_check');
            return {
                status: 'healthy',
                connected: this.isConnected,
                timestamp: new Date().toISOString(),
                response_time: 'fast'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Create a singleton instance
const db = new PostgresDB();

module.exports = db;