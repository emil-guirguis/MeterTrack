/**
 * Property-based tests for ReadingBatcher
 * 
 * **Feature: bacnet-meter-reading-agent, Property 15: Batch Insert Atomicity**
 * **Feature: bacnet-meter-reading-agent, Property 16: Unsynchronized Marking**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { ReadingBatcher } from './reading-batcher.js';
import { PendingReading } from './types.js';

// ==================== GENERATORS ====================

/**
 * Generate a valid pending reading
 */
const pendingReadingArbitrary = (): fc.Arbitrary<PendingReading> => {
  return fc.record({
    meter_id: fc.string({ minLength: 1, maxLength: 50 }),
    timestamp: fc.date(),
    data_point: fc.string({ minLength: 1, maxLength: 100 }),
    value: fc.float({ min: -1000000, max: 1000000, noNaN: true }),
    unit: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { freq: 2 }),
  });
};

/**
 * Generate a batch of readings
 */
const readingBatchArbitrary = (): fc.Arbitrary<PendingReading[]> => {
  return fc.array(pendingReadingArbitrary(), { minLength: 1, maxLength: 100 });
};

/**
 * Create a mock database with transaction support
 */
const createMockDatabase = () => {
  const insertedReadings: any[] = [];
  let transactionActive = false;
  let shouldRollback = false;

  return {
    pool: {
      connect: vi.fn(async () => {
        return {
          query: vi.fn(async (sql: string, params?: any[]) => {
            if (sql === 'BEGIN') {
              transactionActive = true;
              return { rows: [] };
            }

            if (sql === 'COMMIT') {
              if (!transactionActive) {
                throw new Error('COMMIT without BEGIN');
              }
              transactionActive = false;
              return { rows: [] };
            }

            if (sql === 'ROLLBACK') {
              transactionActive = false;
              return { rows: [] };
            }

            // Handle INSERT query
            if (sql.includes('INSERT INTO meter_reading')) {
              if (!transactionActive) {
                throw new Error('INSERT outside transaction');
              }

              if (shouldRollback) {
                throw new Error('Simulated database error');
              }

              // Parse the INSERT statement to extract values
              // This is a simplified parser for testing
              if (params && params.length > 0) {
                // Group params into rows (6 params per row: meter_id, timestamp, data_point, value, unit, is_synchronized)
                const paramsPerRow = 6;
                for (let i = 0; i < params.length; i += paramsPerRow) {
                  insertedReadings.push({
                    meter_id: params[i],
                    timestamp: params[i + 1],
                    data_point: params[i + 2],
                    value: params[i + 3],
                    unit: params[i + 4],
                    is_synchronized: params[i + 5],
                  });
                }
              }

              return { rows: [] };
            }

            return { rows: [] };
          }),
          release: vi.fn(),
        };
      }),
    },
    getInsertedReadings: () => insertedReadings,
    resetInsertedReadings: () => {
      insertedReadings.length = 0;
    },
    setShouldRollback: (value: boolean) => {
      shouldRollback = value;
    },
  };
};

// ==================== TESTS ====================

describe('ReadingBatcher', () => {
  let batcher: ReadingBatcher;
  let mockDb: any;

  beforeEach(() => {
    batcher = new ReadingBatcher();
    mockDb = createMockDatabase();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 15: Batch Insert Atomicity
   * 
   * For any meter, all readings collected from that meter in a single collection
   * cycle SHALL be inserted into the database in a single transaction.
   * 
   * **Validates: Requirements 5.1**
   */
  it('Property 15: Batch Insert Atomicity - all readings inserted in single transaction', async () => {
    await fc.assert(
      fc.asyncProperty(readingBatchArbitrary(), async (readings) => {
        const batcher = new ReadingBatcher();
        const mockDb = createMockDatabase();

        // Add all readings to the batcher
        for (const reading of readings) {
          batcher.addReading(reading);
        }

        // Verify pending count matches
        expect(batcher.getPendingCount()).toBe(readings.length);

        // Flush the batch
        const insertedCount = await batcher.flushBatch(mockDb);

        // Verify all readings were inserted
        expect(insertedCount).toBe(readings.length);

        // Verify the database received the correct number of readings
        const insertedReadings = mockDb.getInsertedReadings();
        expect(insertedReadings.length).toBe(readings.length);

        // Verify pending count is now 0 after successful flush
        expect(batcher.getPendingCount()).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Unsynchronized Marking
   * 
   * For any successfully inserted reading, the system SHALL set is_synchronized=false
   * to mark it for later upload to the client system.
   * 
   * **Validates: Requirements 5.2**
   */
  it('Property 16: Unsynchronized Marking - all inserted readings marked as not synchronized', async () => {
    await fc.assert(
      fc.asyncProperty(readingBatchArbitrary(), async (readings) => {
        const batcher = new ReadingBatcher();
        const mockDb = createMockDatabase();

        // Add all readings to the batcher
        for (const reading of readings) {
          batcher.addReading(reading);
        }

        // Flush the batch
        await batcher.flushBatch(mockDb);

        // Get the inserted readings from the mock database
        const insertedReadings = mockDb.getInsertedReadings();

        // Verify all inserted readings have is_synchronized = false
        for (const insertedReading of insertedReadings) {
          expect(insertedReading.is_synchronized).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Empty batch returns 0
   */
  it('flushing empty batch returns 0', async () => {
    const mockDb = createMockDatabase();
    const insertedCount = await batcher.flushBatch(mockDb);
    expect(insertedCount).toBe(0);
  });

  /**
   * Additional test: Batch is cleared after successful flush
   */
  it('batch is cleared after successful flush', async () => {
    await fc.assert(
      fc.asyncProperty(readingBatchArbitrary(), async (readings) => {
        const batcher = new ReadingBatcher();
        const mockDb = createMockDatabase();

        // Add readings
        for (const reading of readings) {
          batcher.addReading(reading);
        }

        expect(batcher.getPendingCount()).toBe(readings.length);

        // Flush
        await batcher.flushBatch(mockDb);

        // Batch should be empty
        expect(batcher.getPendingCount()).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Error handling on database failure
   */
  it('error is thrown and batch is not cleared on database failure', async () => {
    const batcher = new ReadingBatcher();
    const mockDb = createMockDatabase();
    mockDb.setShouldRollback(true);

    // Add a reading
    batcher.addReading({
      meter_id: 'meter-1',
      timestamp: new Date(),
      data_point: 'energy',
      value: 100,
      unit: 'kWh',
    });

    // Attempt to flush - should throw
    await expect(batcher.flushBatch(mockDb)).rejects.toThrow();

    // Batch should still contain the reading (not cleared on error)
    expect(batcher.getPendingCount()).toBe(1);
  });

  /**
   * Additional test: Multiple flushes work correctly
   */
  it('multiple flushes work correctly', async () => {
    const batcher = new ReadingBatcher();
    const mockDb = createMockDatabase();

    // First batch
    batcher.addReading({
      meter_id: 'meter-1',
      timestamp: new Date(),
      data_point: 'energy',
      value: 100,
      unit: 'kWh',
    });

    const count1 = await batcher.flushBatch(mockDb);
    expect(count1).toBe(1);
    expect(batcher.getPendingCount()).toBe(0);

    // Second batch
    batcher.addReading({
      meter_id: 'meter-2',
      timestamp: new Date(),
      data_point: 'voltage',
      value: 230,
      unit: 'V',
    });

    const count2 = await batcher.flushBatch(mockDb);
    expect(count2).toBe(1);
    expect(batcher.getPendingCount()).toBe(0);

    // Verify both readings were inserted
    const insertedReadings = mockDb.getInsertedReadings();
    expect(insertedReadings.length).toBe(2);
  });

  /**
   * Additional test: Readings with null units are handled correctly
   */
  it('readings with null units are inserted correctly', async () => {
    const batcher = new ReadingBatcher();
    const mockDb = createMockDatabase();

    batcher.addReading({
      meter_id: 'meter-1',
      timestamp: new Date(),
      data_point: 'status',
      value: 1,
      unit: undefined,
    });

    await batcher.flushBatch(mockDb);

    const insertedReadings = mockDb.getInsertedReadings();
    expect(insertedReadings.length).toBe(1);
    expect(insertedReadings[0].unit).toBeNull();
  });
});
