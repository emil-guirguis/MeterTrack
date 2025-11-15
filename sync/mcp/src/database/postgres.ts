/**
 * PostgreSQL Database Client for Sync
 * 
 * Provides connection management and query methods for the Sync Database.
 * Handles meters, meter_readings, and sync_log tables.
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export interface Meter {
  id: number;
  external_id: string;
  name: string;
  bacnet_device_id?: number;
  bacnet_ip?: string;
  config?: any;
  last_reading_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MeterReading {
  id: number;
  meter_external_id: string;
  timestamp: Date;
  data_point: string;
  value: number;
  unit?: string;
  is_synchronized: boolean;
  retry_count: number;
  created_at: Date;
}

export interface SyncLog {
  id: number;
  batch_size: number;
  success: boolean;
  error_message?: string;
  synced_at: Date;
}

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
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
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
   * Get all meters
   */
  async getMeters(activeOnly: boolean = true): Promise<Meter[]> {
    const query = activeOnly
      ? 'SELECT * FROM meters WHERE is_active = true ORDER BY name'
      : 'SELECT * FROM meters ORDER BY name';
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get meter by external ID
   */
  async getMeterByExternalId(externalId: string): Promise<Meter | null> {
    const result = await this.pool.query(
      'SELECT * FROM meters WHERE external_id = $1',
      [externalId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get meter by ID
   */
  async getMeterById(id: number): Promise<Meter | null> {
    const result = await this.pool.query(
      'SELECT * FROM meters WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update a meter
   */
  async upsertMeter(meter: {
    external_id: string;
    name: string;
    bacnet_device_id?: number;
    bacnet_ip?: string;
    config?: any;
    is_active?: boolean;
  }): Promise<Meter> {
    const result = await this.pool.query(
      `INSERT INTO meters (external_id, name, bacnet_device_id, bacnet_ip, config, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (external_id) 
       DO UPDATE SET 
         name = EXCLUDED.name,
         bacnet_device_id = EXCLUDED.bacnet_device_id,
         bacnet_ip = EXCLUDED.bacnet_ip,
         config = EXCLUDED.config,
         is_active = EXCLUDED.is_active,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        meter.external_id,
        meter.name,
        meter.bacnet_device_id,
        meter.bacnet_ip,
        meter.config ? JSON.stringify(meter.config) : null,
        meter.is_active !== undefined ? meter.is_active : true,
      ]
    );
    return result.rows[0];
  }

  /**
   * Update meter last reading timestamp
   */
  async updateMeterLastReading(externalId: string, timestamp: Date): Promise<void> {
    await this.pool.query(
      'UPDATE meters SET last_reading_at = $1, updated_at = CURRENT_TIMESTAMP WHERE external_id = $2',
      [timestamp, externalId]
    );
  }

  /**
   * Deactivate a meter
   */
  async deactivateMeter(externalId: string): Promise<void> {
    await this.pool.query(
      'UPDATE meters SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE external_id = $1',
      [externalId]
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
  }): Promise<MeterReading> {
    const result = await this.pool.query(
      `INSERT INTO meter_readings (meter_external_id, timestamp, data_point, value, unit)
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
  async batchInsertReadings(readings: Array<{
    meter_external_id: string;
    timestamp: Date;
    data_point: string;
    value: number;
    unit?: string;
  }>): Promise<number> {
    if (readings.length === 0) {
      return 0;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let insertedCount = 0;
      for (const reading of readings) {
        await client.query(
          `INSERT INTO meter_readings (meter_external_id, timestamp, data_point, value, unit)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            reading.meter_external_id,
            reading.timestamp,
            reading.data_point,
            reading.value,
            reading.unit,
          ]
        );
        insertedCount++;
      }

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
   * Get unsynchronized readings for sync
   */
  async getUnsynchronizedReadings(limit: number = 1000): Promise<MeterReading[]> {
    const result = await this.pool.query(
      `SELECT * FROM meter_readings 
       WHERE is_synchronized = false 
       ORDER BY created_at ASC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get readings by meter and time range
   */
  async getReadingsByMeterAndTimeRange(
    meterExternalId: string,
    startTime: Date,
    endTime: Date
  ): Promise<MeterReading[]> {
    const result = await this.pool.query(
      `SELECT * FROM meter_readings 
       WHERE meter_external_id = $1 
         AND timestamp >= $2 
         AND timestamp <= $3 
       ORDER BY timestamp ASC`,
      [meterExternalId, startTime, endTime]
    );
    return result.rows;
  }

  /**
   * Get recent readings (last N hours)
   */
  async getRecentReadings(hours: number = 24): Promise<MeterReading[]> {
    const result = await this.pool.query(
      `SELECT * FROM meter_readings 
       WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp DESC`,
      []
    );
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
      `UPDATE meter_readings 
       SET is_synchronized = true 
       WHERE id = ANY($1::int[])`,
      [readingIds]
    );
    return result.rowCount || 0;
  }

  /**
   * Delete synchronized readings
   */
  async deleteSynchronizedReadings(readingIds: number[]): Promise<number> {
    if (readingIds.length === 0) {
      return 0;
    }

    const result = await this.pool.query(
      `DELETE FROM meter_readings 
       WHERE id = ANY($1::int[]) AND is_synchronized = true`,
      [readingIds]
    );
    return result.rowCount || 0;
  }

  /**
   * Increment retry count for failed readings
   */
  async incrementRetryCount(readingIds: number[]): Promise<number> {
    if (readingIds.length === 0) {
      return 0;
    }

    const result = await this.pool.query(
      `UPDATE meter_readings 
       SET retry_count = retry_count + 1 
       WHERE id = ANY($1::int[])`,
      [readingIds]
    );
    return result.rowCount || 0;
  }

  /**
   * Get count of unsynchronized readings
   */
  async getUnsynchronizedCount(): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM meter_readings WHERE is_synchronized = false'
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Delete old synchronized readings (cleanup)
   */
  async deleteOldSynchronizedReadings(daysOld: number = 7): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM meter_readings 
       WHERE is_synchronized = true 
         AND created_at < NOW() - INTERVAL '${daysOld} days'`
    );
    return result.rowCount || 0;
  }

  // ==================== SYNC LOG METHODS ====================

  /**
   * Log a sync operation
   */
  async logSyncOperation(
    batchSize: number,
    success: boolean,
    errorMessage?: string
  ): Promise<SyncLog> {
    const result = await this.pool.query(
      `INSERT INTO sync_log (batch_size, success, error_message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [batchSize, success, errorMessage || null]
    );
    return result.rows[0];
  }

  /**
   * Get recent sync logs
   */
  async getRecentSyncLogs(limit: number = 100): Promise<SyncLog[]> {
    const result = await this.pool.query(
      `SELECT * FROM sync_log 
       ORDER BY synced_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(hours: number = 24): Promise<{
    total_syncs: number;
    successful_syncs: number;
    failed_syncs: number;
    total_readings_synced: number;
    success_rate: number;
  }> {
    const result = await this.pool.query(
      `SELECT 
         COUNT(*) as total_syncs,
         SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_syncs,
         SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed_syncs,
         SUM(CASE WHEN success = true THEN batch_size ELSE 0 END) as total_readings_synced
       FROM sync_log 
       WHERE synced_at >= NOW() - INTERVAL '${hours} hours'`
    );

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
}

/**
 * Create a database instance from environment variables
 */
export function createDatabaseFromEnv(): SyncDatabase {
  const config: DatabaseConfig = {
    host: process.env.LOCAL_POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.LOCAL_POSTGRES_PORT || '5432', 10),
    database: process.env.LOCAL_POSTGRES_DB || 'meterit_sync',
    user: process.env.LOCAL_POSTGRES_USER || 'postgres',
    password: process.env.LOCAL_POSTGRES_PASSWORD || '',
  };

  return new SyncDatabase(config);
}
