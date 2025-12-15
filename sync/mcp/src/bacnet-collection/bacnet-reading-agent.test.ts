/**
 * Property-based tests for BACnetMeterReadingAgent
 * 
 * Tests verify:
 * - Property 1: Scheduled Execution Consistency
 * - Property 2: Non-Overlapping Cycles
 * - Property 3: Graceful Shutdown
 * - Property 24: Manual Trigger Isolation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BACnetMeterReadingAgent } from './bacnet-reading-agent.js';
import { CollectionCycleResult } from './types.js';

describe('BACnetMeterReadingAgent', () => {
  let mockDatabase: any;
  let mockLogger: any;
  let agent: BACnetMeterReadingAgent;

  beforeEach(() => {
    // Create mock database
    mockDatabase = {
      getMeters: vi.fn().mockResolvedValue([]),
      pool: {
        connect: vi.fn(),
      },
    };

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // Create agent with short interval for testing
    agent = new BACnetMeterReadingAgent(
      {
        database: mockDatabase,
        collectionIntervalSeconds: 1,
        enableAutoStart: false,
        connectionTimeoutMs: 1000,
        readTimeoutMs: 500,
      },
      mockLogger
    );
  });

  afterEach(async () => {
    // Clean up agent
    if (agent) {
      try {
        await agent.stop();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  });

  describe('Property 1: Scheduled Execution Consistency', () => {
    it(
      'should execute collection cycles at scheduled intervals without blocking subsequent cycles',
      { timeout: 10000 },
      async () => {
        // **Feature: bacnet-meter-reading-agent, Property 1: Scheduled Execution Consistency**
        // **Validates: Requirements 1.1, 1.2**

        // Track cycle executions
        const cycleExecutions: number[] = [];
        
        vi.spyOn(agent as any, 'executeCycleInternal').mockImplementation(async () => {
          cycleExecutions.push(Date.now());
          return {
            cycleId: `cycle-${cycleExecutions.length}`,
            startTime: new Date(),
            endTime: new Date(),
            metersProcessed: 0,
            readingsCollected: 0,
            errors: [],
            success: true,
          } as CollectionCycleResult;
        });

        // Start agent
        await agent.start();

        // Wait for multiple cycles to execute
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Stop agent
        await agent.stop();

        // Verify that multiple cycles executed
        expect(cycleExecutions.length).toBeGreaterThanOrEqual(2);

        // Verify cycles are not overlapping (executed sequentially)
        for (let i = 1; i < cycleExecutions.length; i++) {
          const timeBetweenCycles = cycleExecutions[i] - cycleExecutions[i - 1];
          // Should be approximately 1 second apart (with some tolerance)
          expect(timeBetweenCycles).toBeGreaterThanOrEqual(900);
          expect(timeBetweenCycles).toBeLessThan(2000);
        }
      }
    );
  });

  describe('Property 2: Non-Overlapping Cycles', () => {
    it(
      'should prevent overlapping execution of concurrent collection cycles',
      { timeout: 10000 },
      async () => {
        // **Feature: bacnet-meter-reading-agent, Property 2: Non-Overlapping Cycles**
        // **Validates: Requirements 1.3**

        let cycleExecutionCount = 0;
        const cycleStartTimes: number[] = [];
        const cycleEndTimes: number[] = [];

        // Mock the cycle manager to track execution
        vi.spyOn(agent['cycleManager'], 'executeCycle').mockImplementation(async () => {
          cycleExecutionCount++;
          cycleStartTimes.push(Date.now());

          // Simulate a long-running cycle
          await new Promise(resolve => setTimeout(resolve, 1500));

          cycleEndTimes.push(Date.now());

          return {
            cycleId: `cycle-${cycleExecutionCount}`,
            startTime: new Date(),
            endTime: new Date(),
            metersProcessed: 0,
            readingsCollected: 0,
            errors: [],
            success: true,
          } as CollectionCycleResult;
        });

        // Start agent with 1-second interval
        await agent.start();

        // Wait for multiple cycles
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Stop agent
        await agent.stop();

        // Verify that cycles did not overlap
        // Each cycle should complete before the next one starts
        for (let i = 1; i < cycleStartTimes.length; i++) {
          const previousCycleEnd = cycleEndTimes[i - 1];
          const currentCycleStart = cycleStartTimes[i];

          // Current cycle should start after previous cycle ended (with small tolerance for timing)
          expect(currentCycleStart).toBeGreaterThanOrEqual(previousCycleEnd - 100);
        }
      }
    );
  });

  describe('Property 3: Graceful Shutdown', () => {
    it(
      'should stop the scheduled task and close connections without throwing unhandled exceptions',
      { timeout: 10000 },
      async () => {
        // **Feature: bacnet-meter-reading-agent, Property 3: Graceful Shutdown**
        // **Validates: Requirements 1.4**

        // Start agent
        await agent.start();

        // Verify agent is running
        expect(agent.getStatus().isRunning).toBe(true);

        // Stop agent - should not throw
        let shutdownError: Error | null = null;
        try {
          await agent.stop();
        } catch (error) {
          shutdownError = error as Error;
        }

        // Verify no error occurred
        expect(shutdownError).toBeNull();

        // Verify agent is no longer running
        expect(agent.getStatus().isRunning).toBe(false);

        // Verify cron job is stopped (no more cycles should execute)
        const statusBefore = agent.getStatus().totalCyclesExecuted;
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusAfter = agent.getStatus().totalCyclesExecuted;

        // Cycle count should not increase after stop
        expect(statusAfter).toBe(statusBefore);
      }
    );
  });

  describe('Property 24: Manual Trigger Isolation', () => {
    it(
      'should prevent manual trigger from starting concurrent cycle when one is already executing',
      { timeout: 10000 },
      async () => {
        // **Feature: bacnet-meter-reading-agent, Property 24: Manual Trigger Isolation**
        // **Validates: Requirements 8.3**

        let concurrentExecutions = 0;
        let maxConcurrentExecutions = 0;
        let currentExecutions = 0;

        vi.spyOn(agent['cycleManager'], 'executeCycle').mockImplementation(async () => {
          currentExecutions++;
          concurrentExecutions++;
          maxConcurrentExecutions = Math.max(maxConcurrentExecutions, currentExecutions);

          // Simulate a long-running cycle
          await new Promise(resolve => setTimeout(resolve, 1000));

          currentExecutions--;

          return {
            cycleId: `cycle-${concurrentExecutions}`,
            startTime: new Date(),
            endTime: new Date(),
            metersProcessed: 0,
            readingsCollected: 0,
            errors: [],
            success: true,
          } as CollectionCycleResult;
        });

        // Start agent
        await agent.start();

        // Wait a bit for initial cycle
        await new Promise(resolve => setTimeout(resolve, 500));

        // Try to manually trigger while a cycle might be executing
        let triggerError: Error | null = null;
        try {
          await agent.triggerCollection();
        } catch (error) {
          // Expected if cycle is already executing
          triggerError = error as Error;
        }

        // Stop agent
        await agent.stop();

        // Verify that either:
        // 1. The trigger was blocked (error thrown), OR
        // 2. At most one cycle was executing at a time
        if (triggerError) {
          expect(triggerError.message).toContain('already executing');
        } else {
          expect(maxConcurrentExecutions).toBeLessThanOrEqual(1);
        }
      }
    );
  });

  describe('Agent Status Tracking', () => {
    it('should track total cycles executed, readings collected, and errors', { timeout: 10000 }, async () => {
      // **Feature: bacnet-meter-reading-agent, Property 22: Running Metrics Tracking**
      // **Validates: Requirements 7.4**

      const cycleResults: CollectionCycleResult[] = [];

      vi.spyOn(agent['cycleManager'], 'executeCycle').mockImplementation(async () => {
        const result: CollectionCycleResult = {
          cycleId: `cycle-${cycleResults.length + 1}`,
          startTime: new Date(),
          endTime: new Date(),
          metersProcessed: 2,
          readingsCollected: 10,
          errors: [],
          success: true,
        };
        cycleResults.push(result);
        return result;
      });

      // Start agent
      await agent.start();

      // Wait for cycles to execute
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Stop agent
      await agent.stop();

      // Get status
      const status = agent.getStatus();

      // Verify metrics are tracked
      expect(status.totalCyclesExecuted).toBeGreaterThanOrEqual(1);
      expect(status.totalReadingsCollected).toBeGreaterThanOrEqual(10);
      expect(status.isRunning).toBe(false);
    });
  });

  describe('Agent Lifecycle', () => {
    it('should handle start/stop lifecycle correctly', async () => {
      // Verify initial state
      expect(agent.getStatus().isRunning).toBe(false);

      // Start agent
      await agent.start();
      expect(agent.getStatus().isRunning).toBe(true);

      // Stop agent
      await agent.stop();
      expect(agent.getStatus().isRunning).toBe(false);

      // Should be able to start again
      await agent.start();
      expect(agent.getStatus().isRunning).toBe(true);

      // Clean up
      await agent.stop();
    });

    it('should not allow starting an already running agent', async () => {
      await agent.start();

      // Try to start again - should log warning but not throw
      await agent.start();

      expect(mockLogger.warn).toHaveBeenCalledWith('Agent is already running');

      await agent.stop();
    });

    it('should not allow stopping a non-running agent', async () => {
      // Try to stop without starting - should log warning but not throw
      await agent.stop();

      expect(mockLogger.warn).toHaveBeenCalledWith('Agent is not running');
    });
  });

  describe('Manual Trigger', () => {
    it('should throw error when triggering collection on non-running agent', async () => {
      // Agent is not running
      expect(agent.getStatus().isRunning).toBe(false);

      // Try to trigger - should throw
      await expect(agent.triggerCollection()).rejects.toThrow('Agent is not running');
    });

    it('should execute collection cycle when triggered manually', { timeout: 10000 }, async () => {
      let cycleExecuted = false;

      vi.spyOn(agent['cycleManager'], 'executeCycle').mockImplementation(async () => {
        cycleExecuted = true;
        return {
          cycleId: 'manual-cycle',
          startTime: new Date(),
          endTime: new Date(),
          metersProcessed: 0,
          readingsCollected: 0,
          errors: [],
          success: true,
        } as CollectionCycleResult;
      });

      // Start agent
      await agent.start();

      // Wait for initial cycle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reset flag
      cycleExecuted = false;

      // Manually trigger
      const result = await agent.triggerCollection();

      // Verify cycle executed
      expect(cycleExecuted).toBe(true);
      expect(result.cycleId).toBe('manual-cycle');

      await agent.stop();
    });
  });
});
