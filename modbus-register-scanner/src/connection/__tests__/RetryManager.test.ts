import { RetryManager } from '../RetryManager';

describe('RetryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager({
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(mockOperation, 'test operation');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(mockOperation, 'test operation');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries exceeded', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(
        retryManager.executeWithRetry(mockOperation, 'test operation')
      ).rejects.toThrow('test operation failed after 4 attempts: Persistent failure');
      
      expect(mockOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should implement exponential backoff timing', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryManager.executeWithRetry(mockOperation, 'test operation');
      const endTime = Date.now();
      
      // Should have waited at least 100ms (first retry) + 200ms (second retry) = 300ms
      // Allow some tolerance for test execution time
      expect(endTime - startTime).toBeGreaterThan(250);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should respect maximum delay cap', async () => {
      const retryManagerWithLowCap = new RetryManager({
        maxRetries: 5,
        baseDelayMs: 100,
        maxDelayMs: 150 // Low cap to test limiting
      });

      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockRejectedValueOnce(new Error('Failure 3'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryManagerWithLowCap.executeWithRetry(mockOperation, 'test operation');
      const endTime = Date.now();
      
      // With exponential backoff: 100ms, 150ms (capped), 150ms (capped)
      // Total should be around 400ms, not 700ms (100 + 200 + 400)
      expect(endTime - startTime).toBeLessThan(500);
      expect(endTime - startTime).toBeGreaterThan(350);
    });
  });

  describe('configuration management', () => {
    it('should return current configuration', () => {
      const config = retryManager.getConfig();
      
      expect(config).toEqual({
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000
      });
    });

    it('should update configuration', () => {
      retryManager.updateConfig({ maxRetries: 5, baseDelayMs: 200 });
      
      const config = retryManager.getConfig();
      expect(config.maxRetries).toBe(5);
      expect(config.baseDelayMs).toBe(200);
      expect(config.maxDelayMs).toBe(1000); // Should remain unchanged
    });
  });
});