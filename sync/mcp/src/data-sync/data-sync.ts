/**
 * PostgreSQL Database Client for Sync
 * 
 * Provides connection management and query methods for the Sync Database.
 * Handles meters, meter_reading, and sync_log tables.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { TenantEntity, MeterEntity, MeterReadingEntity, SyncLog } from '../types/entities.js';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// ==================== PUBLIC POOL OBJECTS ====================

/**
 * Public pool for the sync database
 * Use this to execute queries against the local sync database
 */
export let syncPool: Pool;

/**
 * Public pool for the remote database
 * Use this to execute queries against the remote client database
 */
export let remotePool: Pool;

/**
 * Initialize both database pools from environment variables
 */
export function initializePools(): void {
  // Initialize sync database pool
  const syncConfig: DatabaseConfig = {
    host: process.env.POSTGRES_SYNC_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
    database: process.env.POSTGRES_SYNC_DB || 'postgres',
    user: process.env.POSTGRES_SYNC_USER || 'postgres',
    password: process.env.POSTGRES_SYNC_PASSWORD || '',
  };

  syncPool = new Pool({
    host: syncConfig.host,
    port: syncConfig.port,
    database: syncConfig.database,
    user: syncConfig.user,
    password: syncConfig.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  } as any);

  syncPool.on('error', (err) => {
    console.error('Unexpected error on sync database idle client', err);
  });

  console.log('\n📊 [Database Config] Sync Pool initialized:');
  console.log(`   Host: ${syncConfig.host}`);
  console.log(`   Port: ${syncConfig.port}`);
  console.log(`   Database: ${syncConfig.database}`);
  console.log(`   User: ${syncConfig.user}\n`);

  // Initialize remote database pool
  const remoteConfig: DatabaseConfig = {
    host: process.env.POSTGRES_CLIENT_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
    database: process.env.POSTGRES_CLIENT_DB || 'postgres',
    user: process.env.POSTGRES_CLIENT_USER || 'postgres',
    password: process.env.POSTGRES_CLIENT_PASSWORD || '',
  };

  remotePool = new Pool({
    host: remoteConfig.host,
    port: remoteConfig.port,
    database: remoteConfig.database,
    user: remoteConfig.user,
    password: remoteConfig.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  } as any);

  remotePool.on('error', (err) => {
    console.error('Unexpected error on remote database idle client', err);
  });

  console.log('\n📊 [Database Config] Remote Pool initialized:');
  console.log(`   Host: ${remoteConfig.host}`);
  console.log(`   Port: ${remoteConfig.port}`);
  console.log(`   Database: ${remoteConfig.database}`);
  console.log(`   User: ${remoteConfig.user}\n`);
}

/**
 * Close both database pools
 */
export async function closePools(): Promise<void> {
  if (syncPool) {
    await syncPool.end();
    console.log('✅ Sync pool closed');
  }
  if (remotePool) {
    await remotePool.end();
    console.log('✅ Remote pool closed');
  }
}

export class SyncDatabase {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max || 10,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    } as any);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    try {
      console.log('\n🔧 [SQL] Initializing database schema...');

      // Create tenant table
      let sql = `CREATE TABLE IF NOT EXISTS tenant (
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
        )`;
      await this.pool.query(sql);
      console.log(`\n🔧 [SQL] ${sql}`);

      // Create meter table
      sql = `
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
        )`;
      console.log(`\n🔧 [SQL] ${sql}`);
      await this.pool.query(sql);

      // Create meter_reading table
      sql = `
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
        )`;
      console.log(`\n🔧 [SQL] ${sql}`);
      await this.pool.query(sql);        

      // Create sync_log table
      sql = `
        CREATE TABLE IF NOT EXISTS sync_log (
          id SERIAL PRIMARY KEY,
          batch_size INTEGER,
          success BOOLEAN,
          error_message TEXT,
          synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log(`\n🔧 [SQL] ${sql}`);
      await this.pool.query(sql);
      // Create indexes
      await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_meter_reading_meter_id ON meter_reading(meter_id)`);
      await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_meter_reading_is_synchronized ON meter_reading(is_synchronized)`);
      await this.pool.query(`CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at)`);

      console.log('✅ [SQL] Database schema initialized successfully');
    } catch (error) {
      console.error('❌ [SQL] Failed to initialize database schema:', error);
      throw error;
    }
  }

  /**
   * Test local database connectivity
   */
  async testConnectionLocal(): Promise<boolean> {
    try {
      const query = 'SELECT NOW()';
      console.log('\n🔍 [SQL] Testing local database connection:', query);
      const result = await this.pool.query(query);
      console.log('✅ [SQL] Local database connection test successful, result:', result.rows[0]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ [SQL] Local database connection test failed:', error);
      return false;
    }
  }

  /**
   * Test remote database connectivity
   */
  async testConnectionRemote(remotePool: Pool): Promise<boolean> {
    try {
      const query = 'SELECT NOW()';
      console.log('\n🔍 [SQL] Testing remote database connection:', query);
      const result = await remotePool.query(query);
      console.log('✅ [SQL] Remote database connection test successful, result:', result.rows[0]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ [SQL] Remote database connection test failed:', error);
      return false;
    }
  }
  /**
   * Delete a meter from the database
   */
  async deleteSyncMeter(meterId: number, meterElementId?: number): Promise<void> {
    if (meterElementId) {
      await this.pool.query('DELETE FROM meter WHERE id = $1 AND meter_element_id = $2', [meterId, meterElementId]);
    } else {
      await this.pool.query('DELETE FROM meter WHERE id = $1', [meterId]);
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
  async validateTenantTable(): Promise<TenantEntity | null> {
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
    } catch (error: any) {
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
  async close(): Promise<void> {
    await this.pool.end();
  }

  // ==================== METER METHODS ====================



  /**
  * Get meter by ID
  */
  async getMeterById(id: number): Promise<MeterEntity | null> {
    const result = await this.pool.query('SELECT * FROM meter WHERE id = $1', [id] );
    return result.rows[0] || null;
  }


  /**
   * Update meter last reading timestamp
   */
  async updateMeterLastReading(externalId: string, timestamp: Date): Promise<void> {
    await this.pool.query(
      'UPDATE meter SET last_reading_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [timestamp, externalId]
    );
  }

  // ==================== METER READING METHODS ====================

  /**
   * Insert a single meter reading
   */
  async insertReading(reading: {
    meter_external_id: string;
    timestamp: Date;
    data_point: string;
    value: number;
    unit?: string;
  }): Promise<MeterReadingEntity> {
    const result = await this.pool.query(
      `INSERT INTO meter_reading(meter_id, timestamp, data_point, value, unit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        reading.meter_external_id,
        reading.timestamp,
        reading.data_point,
        reading.value,
        reading.unit,
      ]
    );
    return result.rows[0];
  }

  /**
   * Batch insert meter readings
   */
  async batchInsertReadings(readings: Array<Omit<MeterReadingEntity, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
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
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


  /**
   * Get recent readings (last N hours)
   */
  async getRecentReadings(hours: number = 24): Promise<MeterReadingEntity[]> {
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
  async markReadingsAsSynchronized(readingIds: number[]): Promise<number> {
    if (readingIds.length === 0) {
      return 0;
    }

    const result = await this.pool.query(
      `UPDATE meter_reading
       SET is_synchronized = true 
       WHERE id = ANY($1::int[])`,
      [readingIds]
    );
    return result.rowCount || 0;
  }



  /**
   * Delete old synchronized readings (cleanup)
   */
  async deleteOldSynchronizedReadings(daysOld: number = 7): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM meter_reading
       WHERE is_synchronized = true 
         AND created_at < NOW() - INTERVAL '${daysOld} days'`
    );
    return result.rowCount || 0;
  }

  // ==================== TENANT METHODS ====================

  /**
   * Get tenant information
   */
  async getTenant(): Promise<TenantEntity | null> {
    try {
      const query = 'SELECT id AS tenant_id, * FROM tenant';
      console.log('\n🔍 [SQL] Querying tenant:', query);
      const result = await this.pool.query(query);
      console.log(`📋 [SQL] Query returned ${result.rows.length} row(s)`);
      if (result.rows.length > 0) {
        console.log('📊 [SQL] Tenant data:', JSON.stringify(result.rows[0], null, 2));
      }
      const tenant = result.rows[0] || null;
      console.log(`✅ [SQL] Returning tenant:`, tenant);
      return tenant;
    } catch (error) {
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
  async syncTenantFromRemote(remotePool: Pool, tenantId: number): Promise<TenantEntity> {
    try {
      // Query remote database for tenant record
      console.log(`\n🔍 [SYNC] Querying remote database for tenant ID: ${tenantId}`);
      const remoteQuery = 'SELECT * FROM tenant WHERE id = $1';
      const remoteResult = await remotePool.query(remoteQuery, [tenantId]);

      if (remoteResult.rows.length === 0) {
        throw new Error(`Tenant with ID ${tenantId} not found in remote database`);
      }

      const remoteRow = remoteResult.rows[0];
      console.log(`✅ [SYNC] Found tenant in remote database:`, JSON.stringify(remoteRow, null, 2));

      // Map remote row to TenantEntity
      const remoteTenant: TenantEntity = {
        tenant_id: remoteRow.id || remoteRow.tenant_id,
        name: remoteRow.name,
        url: remoteRow.url,
        street: remoteRow.street,
        street2: remoteRow.street2,
        city: remoteRow.city,
        state: remoteRow.state,
        zip: remoteRow.zip,
        country: remoteRow.country,
      };

      // Upsert to local database, preserving the original tenant ID
      console.log(`\n📝 [SYNC] Upserting tenant to local database with ID: ${remoteTenant.tenant_id}`);

      const existing = await this.getTenant();

      let localTenant: TenantEntity;

      if (existing) {
        // Update existing tenant, preserving the ID from remote
        const sql = `UPDATE tenant 
          SET name = $1, 
              url = $2, 
              street = $3, 
              street2 = $4, 
              city = $5, 
              state = $6, 
              zip = $7, 
              country = $8,
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = $9 
          RETURNING *`;

        try {
          const updateResult = await this.pool.query(sql, [
            remoteTenant.name,
            remoteTenant.url || null,
            remoteTenant.street || null,
            remoteTenant.street2 || null,
            remoteTenant.city || null,
            remoteTenant.state || null,
            remoteTenant.zip || null,
            remoteTenant.country || null,
            existing.tenant_id
          ]);
          localTenant = updateResult.rows[0];
        } catch (error: any) {
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
              existing.tenant_id
            ]);
            localTenant = basicUpdateResult.rows[0];
          } else {
            throw error;
          }
        }
      } else {
        // Insert new tenant with the remote ID
        const insertQuery = `INSERT INTO tenant (id, name, url, street, street2, city, state, zip, country) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *`;

        try {
          const insertResult = await this.pool.query(insertQuery, [
            remoteTenant.tenant_id,
            remoteTenant.name,
            remoteTenant.url || null,
            remoteTenant.street || null,
            remoteTenant.street2 || null,
            remoteTenant.city || null,
            remoteTenant.state || null,
            remoteTenant.zip || null,
            remoteTenant.country || null
          ]);
          localTenant = insertResult.rows[0];
        } catch (error: any) {
          // If columns don't exist, insert with basic fields only
          if (error.message.includes('does not exist')) {
            console.warn('⚠️ [SYNC] Some columns do not exist, inserting with basic fields only');
            const basicInsertQuery = `INSERT INTO tenant (name) VALUES ($1) RETURNING *`;
            const basicInsertResult = await this.pool.query(basicInsertQuery, [remoteTenant.name]);
            localTenant = basicInsertResult.rows[0];
          } else {
            throw error;
          }
        }
      }

      console.log(`✅ [SYNC] Successfully synchronized tenant to local database:`, JSON.stringify(localTenant, null, 2));
      return localTenant;
    } catch (error) {
      console.error(`❌ [SYNC] Error synchronizing tenant from remote:`, error);
      throw error;
    }
  }

  // ==================== SYNC LOG METHODS ====================


    /**
   * Delete old sync logs (cleanup)
   */
  async deleteOldSyncLogs(daysOld: number = 30): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM sync_log 
       WHERE synced_at < NOW() - INTERVAL '${daysOld} days'`
    );
    return result.rowCount || 0;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Execute a raw query (for advanced use cases)
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    return this.pool.query(text, params);
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  // ==================== INTERFACE IMPLEMENTATION METHODS ====================

  /**
   * Get all meters (implements SyncDatabase interface)
   */
  async getMeters(activeOnly: boolean = true): Promise<MeterEntity[]> {
    const query = activeOnly
      ? 'SELECT id AS meter_id, name, active, ip, port, meter_element_id, element FROM meter WHERE active = true ORDER BY name'
      : 'SELECT id AS meter_id, name, active, ip, port, meter_element_id, element FROM meter ORDER BY name';
    console.log('\n🔍 [SQL] Querying meters:', query);
    const result = await this.pool.query(query);
    console.log(`📋 [SQL] Query returned ${result.rows.length} meter(s)`);
    return result.rows;
  }

  /**
   * Create or update a meter (implements SyncDatabase interface)
   */
  async upsertMeter(meter: MeterEntity): Promise<void> {
    const meterId = meter?.meter_id || 'UNKNOWN';
    try {
      console.log(`\n🔄 [SYNC SQL] Starting upsert for meter: ${meterId}`);
      console.log(`   Input data:`, JSON.stringify(meter, null, 2));

      // Validate required fields
      if (!meter) {
        throw new Error('Meter object is required');
      }
      if (!meter.meter_id) {
        throw new Error('Meter ID is required for upsert');
      }

      // Prepare parameters
      const params = [
        meter.meter_id,
        meter.device_id,
        meter.name,
        meter.active !== undefined ? meter.active : true,
        meter.ip || null,
        meter.port || null,
        meter.meter_element_id || null,
        meter.element || null,
      ];

      console.log(`   ✓ All validations passed`);
      console.log(`   Executing INSERT/UPDATE query...`);

      const sql = `INSERT INTO meter (id, device_id,name, active, ip, port, meter_element_id, element)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id, meter_element_id) DO UPDATE SET
           device_id = EXCLUDED.device_id,
           name = EXCLUDED.name,
           active = EXCLUDED.active,
           ip = EXCLUDED.ip,
           port = EXCLUDED.port,
           element = EXCLUDED.element
         RETURNING *`;
         console.log(`[SYNC SQL]  ${sql}`);
         console.log(`   Parameters:`, JSON.stringify(params, null, 2));
      const result = await this.pool.query(sql,params );

      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error(`Upsert failed: No rows returned for meter ${meterId}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ [SYNC SQL] FAILED to upsert meter: ${meterId}`);
      console.error(`   Error Message: ${errorMessage}`);
      throw new Error(`Failed to upsert meter ${meterId}: ${errorMessage}`);
    }
  }

  /**
   * Log a sync operation (implements SyncDatabase interface)
   */
  async logSyncOperation(
    batchSize: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO sync_log (batch_size, success, error_message)
         VALUES ($1, $2, $3)`,
        [batchSize, success, errorMessage || null]
      );
      console.log(`✅ [SQL] Logged sync operation: ${batchSize} items, success=${success}`);
    } catch (error) {
      console.error('❌ [SQL] Failed to log sync operation:', error);
      throw error;
    }
  }

  /**
   * Get unsynchronized readings for sync (implements SyncDatabase interface)
   */
  async getUnsynchronizedReadings(limit: number = 1000): Promise<MeterReadingEntity[]> {
    try {
      const query = `SELECT * FROM meter_reading
         WHERE is_synchronized = false
         ORDER BY created_at ASC
         LIMIT $1`;
      console.log('\n🔍 [SQL] Querying unsynchronized readings:', query, `[limit: ${limit}]`);
      const result = await this.pool.query(query, [limit]);
      console.log(`📋 [SQL] Query returned ${result.rows.length} reading(s)`);
      return result.rows;
    } catch (error) {
      console.error('❌ [SQL] Failed to get unsynchronized readings:', error);
      throw error;
    }
  }

  /**
   * Delete synchronized readings (implements SyncDatabase interface)
   */
  async deleteSynchronizedReadings(readingIds: number[]): Promise<number> {
    if (readingIds.length === 0) {
      return 0;
    }

    try {
      const result = await this.pool.query(
        `DELETE FROM meter_reading
         WHERE id = ANY($1::int[]) AND is_synchronized = true`,
        [readingIds]
      );
      const deletedCount = result.rowCount || 0;
      console.log(`✅ [SQL] Deleted ${deletedCount} synchronized reading(s)`);
      return deletedCount;
    } catch (error) {
      console.error('❌ [SQL] Failed to delete synchronized readings:', error);
      throw error;
    }
  }

  /**
   * Increment retry count for failed readings (implements SyncDatabase interface)
   */
  async incrementRetryCount(readingIds: number[]): Promise<void> {
    if (readingIds.length === 0) {
      return;
    }

    try {
      await this.pool.query(
        `UPDATE meter_reading
         SET retry_count = retry_count + 1
         WHERE id = ANY($1::int[])`,
        [readingIds]
      );
      console.log(`✅ [SQL] Incremented retry count for ${readingIds.length} reading(s)`);
    } catch (error) {
      console.error('❌ [SQL] Failed to increment retry count:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics (implements SyncDatabase interface)
   */
  async getSyncStats(hours: number = 24): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT 
           COUNT(*) as total_syncs,
           SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_syncs,
           SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed_syncs,
           SUM(CASE WHEN success = true THEN batch_size ELSE 0 END) as total_readings_synced,
           MAX(synced_at) as last_sync_time
         FROM sync_log
         WHERE synced_at >= NOW() - INTERVAL '${hours} hours'`
      );

      const row = result.rows[0];
      const totalSyncs = parseInt(row.total_syncs, 10);
      const successfulSyncs = parseInt(row.successful_syncs || 0, 10);
      const failedSyncs = parseInt(row.failed_syncs || 0, 10);
      const totalReadingsSynced = parseInt(row.total_readings_synced || 0, 10);
      const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

      return {
        total_syncs: totalSyncs,
        successful_syncs: successfulSyncs,
        failed_syncs: failedSyncs,
        total_readings_synced: totalReadingsSynced,
        success_rate: Math.round(successRate * 100) / 100,
        last_sync_time: row.last_sync_time,
      };
    } catch (error) {
      console.error('❌ [SQL] Failed to get sync stats:', error);
      throw error;
    }
  }

  /**
   * Get recent sync logs (implements SyncDatabase interface)
   */
  async getRecentSyncLogs(limit: number = 100): Promise<SyncLog[]> {
    try {
      const query = `SELECT * FROM sync_log ORDER BY synced_at DESC LIMIT $1`;
      console.log('\n🔍 [SQL] Querying recent sync logs:', query, `[limit: ${limit}]`);
      const result = await this.pool.query(query, [limit]);
      console.log(`📋 [SQL] Query returned ${result.rows.length} log(s)`);
      return result.rows;
    } catch (error) {
      console.error('❌ [SQL] Failed to get recent sync logs:', error);
      throw error;
    }
  }
}

/**
 * Create a database instance from environment variables (legacy)
 * @deprecated Use initializePools() and access syncPool/remotePool directly instead
 */
export function createDatabaseFromEnv(): SyncDatabase {
  const config: DatabaseConfig = {
    host: process.env.POSTGRES_SYNC_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
    database: process.env.POSTGRES_SYNC_DB || 'postgres',
    user: process.env.POSTGRES_SYNC_USER || 'postgres',
    password: process.env.POSTGRES_SYNC_PASSWORD || '',
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
