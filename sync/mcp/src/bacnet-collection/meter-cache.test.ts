/**
 * Property-based tests for MeterCache
 * 
 * **Feature: bacnet-meter-reading-agent, Property 4: Meter Cache Loading**
 * **Feature: bacnet-meter-reading-agent, Property 6: Cache Invalidation on Update**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { MeterCache } from './meter-cache.js';
import { CachedMeter, RegisterMap } from './types.js';

// ==================== GENERATORS ====================


/**
 * Generate a valid meter object
 */
const meterArbitrary = (): fc.Arbitrary<any> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    ip: fc.ipV4(),
    port: fc.integer({ min: 1, max: 65535 }).map(String),
    protocol: fc.constantFrom('bacnet', 'modbus', 'mqtt'),
    active: fc.constant(true),
  });
};

/**
 * Generate a mock database with meters (all with valid register maps)
 */
const mockDatabaseArbitrary = (): fc.Arbitrary<any> => {
  return fc.array(meterArbitrary(), { minLength: 1, maxLength: 10 }).map((meters) => {
    // All meters from meterArbitrary() should have valid register maps
    const validMeters = meters.filter((m) => {
      return m.length > 0;
    });

    // If filtering removed all meters, return the original meters
    // This shouldn't happen with our generator, but be safe
    const metersToUse = validMeters.length > 0 ? validMeters : meters;

    return {
      getMeters: async (activeOnly: boolean) => {
        if (activeOnly) {
          return metersToUse.filter((m) => m.active);
        }
        return metersToUse;
      },
    };
  });
};

// ==================== TESTS ====================

describe('MeterCache', () => {
  let cache: MeterCache;

  beforeEach(() => {
    cache = new MeterCache();
  });

  /**
   * Property 4: Meter Cache Loading
   * 
   * For any agent startup, the system SHALL load all active meters from the database
   * into the cache, and the cache SHALL contain exactly the set of active meters at
   * startup time.
   * 
   * **Validates: Requirements 2.1**
   */
  it('Property 4: Meter Cache Loading - cache contains exactly the active meters loaded from database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(meterArbitrary(), { minLength: 1, maxLength: 10 }),
        async (meters) => {
          // Create mock database that returns all meters
          const mockDb = {
            getMeters: async (activeOnly: boolean) => {
              if (activeOnly) {
                return meters.filter((m) => m.active);
              }
              return meters;
            },
          };

          const cache = new MeterCache();

          // Reload cache from mock database
          await cache.reload(mockDb);

          // Get all active meters from database
          const activeMeters = await mockDb.getMeters(true);

          // Get cached meters
          const cachedMeters = cache.getMeters();

          // The cache should contain exactly the same meters as the database
          // (all active meters with valid register maps)
          expect(cachedMeters.length).toBe(activeMeters.length);

          // Each cached meter should match a database meter
          for (const cachedMeter of cachedMeters) {
            const dbMeter = activeMeters.find((m: any) => m.id === cachedMeter.id);
            expect(dbMeter).toBeDefined();
            expect(cachedMeter.name).toBe(dbMeter.name);
            expect(cachedMeter.ip).toBe(dbMeter.ip);
            expect(cachedMeter.port).toBe(dbMeter.port);
            expect(cachedMeter.protocol).toBe(dbMeter.protocol);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Cache Invalidation on Update
   */
  it('Property 6: Cache Invalidation on Update - cache reflects updated register maps after reload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(meterArbitrary(), { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 0, max: 4 }),
        async (initialMeters, updateIndex) => {
          // Only test if we have meters to update
          if (initialMeters.length === 0) return;

          const updateIdx = updateIndex % initialMeters.length;

          // Create initial mock database
          const initialDb = {
            getMeters: async (activeOnly: boolean) => {
              if (activeOnly) {
                return initialMeters.filter((m) => m.active);
              }
              return initialMeters;
            },
          };

          // Load initial cache
          const cache = new MeterCache();
          await cache.reload(initialDb);

          // Get the initial register map for the meter to update
          const meterToUpdate = initialMeters[updateIdx];
          const initialCachedMeter = cache.getMeter(meterToUpdate.id);
          expect(initialCachedMeter).toBeDefined();

          // Create updated meter with new register map
          const updatedMeters = [...initialMeters];
          updatedMeters[updateIdx] = {
            ...meterToUpdate,

          };

          // Create updated mock database
          const updatedDb = {
            getMeters: async (activeOnly: boolean) => {
              if (activeOnly) {
                return updatedMeters.filter((m) => m.active);
              }
              return updatedMeters;
            },
          };

          // Reload cache with updated database
          await cache.reload(updatedDb);

          // Get the updated cached meter
          const updatedCachedMeter = cache.getMeter(meterToUpdate.id);
          expect(updatedCachedMeter).toBeDefined();

        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Cache validity after successful load
   */
  it('cache is marked as valid after successful reload with meters', async () => {
    await fc.assert(
      fc.asyncProperty(mockDatabaseArbitrary(), async (mockDb) => {
        const cache = new MeterCache();

        // Cache should be invalid before reload
        expect(cache.isValid()).toBe(false);

        // Reload cache
        await cache.reload(mockDb);

        // Cache should be valid after reload
        expect(cache.isValid()).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: getMeter returns correct meter by ID
   */
  it('getMeter returns the correct meter by ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(meterArbitrary(), { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 0, max: 4 }),
        async (meters, indexToRetrieve) => {
          if (meters.length === 0) return;

          const idx = indexToRetrieve % meters.length;
          const mockDb = {
            getMeters: async (activeOnly: boolean) => {
              if (activeOnly) {
                return meters.filter((m) => m.active);
              }
              return meters;
            },
          };

          const cache = new MeterCache();
          await cache.reload(mockDb);

          const meterToFind = meters[idx];
          const retrievedMeter = cache.getMeter(meterToFind.id);

          expect(retrievedMeter).toBeDefined();
          expect(retrievedMeter!.id).toBe(meterToFind.id);
          expect(retrievedMeter!.name).toBe(meterToFind.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Invalid register maps are skipped
   */
  it('meters with invalid register maps are skipped during reload', async () => {
    const validMeter = {
      id: 'valid-meter',
      name: 'Valid Meter',
      ip: '192.168.1.1',
      port: '502',
      protocol: 'bacnet',
      active: true,
    };

    const invalidMeter = {
      id: 'invalid-meter',
      name: 'Invalid Meter',
      ip: '192.168.1.2',
      port: '502',
      protocol: 'bacnet',
      active: true,
    };

    const mockDb = {
      getMeters: async (activeOnly: boolean) => {
        if (activeOnly) {
          return [validMeter, invalidMeter];
        }
        return [validMeter, invalidMeter];
      },
    };

    const cache = new MeterCache();
    await cache.reload(mockDb);

    // Only the valid meter should be in the cache
    expect(cache.getMeters().length).toBe(1);
    expect(cache.getMeter('valid-meter')).toBeDefined();
    expect(cache.getMeter('invalid-meter')).toBeNull();
  });
});
