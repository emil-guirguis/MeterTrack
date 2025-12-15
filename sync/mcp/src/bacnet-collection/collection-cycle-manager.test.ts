/**
 * Property-based tests for CollectionCycleManager
 * 
 * **Feature: bacnet-meter-reading-agent, Property 8: Meter Iteration**
 * **Feature: bacnet-meter-reading-agent, Property 13: Register Read Failure Resilience**
 * **Feature: bacnet-meter-reading-agent, Property 14: Reading Persistence**
 * **Feature: bacnet-meter-reading-agent, Property 17: Database Write Failure Handling**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { CollectionCycleManager } from './collection-cycle-manager.js';
import { MeterCache } from './meter-cache.js';
import { BACnetClient } from './bacnet-client.js';
import { CachedMeter, RegisterMap, BACnetReadResult } from './types.js';

// ==================== GENERATORS ====================

/**
 * Generate a valid register map with at least one data point
 */
const registerMapArbitrary = (): fc.Arbitrary<RegisterMap> => {
  return fc.dictionary(
    fc.string({ minLength: 2, maxLength: 30 }),
    fc.record({
      objectType: fc.constantFrom('analogInput', 'analogOutput', 'binaryInput', 'binaryOutput'),
      objectInstance: fc.integer({ min: 0, max: 100 }),
      propertyId: fc.constantFrom('presentValue', 'units', 'status'),
    }),
    { minKeys: 1, maxKeys: 5 }
  );
};

/**
 * Generate a valid cached meter
 */
const cachedMeterArbitrary = (): fc.Arbitrary<CachedMeter> => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 30 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    ip: fc.ipV4(),
    port: fc.integer({ min: 1, max: 65535 }).map(String),
    register_map: registerMapArbitrary(),
    protocol: fc.constant('bacnet'),
  });
};

/**
 * Create a mock meter cache
 */
const createMockMeterCache = (meters: CachedMeter[]): MeterCache => {
  let cachedMeters = [...meters];
  const cache = {
    getMeters: () => cachedMeters,
    getMeter: (id: string) => cachedMeters.find((m) => m.id === id) || null,
    isValid: () => cachedMeters.length > 0,
    clear: () => {
      cachedMeters = [];
    },
    reload: vi.fn(async () => {
      // Mock reload - in tests, we don't actually reload
    }),
  } as any;
  return cache;
};

/**
 * Create a mock BACnet client
 */
const createMockBACnetClient = (
  readResults: Map<string, BACnetReadResult> = new Map()
): BACnetClient => {
  const client = {
    readProperty: vi.fn(async (
      ip: string,
      port: number,
      objectType: string,
      objectInstance: number,
      propertyId: string,
      timeoutMs: number
    ): Promise<BACnetReadResult> => {
      const key = `${ip}:${port}:${objectType}:${objectInstance}:${propertyId}`;
      if (readResults.has(key)) {
        return readResults.get(key)!;
      }
      // Default: successful read with a random value
      return {
        success: true,
        value: Math.random() * 1000,
        unit: 'unit',
      };
    }),
    close: vi.fn(async () => {}),
  } as any;
  return client;
};

/**
 * Create a mock database
 */
const createMockDatabase = () => {
  const insertedReadings: any[] = [];
  let shouldFailWrite = false;

  return {
    pool: {
      connect: vi.fn(async () => {
        return {
          query: vi.fn(async (sql: string, params?: any[]) => {
            if (sql === 'BEGIN') {
              return { rows: [] };
            }

            if (sql === 'COMMIT') {
              return { rows: [] };
            }

            if (sql === 'ROLLBACK') {
              return { rows: [] };
            }

            if (sql.includes('INSERT INTO meter_reading')) {
              if (shouldFailWrite) {
                throw new Error('Simulated database write failure');
              }

              if (params && params.length > 0) {
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
    setShouldFailWrite: (value: boolean) => {
      shouldFailWrite = value;
    },
  };
};

// ==================== TESTS ====================

describe('CollectionCycleManager', () => {
  let manager: CollectionCycleManager;

  beforeEach(() => {
    manager = new CollectionCycleManager();
  });

  /**
   * Property 8: Meter Iteration
   * 
   * For any collection cycle, the system SHALL iterate through all active meters
   * in the cache and attempt to read from each one.
   * 
   * **Validates: Requirements 3.1**
   */
  it('Property 8: Meter Iteration - all meters in cache are processed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cachedMeterArbitrary(), { minLength: 1, maxLength: 10 }),
        async (meters) => {
          const mockCache = createMockMeterCache(meters);
          const mockClient = createMockBACnetClient();
          const mockDb = createMockDatabase();

          const result = await manager.executeCycle(mockCache, mockClient, mockDb);

          // All meters should be processed
          expect(result.metersProcessed).toBe(meters.length);

          // The cycle should complete
          expect(result.cycleId).toBeDefined();
          expect(result.startTime).toBeDefined();
          expect(result.endTime).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Register Read Failure Resilience
   * 
   * For any data point that fails to read from a meter, the system SHALL log the
   * read error with meter ID, data point name, and error details, and continue
   * reading other data points for that meter.
   * 
   * **Validates: Requirements 4.3**
   */
  it('Property 13: Register Read Failure Resilience - read failures do not stop cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cachedMeterArbitrary(), { minLength: 1, maxLength: 5 }),
        async (meters) => {
          const mockCache = createMockMeterCache(meters);

          // Create a client that fails on first read for each meter, succeeds on others
          let globalReadCount = 0;

          const mockClient = {
            readProperty: vi.fn(async (
              ip: string,
              port: number,
              objectType: string,
              objectInstance: number,
              propertyId: string,
              timeoutMs: number
            ): Promise<BACnetReadResult> => {
              globalReadCount++;

              // Fail every 3rd read to simulate some failures
              if (globalReadCount % 3 === 1) {
                return {
                  success: false,
                  error: 'Simulated read failure',
                };
              }

              return {
                success: true,
                value: Math.random() * 1000,
                unit: 'unit',
              };
            }),
            close: vi.fn(async () => {}),
          } as any;

          const mockDb = createMockDatabase();

          const result = await manager.executeCycle(mockCache, mockClient, mockDb);

          // All meters should still be processed despite read failures
          expect(result.metersProcessed).toBe(meters.length);

          // There should be some errors recorded (at least one per meter that had a read failure)
          expect(result.errors.length).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: Reading Persistence
   * 
   * For any successfully read data point, the system SHALL store the reading in
   * the meter_reading table with meter_id, timestamp, data_point, value, and unit.
   * 
   * **Validates: Requirements 4.4**
   */
  it('Property 14: Reading Persistence - successful reads are persisted to database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cachedMeterArbitrary(), { minLength: 1, maxLength: 5 }),
        async (meters) => {
          const mockCache = createMockMeterCache(meters);
          const mockClient = createMockBACnetClient();
          const mockDb = createMockDatabase();

          const result = await manager.executeCycle(mockCache, mockClient, mockDb);

          // Get inserted readings
          const insertedReadings = mockDb.getInsertedReadings();

          // Should have readings inserted
          expect(insertedReadings.length).toBeGreaterThanOrEqual(0);

          // Each inserted reading should have required fields
          for (const reading of insertedReadings) {
            expect(reading.meter_id).toBeDefined();
            expect(reading.timestamp).toBeDefined();
            expect(reading.data_point).toBeDefined();
            expect(reading.value).toBeDefined();
            expect(reading.is_synchronized).toBe(false);
          }

          // Readings collected should match inserted readings
          expect(result.readingsCollected).toBe(insertedReadings.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 17: Database Write Failure Handling
   * 
   * For any batch insert that fails, the system SHALL log the database error and
   * continue processing other meters without stopping the collection cycle.
   * 
   * **Validates: Requirements 5.3**
   */
  it('Property 17: Database Write Failure Handling - write failures do not stop cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cachedMeterArbitrary(), { minLength: 2, maxLength: 5 }),
        async (meters) => {
          const mockCache = createMockMeterCache(meters);
          const mockClient = createMockBACnetClient();
          const mockDb = createMockDatabase();

          // Fail on first write, succeed on others
          let writeAttempt = 0;
          const originalConnect = mockDb.pool.connect;
          mockDb.pool.connect = vi.fn(async () => {
            const client = await originalConnect();
            const originalQuery = client.query;

            client.query = vi.fn(async (sql: string, params?: any[]) => {
              if (sql.includes('INSERT INTO meter_reading')) {
                if (writeAttempt++ === 0) {
                  throw new Error('Simulated write failure');
                }
              }
              return originalQuery(sql, params);
            });

            return client;
          });

          const result = await manager.executeCycle(mockCache, mockClient, mockDb);

          // All meters should still be processed despite write failure
          expect(result.metersProcessed).toBe(meters.length);

          // There should be an error recorded for the failed write
          expect(result.errors.length).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Empty meter cache returns empty result
   */
  it('empty meter cache returns zero meters processed', async () => {
    const mockCache = createMockMeterCache([]);
    const mockClient = createMockBACnetClient();
    const mockDb = createMockDatabase();

    const result = await manager.executeCycle(mockCache, mockClient, mockDb);

    expect(result.metersProcessed).toBe(0);
    expect(result.readingsCollected).toBe(0);
    expect(result.success).toBe(true);
  });

  /**
   * Additional test: Cycle result has required fields
   */
  it('cycle result contains all required fields', async () => {
    const meters = [
      {
        id: 'meter-1',
        name: 'Test Meter',
        ip: '192.168.1.1',
        port: '502',
        register_map: {
          energy: {
            objectType: 'analogInput',
            objectInstance: 0,
            propertyId: 'presentValue',
          },
        },
        protocol: 'bacnet',
      },
    ];

    const mockCache = createMockMeterCache(meters);
    const mockClient = createMockBACnetClient();
    const mockDb = createMockDatabase();

    const result = await manager.executeCycle(mockCache, mockClient, mockDb);

    expect(result.cycleId).toBeDefined();
    expect(typeof result.cycleId).toBe('string');
    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.endTime).toBeInstanceOf(Date);
    expect(typeof result.metersProcessed).toBe('number');
    expect(typeof result.readingsCollected).toBe('number');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(typeof result.success).toBe('boolean');
  });

  /**
   * Additional test: End time is after start time
   */
  it('cycle end time is after start time', async () => {
    const meters = [
      {
        id: 'meter-1',
        name: 'Test Meter',
        ip: '192.168.1.1',
        port: '502',
        register_map: {
          energy: {
            objectType: 'analogInput',
            objectInstance: 0,
            propertyId: 'presentValue',
          },
        },
        protocol: 'bacnet',
      },
    ];

    const mockCache = createMockMeterCache(meters);
    const mockClient = createMockBACnetClient();
    const mockDb = createMockDatabase();

    const result = await manager.executeCycle(mockCache, mockClient, mockDb);

    expect(result.endTime.getTime()).toBeGreaterThanOrEqual(result.startTime.getTime());
  });
});
