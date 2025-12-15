/**
 * Batches readings for efficient database insertion
 */

import { PendingReading } from './types.js';

export class ReadingBatcher {
  private readings: PendingReading[] = [];
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * Add a reading to the batch queue
   */
  addReading(reading: PendingReading): void {
    this.readings.push(reading);
  }

  /**
   * Flush all queued readings to the database in a single transaction
   */
  async flushBatch(database: any): Promise<number> {
    if (this.readings.length === 0) {
      return 0;
    }

    let client;
    try {
      // Get client from pool
      client = await database.pool.connect();

      // Begin transaction
      await client.query('BEGIN');

      // Build batch INSERT statement with is_synchronized=false
      const columns = ['meter_id', 'timestamp', 'data_point', 'value', 'unit', 'is_synchronized'];
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      for (const reading of this.readings) {
        const rowPlaceholders: string[] = [];
        
        // Add values in column order
        rowPlaceholders.push(`$${paramIndex++}`);
        values.push(reading.meter_id);
        
        rowPlaceholders.push(`$${paramIndex++}`);
        values.push(reading.timestamp);
        
        rowPlaceholders.push(`$${paramIndex++}`);
        values.push(reading.data_point);
        
        rowPlaceholders.push(`$${paramIndex++}`);
        values.push(reading.value);
        
        rowPlaceholders.push(`$${paramIndex++}`);
        values.push(reading.unit || null);
        
        rowPlaceholders.push(`$${paramIndex++}`);
        values.push(false); // is_synchronized = false
        
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

      const insertedCount = this.readings.length;
      this.logger.info(`Successfully inserted ${insertedCount} readings into meter_reading table`);

      // Clear the batch after successful insert
      this.readings = [];

      return insertedCount;
    } catch (error) {
      // Rollback transaction on error
      if (client) {
        try {
          await client.query('ROLLBACK');
          this.logger.info('Transaction rolled back due to error');
        } catch (rollbackError) {
          this.logger.error('Error rolling back transaction:', rollbackError);
        }
      }

      this.logger.error('Error flushing batch to database:', error);
      throw error;
    } finally {
      // Release client back to pool
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Get count of pending readings
   */
  getPendingCount(): number {
    return this.readings.length;
  }
}
