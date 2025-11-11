import { NetworkOptimizer } from '../../performance/NetworkOptimizer';

describe('NetworkOptimizer Performance Tests', () => {
  let networkOptimizer: NetworkOptimizer;

  beforeEach(() => {
    networkOptimizer = new NetworkOptimizer({
      maxConcurrentRequests: 1,
      requestDelay: 5, // Reduced for testing
      adaptiveDelay: true,
      requestTimeout: 1000
    });
  });

  afterEach(() => {
    networkOptimizer.clearQueue();
  });

  /**
   * Create a mock network request function
   */
  function createMockRequest(delay: number = 10, shouldFail: boolean = false) {
    return async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (shouldFail) {
        throw new Error('Mock network error');
      }
      return { success: true, data: Math.random() };
    };
  }

  test('should handle high-throughput request patterns efficiently', async () => {
    const startTime = Date.now();
    const requestCount = 100;
    const requests: Promise<any>[] = [];

    // Submit many requests concurrently
    for (let i = 0; i < requestCount; i++) {
      const request = networkOptimizer.executeRequest(
        createMockRequest(Math.random() * 20 + 5), // 5-25ms delay
        0, // Default priority
        100 // Estimated bytes
      );
      requests.push(request);
    }

    // Wait for all requests to complete
    const results = await Promise.allSettled(requests);
    const endTime = Date.now();

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    const totalTime = endTime - startTime;
    const throughput = requestCount / (totalTime / 1000);

    const stats = networkOptimizer.getStats();
    const performance = networkOptimizer.getPerformanceSummary();

    console.log(`High-Throughput Test Results:`);
    console.log(`- Processed ${requestCount} requests in ${totalTime}ms`);
    console.log(`- Throughput: ${throughput.toFixed(2)} requests/second`);
    console.log(`- Success rate: ${(successCount / requestCount * 100).toFixed(1)}%`);
    console.log(`- Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`- Current adaptive delay: ${performance.currentDelay}ms`);

    // Performance assertions
    expect(successCount).toBe(requestCount);
    expect(failureCount).toBe(0);
    expect(throughput).toBeGreaterThan(10); // Should achieve reasonable throughput
    expect(stats.averageResponseTime).toBeLessThan(100); // Should maintain low latency
  });

  test('should adapt delay based on network conditions', async () => {
    const initialDelay = networkOptimizer.getConfig().requestDelay;
    
    // Phase 1: Fast requests (should decrease delay)
    console.log('Phase 1: Fast network conditions');
    for (let i = 0; i < 20; i++) {
      await networkOptimizer.executeRequest(createMockRequest(5), 0, 50);
    }
    
    const fastConditionStats = networkOptimizer.getPerformanceSummary();
    console.log(`- Adaptive delay after fast requests: ${fastConditionStats.currentDelay}ms`);

    // Phase 2: Slow requests (should increase delay)
    console.log('Phase 2: Slow network conditions');
    for (let i = 0; i < 20; i++) {
      await networkOptimizer.executeRequest(createMockRequest(100), 0, 50);
    }
    
    const slowConditionStats = networkOptimizer.getPerformanceSummary();
    console.log(`- Adaptive delay after slow requests: ${slowConditionStats.currentDelay}ms`);

    // Phase 3: Error conditions (should increase delay significantly)
    console.log('Phase 3: Error conditions');
    for (let i = 0; i < 10; i++) {
      try {
        await networkOptimizer.executeRequest(createMockRequest(50, true), 0, 50);
      } catch (error) {
        // Expected errors
      }
    }
    
    const errorConditionStats = networkOptimizer.getPerformanceSummary();
    console.log(`- Adaptive delay after errors: ${errorConditionStats.currentDelay}ms`);

    // Adaptive behavior assertions
    expect(slowConditionStats.currentDelay).toBeGreaterThanOrEqual(fastConditionStats.currentDelay);
    expect(errorConditionStats.currentDelay).toBeGreaterThan(slowConditionStats.currentDelay);
  });

  test('should maintain performance under sustained load', async () => {
    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    let requestCount = 0;
    let completedCount = 0;
    const performanceReadings: any[] = [];

    // Monitor performance during sustained load
    const performanceMonitor = setInterval(() => {
      const stats = networkOptimizer.getPerformanceSummary();
      performanceReadings.push({
        timestamp: Date.now() - startTime,
        throughput: stats.requestsPerSecond,
        avgResponseTime: stats.averageResponseTime,
        queueLength: stats.queueLength,
        errorRate: stats.errorRate
      });
    }, 200);

    try {
      // Generate sustained load
      const loadGenerator = setInterval(async () => {
        if (Date.now() - startTime < duration) {
          requestCount++;
          networkOptimizer.executeRequest(
            createMockRequest(Math.random() * 30 + 10),
            0,
            100
          ).then(() => {
            completedCount++;
          }).catch(() => {
            completedCount++;
          });
        }
      }, 50); // Submit request every 50ms

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, duration + 500));
      clearInterval(loadGenerator);

    } finally {
      clearInterval(performanceMonitor);
    }

    // Analyze performance over time
    const avgThroughput = performanceReadings.reduce((sum, reading) => sum + reading.throughput, 0) / performanceReadings.length;
    const maxQueueLength = Math.max(...performanceReadings.map(r => r.queueLength));
    const avgResponseTime = performanceReadings.reduce((sum, reading) => sum + reading.avgResponseTime, 0) / performanceReadings.length;

    console.log(`Sustained Load Test Results:`);
    console.log(`- Submitted ${requestCount} requests over ${duration}ms`);
    console.log(`- Completed ${completedCount} requests`);
    console.log(`- Average throughput: ${avgThroughput.toFixed(2)} requests/second`);
    console.log(`- Maximum queue length: ${maxQueueLength}`);
    console.log(`- Average response time: ${avgResponseTime.toFixed(2)}ms`);

    // Performance stability assertions
    expect(completedCount).toBeGreaterThan(requestCount * 0.8); // At least 80% completion
    expect(maxQueueLength).toBeLessThan(50); // Queue should not grow excessively
    expect(avgResponseTime).toBeLessThan(200); // Should maintain reasonable response times
  });

  test('should handle batch operations efficiently', async () => {
    const batchSize = 20;
    const batchCount = 5;
    
    // Create batch requests
    const batchRequests: Array<() => Promise<any>> = [];
    for (let i = 0; i < batchSize; i++) {
      batchRequests.push(createMockRequest(Math.random() * 20 + 5));
    }

    const startTime = Date.now();
    const results: any[] = [];

    // Execute multiple batches
    for (let batch = 0; batch < batchCount; batch++) {
      const batchResults = await networkOptimizer.executeBatchOptimized(batchRequests, 5);
      results.push(...batchResults);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const totalRequests = batchSize * batchCount;
    const throughput = totalRequests / (totalTime / 1000);

    const stats = networkOptimizer.getStats();

    console.log(`Batch Operations Test Results:`);
    console.log(`- Executed ${batchCount} batches of ${batchSize} requests`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Batch throughput: ${throughput.toFixed(2)} requests/second`);
    console.log(`- Success rate: ${(results.length / totalRequests * 100).toFixed(1)}%`);
    console.log(`- Network efficiency: ${stats.bytesPerSecond.toFixed(0)} bytes/second`);

    // Batch efficiency assertions
    expect(results.length).toBe(totalRequests);
    expect(throughput).toBeGreaterThan(15); // Batching should improve throughput
    expect(stats.errorRate).toBeLessThan(0.1); // Low error rate
  });

  test('should provide accurate performance metrics', async () => {
    // Execute a known pattern of requests
    const fastRequests = 10;
    const slowRequests = 5;
    const errorRequests = 2;

    // Fast requests
    for (let i = 0; i < fastRequests; i++) {
      await networkOptimizer.executeRequest(createMockRequest(10), 0, 100);
    }

    // Slow requests
    for (let i = 0; i < slowRequests; i++) {
      await networkOptimizer.executeRequest(createMockRequest(100), 0, 200);
    }

    // Error requests
    for (let i = 0; i < errorRequests; i++) {
      try {
        await networkOptimizer.executeRequest(createMockRequest(50, true), 0, 150);
      } catch (error) {
        // Expected
      }
    }

    const stats = networkOptimizer.getStats();
    const performance = networkOptimizer.getPerformanceSummary();

    console.log(`Performance Metrics Test:`);
    console.log(`- Total requests: ${stats.totalRequests}`);
    console.log(`- Successful requests: ${stats.successfulRequests}`);
    console.log(`- Failed requests: ${stats.failedRequests}`);
    console.log(`- Error rate: ${(stats.errorRate * 100).toFixed(1)}%`);
    console.log(`- Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`- P95 response time: ${performance.p95ResponseTime}ms`);
    console.log(`- P99 response time: ${performance.p99ResponseTime}ms`);

    // Metrics accuracy assertions
    expect(stats.totalRequests).toBe(fastRequests + slowRequests + errorRequests);
    expect(stats.successfulRequests).toBe(fastRequests + slowRequests);
    expect(stats.failedRequests).toBe(errorRequests);
    expect(stats.errorRate).toBeCloseTo(errorRequests / (fastRequests + slowRequests + errorRequests), 2);
    expect(stats.averageResponseTime).toBeGreaterThan(10); // Should reflect mixed request times
    expect(performance.p95ResponseTime).toBeGreaterThan(stats.averageResponseTime);
  });

  test('should generate meaningful optimization recommendations', () => {
    // Test different network scenarios
    const scenarios = [
      { name: 'High Error Rate', setup: async () => {
        for (let i = 0; i < 10; i++) {
          try {
            await networkOptimizer.executeRequest(createMockRequest(20, i < 5), 0, 100);
          } catch (error) {
            // Expected
          }
        }
      }},
      { name: 'Slow Response Times', setup: async () => {
        for (let i = 0; i < 10; i++) {
          await networkOptimizer.executeRequest(createMockRequest(200), 0, 100);
        }
      }},
      { name: 'Good Performance', setup: async () => {
        for (let i = 0; i < 10; i++) {
          await networkOptimizer.executeRequest(createMockRequest(10), 0, 100);
        }
      }}
    ];

    scenarios.forEach(async scenario => {
      // Reset optimizer for each scenario
      const testOptimizer = new NetworkOptimizer({
        maxConcurrentRequests: 1,
        requestDelay: 10,
        adaptiveDelay: true
      });

      await scenario.setup();
      const recommendations = testOptimizer.getOptimizationRecommendations();
      
      console.log(`${scenario.name} Recommendations:`, recommendations);
      
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      
      testOptimizer.clearQueue();
    });
  });
});