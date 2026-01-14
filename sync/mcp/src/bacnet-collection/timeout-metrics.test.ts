import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollectionCycleManager } from './collection-cycle-manager';
import { DeviceRegisterCache } from '../cache/index.js';
import { TimeoutMetrics } from './types.js';

describe('Timeout Metrics Collection', () => {
  let manager: CollectionCycleManager;
  let mockDeviceRegisterCache: any;
  let mockLogger: any;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // Create mock device register cache
    mockDeviceRegisterCache = {
      getDeviceRegisters: vi.fn(),
    };

    manager = new CollectionCycleManager(mockDeviceRegisterCache, mockLogger);
  });

  describe('Property 7: Timeout Metrics Recording', () => {
    it('should include timeout metrics in collection cycle result', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockMeterCache = {
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1' },
        ]),
        clear: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      // Mock the reading batcher
      vi.doMock('./reading-batcher.js', () => ({
        ReadingBatcher: class {
          addReading() {}
          getPendingCount() {
            return 0;
          }
          flushBatch() {
            return Promise.resolve(0);
          }
        },
      }));

      const result = await manager.executeCycle(
        mockMeterCache,
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify timeout metrics are included in result
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.totalTimeouts).toBeGreaterThanOrEqual(0);
      expect(result.timeoutMetrics?.timeoutsByMeter).toBeDefined();
      expect(result.timeoutMetrics?.averageTimeoutRecoveryMs).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.timeoutMetrics?.timeoutEvents)).toBe(true);
    });

    it('should track timeout events per meter', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockMeterCache = {
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1' },
          { meter_id: 2, device_id: 11, ip: '192.168.1.2', port: 47808, name: 'Meter 2' },
        ]),
        clear: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      // Mock the reading batcher
      vi.doMock('./reading-batcher.js', () => ({
        ReadingBatcher: class {
          addReading() {}
          getPendingCount() {
            return 0;
          }
          flushBatch() {
            return Promise.resolve(0);
          }
        },
      }));

      const result = await manager.executeCycle(
        mockMeterCache,
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify timeout metrics track each meter
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.timeoutsByMeter).toBeDefined();
      expect(result.timeoutMetrics?.timeoutsByMeter['1']).toBeGreaterThan(0);
      expect(result.timeoutMetrics?.timeoutsByMeter['2']).toBeGreaterThan(0);
    });

    it('should calculate average timeout recovery time', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockMeterCache = {
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1' },
        ]),
        clear: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      // Mock the reading batcher
      vi.doMock('./reading-batcher.js', () => ({
        ReadingBatcher: class {
          addReading() {}
          getPendingCount() {
            return 0;
          }
          flushBatch() {
            return Promise.resolve(0);
          }
        },
      }));

      const result = await manager.executeCycle(
        mockMeterCache,
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify average timeout recovery time is calculated
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.averageTimeoutRecoveryMs).toBeGreaterThanOrEqual(0);
      expect(result.timeoutMetrics?.averageTimeoutRecoveryMs).toBeLessThanOrEqual(5000);
    });

    it('should record last timeout time', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockMeterCache = {
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1' },
        ]),
        clear: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      // Mock the reading batcher
      vi.doMock('./reading-batcher.js', () => ({
        ReadingBatcher: class {
          addReading() {}
          getPendingCount() {
            return 0;
          }
          flushBatch() {
            return Promise.resolve(0);
          }
        },
      }));

      const beforeTime = new Date();

      const result = await manager.executeCycle(
        mockMeterCache,
        mockBACnetClient,
        mockDatabase,
        5000
      );

      const afterTime = new Date();

      // Verify last timeout time is recorded
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.lastTimeoutTime).toBeDefined();

      if (result.timeoutMetrics?.lastTimeoutTime) {
        expect(result.timeoutMetrics.lastTimeoutTime.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
        expect(result.timeoutMetrics.lastTimeoutTime.getTime()).toBeLessThanOrEqual(
          afterTime.getTime()
        );
      }
    });

    it('should include timeout events in metrics', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockMeterCache = {
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1' },
        ]),
        clear: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      // Mock the reading batcher
      vi.doMock('./reading-batcher.js', () => ({
        ReadingBatcher: class {
          addReading() {}
          getPendingCount() {
            return 0;
          }
          flushBatch() {
            return Promise.resolve(0);
          }
        },
      }));

      const result = await manager.executeCycle(
        mockMeterCache,
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify timeout events are included
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.timeoutEvents).toBeDefined();
      expect(Array.isArray(result.timeoutMetrics?.timeoutEvents)).toBe(true);

      if (result.timeoutMetrics?.timeoutEvents && result.timeoutMetrics.timeoutEvents.length > 0) {
        const event = result.timeoutMetrics.timeoutEvents[0];
        expect(event.meterId).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.registerCount).toBeGreaterThanOrEqual(0);
        expect(event.batchSize).toBeGreaterThanOrEqual(0);
        expect(event.timeoutMs).toBeGreaterThan(0);
        expect(['sequential', 'reduced_batch', 'offline']).toContain(event.recoveryMethod);
        expect(typeof event.success).toBe('boolean');
      }
    });

    it('should record offline timeout events', async () => {
      // Feature: bacnet-batch-read-timeout-fix, Property 7: Timeout Metrics Recording
      // Validates: Requirements 4.1, 4.2, 4.3

      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockMeterCache = {
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1' },
        ]),
        clear: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      // Mock the reading batcher
      vi.doMock('./reading-batcher.js', () => ({
        ReadingBatcher: class {
          addReading() {}
          getPendingCount() {
            return 0;
          }
          flushBatch() {
            return Promise.resolve(0);
          }
        },
      }));

      const result = await manager.executeCycle(
        mockMeterCache,
        mockBACnetClient,
        mockDatabase,
        5000
      );

      // Verify offline timeout events are recorded
      expect(result.timeoutMetrics).toBeDefined();
      expect(result.timeoutMetrics?.timeoutEvents).toBeDefined();

      const offlineEvents = result.timeoutMetrics?.timeoutEvents?.filter(
        (e) => e.recoveryMethod === 'offline'
      );
      expect(offlineEvents?.length).toBeGreaterThan(0);

      if (offlineEvents && offlineEvents.length > 0) {
        const event = offlineEvents[0];
        expect(event.success).toBe(false);
        expect(event.registerCount).toBe(0);
        expect(event.batchSize).toBe(0);
      }
    });
  });

  describe('Timeout Metrics Accumulation', () => {
    it('should clear timeout events between cycles', async () => {
      const mockBACnetClient = {
        checkConnectivity: vi.fn().mockResolvedValue(false),
        readPropertyMultiple: vi.fn(),
      } as any;

      const mockMeterCache = {
        isValid: vi.fn().mockReturnValue(true),
        getMeters: vi.fn().mockReturnValue([
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1' },
        ]),
        clear: vi.fn(),
      } as any;

      const mockDatabase = {};

      mockDeviceRegisterCache.getDeviceRegisters.mockReturnValue([
        { register_id: 1, register: 0, field_name: 'power_a', unit: 'W' },
      ]);

      // Mock the reading batcher
      vi.doMock('./reading-batcher.js', () => ({
        ReadingBatcher: class {
          addReading() {}
          getPendingCount() {
            return 0;
          }
          flushBatch() {
            return Promise.resolve(0);
          }
        },
      }));

      // Execute first cycle
      const result1 = await manager.executeCycle(
        mockMeterCache,
        mockBACnetClient,
        mockDatabase,
        5000
      );

      const firstCycleTimeouts = result1.timeoutMetrics?.totalTimeouts || 0;

      // Reset mocks for second cycle
      mockMeterCache.getMeters.mockReturnValue([
        { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 47808, name: 'Meter 1' },
      ]);

      // Execute second cycle
      const result2 = await manager.executeCycle(
        mockMeterCache,
        mockBACnetClient,
        mockDatabase,
        5000
      );

      const secondCycleTimeouts = result2.timeoutMetrics?.totalTimeouts || 0;

      // Second cycle should have same number of timeouts (not accumulated)
      expect(secondCycleTimeouts).toBe(firstCycleTimeouts);
    });
  });
});
