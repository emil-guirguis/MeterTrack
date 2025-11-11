import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { BatchOptimizer, RegisterBatch, BatchReadResult } from '../BatchOptimizer';
import { RegisterReader } from '../../reader/RegisterReader';
import { RegisterInfo } from '../../types';
import ModbusRTU from 'modbus-serial';

// Mock the RegisterReader
jest.mock('../../reader/RegisterReader');

describe('BatchOptimizer', () => {
  let batchOptimizer: BatchOptimizer;
  let mockRegisterReader: jest.Mocked<RegisterReader>;
  let mockClient: jest.Mocked<ModbusRTU>;

  beforeEach(() => {
    mockClient = new ModbusRTU() as jest.Mocked<ModbusRTU>;
    mockRegisterReader = new RegisterReader(mockClient, 1) as jest.Mocked<RegisterReader>;
    
    // Mock the RegisterReader methods
    mockRegisterReader.readMultipleRegisters = jest.fn();
    mockRegisterReader.readSingleRegister = jest.fn();
    
    batchOptimizer = new BatchOptimizer(mockRegisterReader, 125);
  });

  describe('Constructor', () => {
    it('should create BatchOptimizer with default max batch size', () => {
      const optimizer = new BatchOptimizer(mockRegisterReader);
      expect(optimizer.getMaxBatchSize()).toBe(125);
    });

    it('should create BatchOptimizer with custom max batch size', () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 50);
      expect(optimizer.getMaxBatchSize()).toBe(50);
    });

    it('should enforce maximum batch size limit of 125', () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 200);
      expect(optimizer.getMaxBatchSize()).toBe(125);
    });
  });

  describe('createBatches', () => {
    it('should return empty array for empty addresses', () => {
      const batches = batchOptimizer.createBatches([], 3);
      expect(batches).toEqual([]);
    });

    it('should create single batch for consecutive addresses', () => {
      const addresses = [100, 101, 102, 103, 104];
      const batches = batchOptimizer.createBatches(addresses, 3);
      
      expect(batches).toHaveLength(1);
      expect(batches[0]).toEqual({
        startAddress: 100,
        count: 5,
        functionCode: 3
      });
    });

    it('should create multiple batches for non-consecutive addresses', () => {
      const addresses = [100, 101, 102, 105, 106, 110];
      const batches = batchOptimizer.createBatches(addresses, 3);
      
      expect(batches).toHaveLength(3);
      expect(batches[0]).toEqual({
        startAddress: 100,
        count: 3,
        functionCode: 3
      });
      expect(batches[1]).toEqual({
        startAddress: 105,
        count: 2,
        functionCode: 3
      });
      expect(batches[2]).toEqual({
        startAddress: 110,
        count: 1,
        functionCode: 3
      });
    });

    it('should respect maximum batch size limit', () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 3);
      const addresses = [100, 101, 102, 103, 104, 105];
      const batches = optimizer.createBatches(addresses, 3);
      
      expect(batches).toHaveLength(2);
      expect(batches[0]).toEqual({
        startAddress: 100,
        count: 3,
        functionCode: 3
      });
      expect(batches[1]).toEqual({
        startAddress: 103,
        count: 3,
        functionCode: 3
      });
    });

    it('should sort addresses before creating batches', () => {
      const addresses = [105, 100, 102, 101, 103];
      const batches = batchOptimizer.createBatches(addresses, 3);
      
      expect(batches).toHaveLength(2);
      expect(batches[0]).toEqual({
        startAddress: 100,
        count: 4,
        functionCode: 3
      });
      expect(batches[1]).toEqual({
        startAddress: 105,
        count: 1,
        functionCode: 3
      });
    });
  });

  describe('executeBatch', () => {
    const createMockRegisterInfo = (address: number, functionCode: number, accessible: boolean = true): RegisterInfo => ({
      address,
      functionCode,
      dataType: functionCode === 3 ? 'holding' : 'input',
      value: accessible ? 1000 + address : 0,
      accessible,
      timestamp: new Date()
    });

    it('should execute successful batch read', async () => {
      const batch: RegisterBatch = {
        startAddress: 100,
        count: 3,
        functionCode: 3
      };

      const mockRegisters = [
        createMockRegisterInfo(100, 3),
        createMockRegisterInfo(101, 3),
        createMockRegisterInfo(102, 3)
      ];

      mockRegisterReader.readMultipleRegisters.mockResolvedValue(mockRegisters);

      const result = await batchOptimizer.executeBatch(batch);

      expect(result.success).toBe(true);
      expect(result.registers).toEqual(mockRegisters);
      expect(result.error).toBeUndefined();
      expect(mockRegisterReader.readMultipleRegisters).toHaveBeenCalledWith(100, 3, 3);
    });

    it('should fall back to individual reads when batch partially fails', async () => {
      const batch: RegisterBatch = {
        startAddress: 100,
        count: 3,
        functionCode: 3
      };

      const mockBatchRegisters = [
        createMockRegisterInfo(100, 3, true),
        createMockRegisterInfo(101, 3, false), // This one failed
        createMockRegisterInfo(102, 3, true)
      ];

      const mockIndividualRegisters = [
        createMockRegisterInfo(100, 3),
        createMockRegisterInfo(101, 3),
        createMockRegisterInfo(102, 3)
      ];

      mockRegisterReader.readMultipleRegisters.mockResolvedValue(mockBatchRegisters);
      mockRegisterReader.readSingleRegister
        .mockResolvedValueOnce(mockIndividualRegisters[0])
        .mockResolvedValueOnce(mockIndividualRegisters[1])
        .mockResolvedValueOnce(mockIndividualRegisters[2]);

      const result = await batchOptimizer.executeBatch(batch);

      expect(result.success).toBe(true);
      expect(result.registers).toEqual(mockIndividualRegisters);
      expect(mockRegisterReader.readSingleRegister).toHaveBeenCalledTimes(3);
    });

    it('should fall back to individual reads when batch completely fails', async () => {
      const batch: RegisterBatch = {
        startAddress: 100,
        count: 2,
        functionCode: 3
      };

      const batchError = new Error('Batch read failed');
      const mockIndividualRegisters = [
        createMockRegisterInfo(100, 3),
        createMockRegisterInfo(101, 3)
      ];

      mockRegisterReader.readMultipleRegisters.mockRejectedValue(batchError);
      mockRegisterReader.readSingleRegister
        .mockResolvedValueOnce(mockIndividualRegisters[0])
        .mockResolvedValueOnce(mockIndividualRegisters[1]);

      const result = await batchOptimizer.executeBatch(batch);

      expect(result.success).toBe(true);
      expect(result.registers).toEqual(mockIndividualRegisters);
      expect(result.error).toBe(batchError);
      expect(mockRegisterReader.readSingleRegister).toHaveBeenCalledTimes(2);
    });

    it('should handle individual read failures in fallback', async () => {
      const batch: RegisterBatch = {
        startAddress: 100,
        count: 2,
        functionCode: 3
      };

      const batchError = new Error('Batch read failed');
      const individualError = new Error('Individual read failed');

      mockRegisterReader.readMultipleRegisters.mockRejectedValue(batchError);
      mockRegisterReader.readSingleRegister
        .mockResolvedValueOnce(createMockRegisterInfo(100, 3))
        .mockRejectedValueOnce(individualError);

      const result = await batchOptimizer.executeBatch(batch);

      expect(result.success).toBe(true); // At least one register was accessible
      expect(result.registers).toHaveLength(2);
      expect(result.registers[0].accessible).toBe(true);
      expect(result.registers[1].accessible).toBe(false);
      expect(result.registers[1].error?.message).toContain('Individual read failed');
    });
  });

  describe('readOptimizedBatches', () => {
    it('should return empty array for empty addresses', async () => {
      const result = await batchOptimizer.readOptimizedBatches([], 3);
      expect(result).toEqual([]);
    });

    it('should read multiple batches and return sorted results', async () => {
      const addresses = [100, 101, 105, 106];
      
      const mockRegisters1 = [
        { address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date() },
        { address: 101, functionCode: 3, dataType: 'holding', value: 1101, accessible: true, timestamp: new Date() }
      ];
      
      const mockRegisters2 = [
        { address: 105, functionCode: 3, dataType: 'holding', value: 1105, accessible: true, timestamp: new Date() },
        { address: 106, functionCode: 3, dataType: 'holding', value: 1106, accessible: true, timestamp: new Date() }
      ];

      mockRegisterReader.readMultipleRegisters
        .mockResolvedValueOnce(mockRegisters1)
        .mockResolvedValueOnce(mockRegisters2);

      const result = await batchOptimizer.readOptimizedBatches(addresses, 3);

      expect(result).toHaveLength(4);
      expect(result[0].address).toBe(100);
      expect(result[1].address).toBe(101);
      expect(result[2].address).toBe(105);
      expect(result[3].address).toBe(106);
    });
  });

  describe('Statistics', () => {
    it('should track batch statistics correctly', async () => {
      const batch: RegisterBatch = {
        startAddress: 100,
        count: 3,
        functionCode: 3
      };

      const mockRegisters = [
        { address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date() },
        { address: 101, functionCode: 3, dataType: 'holding', value: 1101, accessible: true, timestamp: new Date() },
        { address: 102, functionCode: 3, dataType: 'holding', value: 1102, accessible: true, timestamp: new Date() }
      ];

      mockRegisterReader.readMultipleRegisters.mockResolvedValue(mockRegisters);

      await batchOptimizer.executeBatch(batch);

      const stats = batchOptimizer.getStats();
      expect(stats.totalBatches).toBe(1);
      expect(stats.successfulBatches).toBe(1);
      expect(stats.failedBatches).toBe(0);
      expect(stats.fallbackReads).toBe(0);
      expect(stats.totalRegisters).toBe(3);
      expect(stats.batchEfficiency).toBe(100);
    });

    it('should track fallback statistics correctly', async () => {
      const batch: RegisterBatch = {
        startAddress: 100,
        count: 2,
        functionCode: 3
      };

      const batchError = new Error('Batch failed');
      const mockIndividualRegisters = [
        { address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date() },
        { address: 101, functionCode: 3, dataType: 'holding', value: 1101, accessible: true, timestamp: new Date() }
      ];

      mockRegisterReader.readMultipleRegisters.mockRejectedValue(batchError);
      mockRegisterReader.readSingleRegister
        .mockResolvedValueOnce(mockIndividualRegisters[0])
        .mockResolvedValueOnce(mockIndividualRegisters[1]);

      await batchOptimizer.executeBatch(batch);

      const stats = batchOptimizer.getStats();
      expect(stats.totalBatches).toBe(1);
      expect(stats.successfulBatches).toBe(0);
      expect(stats.failedBatches).toBe(1);
      expect(stats.fallbackReads).toBe(2);
      expect(stats.totalRegisters).toBe(2);
      expect(stats.batchEfficiency).toBe(0);
    });

    it('should reset statistics correctly', () => {
      batchOptimizer.resetStats();
      const stats = batchOptimizer.getStats();
      
      expect(stats.totalBatches).toBe(0);
      expect(stats.successfulBatches).toBe(0);
      expect(stats.failedBatches).toBe(0);
      expect(stats.fallbackReads).toBe(0);
      expect(stats.totalRegisters).toBe(0);
      expect(stats.batchEfficiency).toBe(0);
    });
  });

  describe('getRecommendedBatchSize', () => {
    it('should return max batch size when no batches executed', () => {
      const recommendedSize = batchOptimizer.getRecommendedBatchSize();
      expect(recommendedSize).toBe(125);
    });

    it('should return max batch size for high success rate', async () => {
      // Simulate high success rate (80%+)
      const batch: RegisterBatch = { startAddress: 100, count: 3, functionCode: 3 };
      const mockRegisters = [
        { address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date() },
        { address: 101, functionCode: 3, dataType: 'holding', value: 1101, accessible: true, timestamp: new Date() },
        { address: 102, functionCode: 3, dataType: 'holding', value: 1102, accessible: true, timestamp: new Date() }
      ];

      mockRegisterReader.readMultipleRegisters.mockResolvedValue(mockRegisters);
      
      // Execute multiple successful batches
      await batchOptimizer.executeBatch(batch);
      await batchOptimizer.executeBatch(batch);
      await batchOptimizer.executeBatch(batch);
      await batchOptimizer.executeBatch(batch);

      const recommendedSize = batchOptimizer.getRecommendedBatchSize();
      expect(recommendedSize).toBe(125);
    });

    it('should return smaller batch size for moderate success rate', async () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 100);
      
      // Simulate moderate success rate (50-80%)
      const batch: RegisterBatch = { startAddress: 100, count: 2, functionCode: 3 };
      const mockRegisters = [
        { address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date() },
        { address: 101, functionCode: 3, dataType: 'holding', value: 1101, accessible: true, timestamp: new Date() }
      ];

      // 1 success, 1 failure = 50% success rate
      mockRegisterReader.readMultipleRegisters
        .mockResolvedValueOnce(mockRegisters)
        .mockRejectedValueOnce(new Error('Batch failed'));
      
      mockRegisterReader.readSingleRegister
        .mockResolvedValue(mockRegisters[0]);

      await optimizer.executeBatch(batch);
      await optimizer.executeBatch(batch);

      const recommendedSize = optimizer.getRecommendedBatchSize();
      expect(recommendedSize).toBe(50); // 50% of max batch size
    });

    it('should return very small batch size for low success rate', async () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 100);
      
      // Simulate low success rate (<50%)
      const batch: RegisterBatch = { startAddress: 100, count: 2, functionCode: 3 };

      // All failures = 0% success rate
      mockRegisterReader.readMultipleRegisters.mockRejectedValue(new Error('Batch failed'));
      mockRegisterReader.readSingleRegister.mockResolvedValue({
        address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date()
      });

      await optimizer.executeBatch(batch);
      await optimizer.executeBatch(batch);
      await optimizer.executeBatch(batch);

      const recommendedSize = optimizer.getRecommendedBatchSize();
      expect(recommendedSize).toBe(10); // Minimum recommended size
    });
  });

  describe('Adaptive Batch Sizing', () => {
    it('should start with maximum adaptive batch size', () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 50);
      expect(optimizer.getCurrentAdaptiveBatchSize()).toBe(50);
    });

    it('should track batch history', async () => {
      const batch: RegisterBatch = { startAddress: 100, count: 3, functionCode: 3 };
      const mockRegisters = [
        { address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date() },
        { address: 101, functionCode: 3, dataType: 'holding', value: 1101, accessible: true, timestamp: new Date() },
        { address: 102, functionCode: 3, dataType: 'holding', value: 1102, accessible: true, timestamp: new Date() }
      ];

      mockRegisterReader.readMultipleRegisters.mockResolvedValue(mockRegisters);
      
      await batchOptimizer.executeBatch(batch);
      
      const history = batchOptimizer.getBatchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].size).toBe(3);
      expect(history[0].success).toBe(true);
    });

    it('should track success rates by batch size', async () => {
      const batch1: RegisterBatch = { startAddress: 100, count: 2, functionCode: 3 };
      const batch2: RegisterBatch = { startAddress: 200, count: 3, functionCode: 3 };
      
      const mockRegisters2 = [
        { address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date() },
        { address: 101, functionCode: 3, dataType: 'holding', value: 1101, accessible: true, timestamp: new Date() }
      ];
      
      const mockRegisters3 = [
        { address: 200, functionCode: 3, dataType: 'holding', value: 1200, accessible: true, timestamp: new Date() },
        { address: 201, functionCode: 3, dataType: 'holding', value: 1201, accessible: true, timestamp: new Date() },
        { address: 202, functionCode: 3, dataType: 'holding', value: 1202, accessible: true, timestamp: new Date() }
      ];

      // Success for size 2, failure for size 3
      mockRegisterReader.readMultipleRegisters
        .mockResolvedValueOnce(mockRegisters2)
        .mockRejectedValueOnce(new Error('Batch failed'));
      
      mockRegisterReader.readSingleRegister
        .mockResolvedValue(mockRegisters3[0]);

      await batchOptimizer.executeBatch(batch1);
      await batchOptimizer.executeBatch(batch2);

      const successRates = batchOptimizer.getSuccessRatesBySize();
      expect(successRates.get(2)).toBe(1.0); // 100% success for size 2
      expect(successRates.get(3)).toBe(0.0); // 0% success for size 3
    });

    it('should adapt batch size based on performance', async () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 20);
      
      // Create batches that will fail to trigger adaptive reduction
      const batch: RegisterBatch = { startAddress: 100, count: 20, functionCode: 3 };

      // Simulate multiple failures to trigger adaptive reduction
      mockRegisterReader.readMultipleRegisters.mockRejectedValue(new Error('Batch failed'));
      mockRegisterReader.readSingleRegister.mockResolvedValue({
        address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date()
      });

      // Execute enough batches to trigger adaptation (need at least 5 for threshold, then 3 more for recent analysis)
      for (let i = 0; i < 8; i++) {
        await optimizer.executeBatch(batch);
      }

      // Check that we have enough batch history
      const history = optimizer.getBatchHistory();
      expect(history.length).toBeGreaterThanOrEqual(5);
      
      // All batches should have failed (success rate = 0%)
      const allFailed = history.every(h => !h.success);
      expect(allFailed).toBe(true);

      // Adaptive batch size should be reduced due to failures (0% success rate should trigger 50% reduction)
      const adaptiveSize = optimizer.getCurrentAdaptiveBatchSize();
      expect(adaptiveSize).toBeLessThan(20);
      expect(adaptiveSize).toBeGreaterThanOrEqual(1); // Should not go below minimum
    });

    it('should reset adaptive batch size', () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 50);
      
      // Manually set a different adaptive size
      optimizer.resetAdaptiveBatchSize();
      
      expect(optimizer.getCurrentAdaptiveBatchSize()).toBe(50);
      expect(optimizer.getBatchHistory()).toHaveLength(0);
    });

    it('should limit batch history size', async () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 10);
      const batch: RegisterBatch = { startAddress: 100, count: 2, functionCode: 3 };
      
      const mockRegisters = [
        { address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date() },
        { address: 101, functionCode: 3, dataType: 'holding', value: 1101, accessible: true, timestamp: new Date() }
      ];

      mockRegisterReader.readMultipleRegisters.mockResolvedValue(mockRegisters);

      // Execute more batches than the history limit (100)
      for (let i = 0; i < 105; i++) {
        await optimizer.executeBatch(batch);
      }

      const history = optimizer.getBatchHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should use adaptive batch size in createBatches', async () => {
      const optimizer = new BatchOptimizer(mockRegisterReader, 20);
      
      // First, reduce the adaptive batch size by simulating failures
      const batch: RegisterBatch = { startAddress: 100, count: 10, functionCode: 3 };
      mockRegisterReader.readMultipleRegisters.mockRejectedValue(new Error('Batch failed'));
      mockRegisterReader.readSingleRegister.mockResolvedValue({
        address: 100, functionCode: 3, dataType: 'holding', value: 1100, accessible: true, timestamp: new Date()
      });

      // Execute enough batches to trigger adaptation
      for (let i = 0; i < 6; i++) {
        await optimizer.executeBatch(batch);
      }

      // Now create batches with a long consecutive sequence
      const addresses = Array.from({ length: 15 }, (_, i) => 1000 + i); // 15 consecutive addresses
      const batches = optimizer.createBatches(addresses, 3);

      // The batches should be smaller due to adaptive sizing
      const maxBatchSize = Math.max(...batches.map(b => b.count));
      expect(maxBatchSize).toBeLessThan(15); // Should be limited by adaptive sizing
    });
  });
});