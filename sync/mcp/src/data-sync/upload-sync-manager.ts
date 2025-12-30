/**
 * Upload Sync Manager
 * 
 * Handles uploading meter readings from local database to remote database.
 * Implements batch processing, transaction management, and error handling.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { Pool, PoolClient } from 'pg';
import winston from 'winston';
import { ErrorHandler } from './error-handler';

export interface MeterReading {
  id: string; // UUID in actual schema
  meter_id: number; // bigint foreign key
  createdat: Date;
  [key: string]: any; // Allow any meter reading fields
}

export interface UploadSyncResult {
  success: boolean;
  recordsUploaded: number;
  recordsDeleted: number;
  error?: string;
  duration: number;
}

export interface UploadSyncManagerConfig {
  localPool: Pool;
  remotePool: Pool;
  batchSize?: number;
  maxQueryRetries?: number;
  logger?: winston.Logger;
}

export class UploadSyncManager {
  private localPool: Pool;
  private remotePool: Pool;
  private batchSize: number;
  private maxQueryRetries: number;
  private logger: winston.Logger;
  private errorHandler: ErrorHandler;

  constructor(config: UploadSyncManagerConfig) {
    this.localPool = config.localPool;
    this.remotePool = config.remotePool;
    this.batchSize = config.batchSize || 100;
    this.maxQueryRetries = config.maxQueryRetries || 3;
    this.logger = config.logger || this.createDefaultLogger();
    this.errorHandler = new ErrorHandler(this.logger);
  }

  /**
   * Execute upload sync cycle
   * Queries unsynchronized readings, uploads to remote, and deletes from local
   */
  async syncReadings(): Promise<UploadSyncResult> {
    const startTime = Date.now();

    try {
      // Query unsynchronized readings from local database
      const readings = await this.queryUnsynchronizedReadings();

      if (readings.length === 0) {
        this.logger.info('No unsynchronized readings to upload');
        return {
          success: true,
          recordsUploaded: 0,
          recordsDeleted: 0,
          duration: Date.now() - startTime,
        };
      }

      this.logger.info(`Found ${readings.length} unsynchronized readings to upload`);

      // Upload batch to remote database
      const uploadSuccess = await this.uploadBatchToRemote(readings);

      if (!uploadSuccess) {
        return {
          success: false,
          recordsUploaded: 0,
          recordsDeleted: 0,
          error: 'Failed to upload batch to remote database',
          duration: Date.now() - startTime,
        };
      }

      // Delete successfully uploaded readings from local database
      const deletedCount = await this.deleteFromLocal(readings);

      const duration = Date.now() - startTime;
      this.logger.info(
        `Upload sync completed: ${readings.length} uploaded, ${deletedCount} deleted in ${duration}ms`
      );

      return {
        success: true,
        recordsUploaded: readings.length,
        recordsDeleted: deletedCount,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Upload sync failed:', errorMessage);

      return {
        success: false,
        recordsUploaded: 0,
        recordsDeleted: 0,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Query unsynchronized meter readings from local database
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.2
   */
  private async queryUnsynchronizedReadings(): Promise<MeterReading[]> {
    // Use error handler with retry logic (Requirement 6.2)
    return this.errorHandler.handleQueryError(
      async () => {
        const result = await this.localPool.query(
          `SELECT *
           FROM meter_reading
           WHERE is_synchronized = false
           ORDER BY createdat ASC
           LIMIT $1`,
          [this.batchSize]
        );

        return result.rows;
      },
      {
        operation: 'queryUnsynchronizedReadings',
        details: { batchSize: this.batchSize },
      }
    );
  }

  /**
   * Upload batch of meter readings to remote database using transaction
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  private async uploadBatchToRemote(readings: MeterReading[]): Promise<boolean> {
    let client: PoolClient | null = null;

    try {
      if (readings.length === 0) {
        return true;
      }

      // Get client from remote pool
      client = await this.remotePool.connect();

      // Begin transaction
      await client.query('BEGIN');

      // Get column names from first reading (excluding is_synchronized)
      const firstReading = readings[0];
      const columns = Object.keys(firstReading).filter(col => col !== 'is_synchronized');
      
      // Build batch INSERT statement
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      for (const reading of readings) {
        const rowPlaceholders: string[] = [];
        for (const col of columns) {
          rowPlaceholders.push(`$${paramIndex}`);
          values.push(reading[col]);
          paramIndex++;
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      }

      const insertQuery = `
        INSERT INTO meter_reading (${columns.join(', ')})
        VALUES ${placeholders.join(', ')}
      `;

      // Execute batch insert
      await client.query(insertQuery, values);

      // Commit transaction
      await client.query('COMMIT');

      this.logger.info(`Successfully uploaded ${readings.length} readings to remote database`);
      return true;
    } catch (error) {
      // Rollback transaction on error
      if (client) {
        try {
          await client.query('ROLLBACK');
          this.logger.info('Transaction rolled back due to error');
        } catch (rollbackError) {
          this.logger.error('Failed to rollback transaction:', rollbackError);
        }
      }

      const err = error instanceof Error ? error : new Error(String(error));
      
      // Handle upload error with data preservation (Requirement 6.3)
      this.errorHandler.handleUploadError(err, {
        operation: 'uploadBatchToRemote',
        details: { batchSize: readings.length },
      });
      
      return false;
    } finally {
      // Release client back to pool
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Delete successfully uploaded readings from local database using transaction
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  private async deleteFromLocal(readings: MeterReading[]): Promise<number> {
    let client: PoolClient | null = null;

    try {
      // Get client from local pool
      client = await this.localPool.connect();

      // Begin transaction
      await client.query('BEGIN');

      // Extract reading IDs (UUIDs)
      const readingIds = readings.map((r) => r.id);

      // Delete readings by IDs
      const result = await client.query(
        `DELETE FROM meter_reading
         WHERE id = ANY($1::uuid[])`,
        [readingIds]
      );

      // Commit transaction
      await client.query('COMMIT');

      const deletedCount = result.rowCount || 0;
      this.logger.info(`Successfully deleted ${deletedCount} readings from local database`);

      return deletedCount;
    } catch (error) {
      // Rollback transaction on error
      if (client) {
        try {
          await client.query('ROLLBACK');
          this.logger.info('Delete transaction rolled back due to error');
        } catch (rollbackError) {
          this.logger.error('Failed to rollback delete transaction:', rollbackError);
        }
      }

      const err = error instanceof Error ? error : new Error(String(error));
      
      // Handle delete error with transaction rollback (Requirement 6.4)
      this.errorHandler.handleDeleteError(err, {
        operation: 'deleteFromLocal',
        details: { batchSize: readings.length },
      });
      
      // Don't throw - we want to preserve the data for next sync cycle
      return 0;
    } finally {
      // Release client back to pool
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Get current queue size (count of unsynchronized readings)
   */
  async getQueueSize(): Promise<number> {
    try {
      const result = await this.localPool.query(
        'SELECT COUNT(*) as count FROM meter_reading WHERE is_synchronized = false'
      );
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      this.logger.error('Failed to get queue size:', error);
      return 0;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const baseDelay = 2000; // 2 seconds
    return Math.min(baseDelay * Math.pow(2, retryCount), 8000); // Max 8 seconds
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }
}
