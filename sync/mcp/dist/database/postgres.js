/**
 * PostgreSQL Database Client for Sync
 *
 * Provides connection management and query methods for the Sync Database.
 * Handles meters, meter_reading, and sync_log tables.
 */
import { Pool } from 'pg';
export class SyncDatabase {
    pool;
    constructor(config) {
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            max: config.max || 10,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
        });
        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }
    /**
     * Initialize database schema
     */
    async initialize() {
        try {
            console.log('\n🔧 [SQL] Initializing database schema...');
            // Create tenant table
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS tenant (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          url VARCHAR(255),
          street VARCHAR(255),
          street2 VARCHAR(255),
          city VARCHAR(100),
          state VARCHAR(50),
          zip VARCHAR(20),
          country VARCHAR(100),
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Create meter table
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS meter (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(100),
          serial_number VARCHAR(255),
          installation_date VARCHAR(50),
          device_id VARCHAR(255),
          location_id VARCHAR(255),
          ip VARCHAR(50),
          port VARCHAR(10),
          protocol VARCHAR(50),
          status VARCHAR(50),
          notes TEXT,
          active BOOLEAN DEFAULT true,
          created_at VARCHAR(50),
          updated_at VARCHAR(50)
        )
      `);
            // Create meter_reading table
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS meter_reading (
          id SERIAL PRIMARY KEY,
          meter_id VARCHAR(255) NOT NULL REFERENCES meter(id),
          timestamp TIMESTAMP NOT NULL,
          data_point VARCHAR(255),
          value NUMERIC,
          unit VARCHAR(50),
          is_synchronized BOOLEAN DEFAULT false,
          retry_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Create sync_log table
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id SERIAL PRIMARY KEY,
          batch_size INTEGER,
          success BOOLEAN,
          error_message TEXT,
          synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Create indexes
            await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_meter_reading_meter_id ON meter_reading(meter_id)`);
            await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_meter_reading_is_synchronized ON meter_reading(is_synchronized)`);
            await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at)`);
            console.log('✅ [SQL] Database schema initialized successfully');
        }
        catch (error) {
            console.error('❌ [SQL] Failed to initialize database schema:', error);
            throw error;
        }
    }
    /**
     * Test local database connectivity
     */
    async testConnectionLocal() {
        try {
            const query = 'SELECT NOW()';
            console.log('\n🔍 [SQL] Testing local database connection:', query);
            const result = await this.pool.query(query);
            console.log('✅ [SQL] Local database connection test successful, result:', result.rows[0]);
            return result.rows.length > 0;
        }
        catch (error) {
            console.error('❌ [SQL] Local database connection test failed:', error);
            return false;
        }
    }
    /**
     * Test remote database connectivity
     */
    async testConnectionRemote(remotePool) {
        try {
            const query = 'SELECT NOW()';
            console.log('\n🔍 [SQL] Testing remote database connection:', query);
            const result = await remotePool.query(query);
            console.log('✅ [SQL] Remote database connection test successful, result:', result.rows[0]);
            return result.rows.length > 0;
        }
        catch (error) {
            console.error('❌ [SQL] Remote database connection test failed:', error);
            return false;
        }
    }
    /**
     * Validate that the tenant table exists and contains valid data
     *
     * Returns:
     * - false if table doesn't exist
     * - false if table has zero records (sync database not set up yet)
     * - true if table has exactly one record (valid state)
     * - throws error if table has more than one record (database may be corrupted)
     */
    async validateTenantTable() {
        try {
            const query = 'SELECT * FROM tenant';
            console.log('\n🔍 [SQL] Validating tenant table:', query);
            const result = await this.pool.query(query);
            const rowCount = result.rows.length;
            console.log(`📋 [SQL] Tenant table query returned ${rowCount} row(s)`);
            if (rowCount === 0) {
                console.warn('⚠️  [SQL] Tenant table exists but has no records - sync database not set up yet');
                return null;
            }
            if (rowCount === 1) {
                console.log('✅ [SQL] Tenant table validation successful - found valid tenant record');
                return result.rows[0];
            }
            // More than one record - database may be corrupted
            console.error(`❌ [SQL] Tenant table contains ${rowCount} records - database may be corrupted`);
            throw new Error(`Database integrity error: Tenant table contains ${rowCount} records instead of 1. Please contact support.`);
        }
        catch (error) {
            // Check if error is due to table not existing
            if (error.message.includes('does not exist') || error.code === '42P01') {
                console.error('❌ [SQL] Tenant table does not exist in the database');
                return null;
            }
            // Re-throw other errors (including corruption errors)
            if (error.message.includes('Database integrity error')) {
                throw error;
            }
            console.error('❌ [SQL] Failed to validate tenant table:', error);
            return null;
        }
    }
    /**
     * Close all database connections
     */
    async close() {
        await this.pool.end();
    }
    // ==================== METER METHODS ====================
    /**
     * Get all meters
     */
    async getMeters(activeOnly = true) {
        const query = activeOnly
            ? 'SELECT * FROM meter WHERE active = true ORDER BY name'
            : 'SELECT * FROM meter ORDER BY name';
        console.log('\n🔍 [SQL] Querying meters:', query);
        const result = await this.pool.query(query);
        console.log(`📋 [SQL] Query returned ${result.rows.length} meter(s)`);
        return result.rows;
    }
    /**
    * Get meter by ID
    */
    async getMeterById(id) {
        const result = await this.pool.query('SELECT * FROM meter WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    /**
     * Create or update a meter
     */
    async upsertMeter(meter) {
        const meterId = meter?.id || 'UNKNOWN';
        try {
            console.log(`\n🔄 [SYNC SQL] Starting upsert for meter: ${meterId}`);
            console.log(`   Input data:`, JSON.stringify(meter, null, 2));
            // Validate required fields
            if (!meter) {
                throw new Error('Meter object is required');
            }
            if (!meter.id) {
                throw new Error('Meter ID is required for upsert');
            }
            if (!meter.name) {
                throw new Error('Meter name is required for upsert');
            }
            // Validate data types
            if (typeof meter.id !== 'string') {
                throw new Error(`Meter ID must be a string, got ${typeof meter.id}`);
            }
            if (typeof meter.name !== 'string') {
                throw new Error(`Meter name must be a string, got ${typeof meter.name}`);
            }
            // Trim and validate name length
            const trimmedName = meter.name.trim();
            if (trimmedName.length === 0) {
                throw new Error('Meter name cannot be empty or whitespace only');
            }
            if (trimmedName.length > 255) {
                throw new Error(`Meter name exceeds maximum length of 255 characters (got ${trimmedName.length})`);
            }
            // Prepare parameters with validation
            const params = [
                meter.id,
                trimmedName,
                meter.type || null,
                meter.serial_number || null,
                meter.installation_date || null,
                meter.device_id || null,
                meter.location_id || null,
                meter.ip || null,
                meter.port || null,
                meter.protocol || null,
                meter.status || null,
                meter.notes || null,
                meter.active !== undefined ? meter.active : true,
                meter.created_at || new Date().toISOString(),
                meter.updated_at || new Date().toISOString(),
            ];
            console.log(`   ✓ All validations passed`);
            console.log(`   Executing INSERT/UPDATE query...`);
            const result = await this.pool.query(`INSERT INTO meter (id, name, type, serial_number, installation_date, device_id, location_id, 
                            ip, port, protocol, status,notes, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 
                $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) 
         DO UPDATE SET
           name = EXCLUDED.name,
           type = EXCLUDED.type,
           serial_number = EXCLUDED.serial_number,
           installation_date = EXCLUDED.installation_date,
           device_id = EXCLUDED.device_id,
           location_id = EXCLUDED.location_id,
           ip = EXCLUDED.ip,
           port = EXCLUDED.port,
           protocol = EXCLUDED.protocol,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           active = EXCLUDED.active,
           updated_at = EXCLUDED.updated_at
         RETURNING *`, params);
            // Validate query result
            if (!result) {
                throw new Error('Query result is null or undefined');
            }
            if (!result.rows) {
                throw new Error('Query result has no rows property');
            }
            if (result.rows.length === 0) {
                throw new Error(`Upsert failed: No rows returned for meter ${meterId}`);
            }
            const upsertedMeter = result.rows[0];
            // Validate returned meter
            if (!upsertedMeter.id) {
                throw new Error('Returned meter has no ID');
            }
            console.log(`✅ [SYNC SQL] Successfully upserted meter: ${meterId}`);
            console.log(`   Returned data:`, JSON.stringify(upsertedMeter, null, 2));
            return upsertedMeter;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';
            console.error(`\n❌ [SYNC SQL] FAILED to upsert meter: ${meterId}`);
            console.error(`   Error Message: ${errorMessage}`);
            if (errorStack) {
                console.error(`   Stack Trace:\n${errorStack}`);
            }
            console.error(`   Meter Data:`, JSON.stringify(meter, null, 2));
            // Re-throw with enhanced error message
            throw new Error(`Failed to upsert meter ${meterId}: ${errorMessage}`);
        }
    }
    /**
     * Update meter last reading timestamp
     */
    async updateMeterLastReading(externalId, timestamp) {
        await this.pool.query('UPDATE meter SET last_reading_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [timestamp, externalId]);
    }
    /**
     * Deactivate a meter
     */
    async deactivateMeter(externalId) {
        await this.pool.query('UPDATE meter SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [externalId]);
    }
    // ==================== METER READING METHODS ====================
    /**
     * Insert a single meter reading
     */
    async insertReading(reading) {
        const result = await this.pool.query(`INSERT INTO meter_reading(meter_id, timestamp, data_point, value, unit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [
            reading.meter_external_id,
            reading.timestamp,
            reading.data_point,
            reading.value,
            reading.unit,
        ]);
        return result.rows[0];
    }
    /**
     * Batch insert meter readings
     */
    async batchInsertReadings(readings) {
        if (readings.length === 0) {
            return 0;
        }
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            let insertedCount = 0;
            // for (const reading of readings) {
            //   await client.query(
            //     `INSERT INTO meter_reading (meter_external_id, timestamp, data_point, value, unit)
            //      VALUES ($1, $2, $3, $4, $5)`,
            //     [
            //       reading.meter_external_id,
            //       reading.timestamp,
            //       reading.data_point,
            //       reading.value,
            //       reading.unit,
            //     ]
            //   );
            //   insertedCount++;
            // }
            await client.query('COMMIT');
            return insertedCount;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get unsynchronized readings for sync
     */
    async getUnsynchronizedReadings(limit = 1000) {
        const result = await this.pool.query(`SELECT * FROM meter_reading
       WHERE is_synchronized = false 
       ORDER BY created_at ASC 
       LIMIT $1`, [limit]);
        return result.rows;
    }
    /**
     * Get readings by meter and time range
     */
    async getReadingsByMeterAndTimeRange(meterExternalId, startTime, endTime) {
        const result = await this.pool.query(`SELECT * FROM meter_reading
       WHERE meter_external_id = $1 
         AND timestamp >= $2 
         AND timestamp <= $3 
       ORDER BY timestamp ASC`, [meterExternalId, startTime, endTime]);
        return result.rows;
    }
    /**
     * Get recent readings (last N hours)
     */
    async getRecentReadings(hours = 24) {
        const query = `SELECT * FROM meter_reading
       WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp DESC`;
        console.log('\n🔍 [SQL] Querying recent readings:', query);
        const result = await this.pool.query(query, []);
        console.log(`📋 [SQL] Query returned ${result.rows.length} reading(s)`);
        return result.rows;
    }
    /**
     * Mark readings as synchronized
     */
    async markReadingsAsSynchronized(readingIds) {
        if (readingIds.length === 0) {
            return 0;
        }
        const result = await this.pool.query(`UPDATE meter_reading
       SET is_synchronized = true 
       WHERE id = ANY($1::int[])`, [readingIds]);
        return result.rowCount || 0;
    }
    /**
     * Delete synchronized readings
     */
    async deleteSynchronizedReadings(readingIds) {
        if (readingIds.length === 0) {
            return 0;
        }
        const result = await this.pool.query(`DELETE FROM meter_reading
       WHERE id = ANY($1::int[]) AND is_synchronized = true`, [readingIds]);
        return result.rowCount || 0;
    }
    /**
     * Increment retry count for failed readings
     */
    async incrementRetryCount(readingIds) {
        if (readingIds.length === 0) {
            return 0;
        }
        const result = await this.pool.query(`UPDATE meter_reading
       SET retry_count = retry_count + 1 
       WHERE id = ANY($1::int[])`, [readingIds]);
        return result.rowCount || 0;
    }
    /**
     * Get count of unsynchronized readings
     */
    async getUnsynchronizedCount() {
        const query = 'SELECT COUNT(*) as count FROM meter_reading WHERE is_synchronized = false';
        console.log('\n🔍 [SQL] Counting unsynchronized readings:', query);
        const result = await this.pool.query(query);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`📋 [SQL] Unsynchronized readings count: ${count}`);
        return count;
    }
    /**
     * Delete old synchronized readings (cleanup)
     */
    async deleteOldSynchronizedReadings(daysOld = 7) {
        const result = await this.pool.query(`DELETE FROM meter_reading
       WHERE is_synchronized = true 
         AND created_at < NOW() - INTERVAL '${daysOld} days'`);
        return result.rowCount || 0;
    }
    // ==================== TENANT METHODS ====================
    /**
     * Get tenant information
     */
    async getTenant() {
        try {
            const query = 'SELECT * FROM tenant LIMIT 1';
            console.log('\n🔍 [SQL] Querying tenant:', query);
            const result = await this.pool.query(query);
            console.log(`📋 [SQL] Query returned ${result.rows.length} row(s)`);
            if (result.rows.length > 0) {
                console.log('📊 [SQL] Tenant data:', JSON.stringify(result.rows[0], null, 2));
            }
            const tenant = result.rows[0] || null;
            console.log(`✅ [SQL] Returning tenant:`, tenant);
            return tenant;
        }
        catch (error) {
            console.error('❌ [SQL] Error querying tenant:', error);
            throw error;
        }
    }
    /**
     * Synchronize tenant from remote database to local database
     *
     * Queries the remote database for a tenant record by ID and upserts it to the local database.
     * Preserves the original tenant ID from the remote database.
     *
     * @param remotePool - Connection pool to the remote database
     * @param tenantId - The ID of the tenant to synchronize
     * @returns The synchronized tenant record
     * @throws Error if the remote database query fails or tenant is not found
     */
    async syncTenantFromRemote(remotePool, tenantId) {
        try {
            // Query remote database for tenant record
            console.log(`\n🔍 [SYNC] Querying remote database for tenant ID: ${tenantId}`);
            const remoteQuery = 'SELECT * FROM tenant WHERE id = $1';
            const remoteResult = await remotePool.query(remoteQuery, [tenantId]);
            if (remoteResult.rows.length === 0) {
                throw new Error(`Tenant with ID ${tenantId} not found in remote database`);
            }
            const remoteTenant = remoteResult.rows[0];
            console.log(`✅ [SYNC] Found tenant in remote database:`, JSON.stringify(remoteTenant, null, 2));
            // Upsert to local database, preserving the original tenant ID
            console.log(`\n📝 [SYNC] Upserting tenant to local database with ID: ${remoteTenant.id}`);
            // We need to handle the ID preservation specially since upsertTenant doesn't take an ID parameter
            // We'll use a direct query to preserve the ID
            const existing = await this.getTenant();
            let localTenant;
            if (existing) {
                // Update existing tenant, preserving the ID from remote
                const updateQuery = `UPDATE tenant 
          SET name = $1, 
              url = $2, 
              street = $3, 
              street2 = $4, 
              city = $5, 
              state = $6, 
              zip = $7, 
              country = $8, 
              active = $9,
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = $10 
          RETURNING *`;
                try {
                    const updateResult = await this.pool.query(updateQuery, [
                        remoteTenant.name,
                        remoteTenant.url || null,
                        remoteTenant.street || null,
                        remoteTenant.street2 || null,
                        remoteTenant.city || null,
                        remoteTenant.state || null,
                        remoteTenant.zip || null,
                        remoteTenant.country || null,
                        remoteTenant.active !== undefined ? remoteTenant.active : true,
                        existing.id
                    ]);
                    localTenant = updateResult.rows[0];
                }
                catch (error) {
                    // If some columns don't exist, update with available fields
                    if (error.message.includes('does not exist')) {
                        console.warn('⚠️ [SYNC] Some columns do not exist, updating with available fields');
                        const basicUpdateQuery = `UPDATE tenant 
              SET name = $1, 
                  updated_at = CURRENT_TIMESTAMP 
              WHERE id = $2 
              RETURNING *`;
                        const basicUpdateResult = await this.pool.query(basicUpdateQuery, [
                            remoteTenant.name,
                            existing.id
                        ]);
                        localTenant = basicUpdateResult.rows[0];
                    }
                    else {
                        throw error;
                    }
                }
            }
            else {
                // Insert new tenant with the remote ID
                const insertQuery = `INSERT INTO tenant (id, name, url, street, street2, city, state, zip, country, active) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
          RETURNING *`;
                try {
                    const insertResult = await this.pool.query(insertQuery, [
                        remoteTenant.id,
                        remoteTenant.name,
                        remoteTenant.url || null,
                        remoteTenant.street || null,
                        remoteTenant.street2 || null,
                        remoteTenant.city || null,
                        remoteTenant.state || null,
                        remoteTenant.zip || null,
                        remoteTenant.country || null,
                        remoteTenant.active !== undefined ? remoteTenant.active : true
                    ]);
                    localTenant = insertResult.rows[0];
                }
                catch (error) {
                    // If columns don't exist, insert with basic fields only
                    if (error.message.includes('does not exist')) {
                        console.warn('⚠️ [SYNC] Some columns do not exist, inserting with basic fields only');
                        const basicInsertQuery = `INSERT INTO tenant (name) VALUES ($1) RETURNING *`;
                        const basicInsertResult = await this.pool.query(basicInsertQuery, [remoteTenant.name]);
                        localTenant = basicInsertResult.rows[0];
                    }
                    else {
                        throw error;
                    }
                }
            }
            console.log(`✅ [SYNC] Successfully synchronized tenant to local database:`, JSON.stringify(localTenant, null, 2));
            return localTenant;
        }
        catch (error) {
            console.error(`❌ [SYNC] Error synchronizing tenant from remote:`, error);
            throw error;
        }
    }
    /**
     * Create or update tenant information
     */
    async upsertTenant(tenant) {
        // Since there should only be one tenant, we'll update if exists, insert if not
        const existing = await this.getTenant();
        if (existing) {
            // Build dynamic UPDATE query based on available columns
            const updates = ['name = $1', 'updated_at = CURRENT_TIMESTAMP'];
            const values = [tenant.name];
            let paramIndex = 2;
            // Try to update all fields, but handle missing columns gracefully
            const fieldsToUpdate = [
                { name: 'tenant_id', value: tenant.id },
                { name: 'url', value: tenant.url },
                { name: 'street', value: tenant.street },
                { name: 'street2', value: tenant.street2 },
                { name: 'city', value: tenant.city },
                { name: 'state', value: tenant.state },
                { name: 'zip', value: tenant.zip },
                { name: 'country', value: tenant.country },
                { name: 'active', value: tenant.active !== undefined ? tenant.active : true },
            ];
            for (const field of fieldsToUpdate) {
                updates.push(`${field.name} = $${paramIndex}`);
                values.push(field.value || null);
                paramIndex++;
            }
            values.push(existing.id);
            const query = `UPDATE tenant SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            try {
                const result = await this.pool.query(query, values);
                return result.rows[0];
            }
            catch (error) {
                // If column doesn't exist, try without it
                if (error.message.includes('does not exist')) {
                    console.warn('⚠️ [SQL] Some columns do not exist, updating with basic fields only');
                    const basicQuery = `UPDATE tenant SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
                    const result = await this.pool.query(basicQuery, [tenant.name, existing.id]);
                    return result.rows[0];
                }
                throw error;
            }
        }
        else {
            // Try to insert with all columns first
            try {
                const result = await this.pool.query(`INSERT INTO tenant (id, name, url, street, street2, city, state, zip, country, active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
           RETURNING *`, [
                    tenant.id,
                    tenant.name,
                    tenant.url || null,
                    tenant.street || null,
                    tenant.street2 || null,
                    tenant.city || null,
                    tenant.state || null,
                    tenant.zip || null,
                    tenant.country || null,
                    tenant.active !== undefined ? tenant.active : true
                ]);
                return result.rows[0];
            }
            catch (error) {
                // If columns don't exist, insert with basic fields only
                if (error.message.includes('does not exist')) {
                    console.warn('⚠️ [SQL] Some columns do not exist, inserting with basic fields only');
                    const result = await this.pool.query(`INSERT INTO tenant (name) VALUES ($1) RETURNING *`, [tenant.name]);
                    return result.rows[0];
                }
                throw error;
            }
        }
    }
    // ==================== SYNC LOG METHODS ====================
    /**
     * Log a sync operation
     */
    async logSyncOperation(batchSize, success, errorMessage) {
        const result = await this.pool.query(`INSERT INTO sync_log (batch_size, success, error_message)
       VALUES ($1, $2, $3)
       RETURNING *`, [batchSize, success, errorMessage || null]);
        return result.rows[0];
    }
    /**
     * Get recent sync logs
     */
    async getRecentSyncLogs(limit = 100) {
        const query = `SELECT * FROM sync_log 
       ORDER BY synced_at DESC 
       LIMIT $1`;
        console.log('\n🔍 [SQL] Querying recent sync logs:', query, `[limit: ${limit}]`);
        const result = await this.pool.query(query, [limit]);
        console.log(`📋 [SQL] Query returned ${result.rows.length} log(s)`);
        return result.rows;
    }
    /**
     * Get sync statistics
     */
    async getSyncStats(hours = 24) {
        const result = await this.pool.query(`SELECT 
         COUNT(*) as total_syncs,
         SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_syncs,
         SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed_syncs,
         SUM(CASE WHEN success = true THEN batch_size ELSE 0 END) as total_readings_synced
       FROM sync_log 
       WHERE synced_at >= NOW() - INTERVAL '${hours} hours'`);
        const row = result.rows[0];
        const totalSyncs = parseInt(row.total_syncs, 10);
        const successfulSyncs = parseInt(row.successful_syncs, 10);
        const failedSyncs = parseInt(row.failed_syncs, 10);
        const totalReadingsSynced = parseInt(row.total_readings_synced, 10);
        const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;
        return {
            total_syncs: totalSyncs,
            successful_syncs: successfulSyncs,
            failed_syncs: failedSyncs,
            total_readings_synced: totalReadingsSynced,
            success_rate: Math.round(successRate * 100) / 100,
        };
    }
    /**
     * Delete old sync logs (cleanup)
     */
    async deleteOldSyncLogs(daysOld = 30) {
        const result = await this.pool.query(`DELETE FROM sync_log 
       WHERE synced_at < NOW() - INTERVAL '${daysOld} days'`);
        return result.rowCount || 0;
    }
    // ==================== UTILITY METHODS ====================
    /**
     * Execute a raw query (for advanced use cases)
     */
    async query(text, params) {
        return this.pool.query(text, params);
    }
    /**
     * Get a client from the pool for transactions
     */
    async getClient() {
        return this.pool.connect();
    }
}
/**
 * Create a database instance from environment variables
 */
export function createDatabaseFromEnv() {
    const config = {
        host: process.env.POSTGRES_SYNC_HOST || process.env.POSTGRES_CLIENT_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_SYNC_PORT || process.env.POSTGRES_CLIENT_PORT || '5432', 10),
        database: process.env.POSTGRES_SYNC_DB || process.env.POSTGRES_CLIENT_DB || 'postgres',
        user: process.env.POSTGRES_SYNC_USER || process.env.POSTGRES_CLIENT_USER || 'postgres',
        password: process.env.POSTGRES_SYNC_PASSWORD || process.env.POSTGRES_CLIENT_PASSWORD || '',
    };
    console.log('\n📊 [Database Config] Loading PostgreSQL configuration:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${config.password ? '***' : '(empty)'}`);
    console.log(`   Connection String: postgresql://${config.user}@${config.host}:${config.port}/${config.database}\n`);
    return new SyncDatabase(config);
}
//# sourceMappingURL=postgres.js.map