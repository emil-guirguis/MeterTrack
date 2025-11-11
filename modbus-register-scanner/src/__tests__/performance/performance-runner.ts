#!/usr/bin/env ts-node

/**
 * Performance Test Runner
 * 
 * This script runs performance tests and generates a comprehensive report
 * comparing different optimization strategies and configurations.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceResult {
  testSuite: string;
  testName: string;
  duration: number;
  throughput?: number;
  memoryUsage?: number;
  success: boolean;
  metrics: Record<string, any>;
}

interface PerformanceReport {
  timestamp: Date;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    totalMemory: number;
  };
  results: PerformanceResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageDuration: number;
    totalDuration: number;
  };
  recommendations: string[];
}

class PerformanceTestRunner {
  private results: PerformanceResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Run all performance tests
   */
  public async runAllTests(): Promise<void> {
    console.log('🚀 Starting Performance Test Suite');
    console.log('==================================');

    const testSuites = [
      'MemoryOptimizer.performance.test.ts',
      'NetworkOptimizer.performance.test.ts',
      'ScannerEngine.performance.test.ts',
      'ConfigManager.performance.test.ts'
    ];

    for (const testSuite of testSuites) {
      await this.runTestSuite(testSuite);
    }

    this.generateReport();
  }

  /**
   * Run a specific test suite
   */
  private async runTestSuite(testSuite: string): Promise<void> {
    console.log(`\n📊 Running ${testSuite}...`);
    
    try {
      const testPath = path.join(__dirname, testSuite);
      const startTime = Date.now();
      
      // Run the test suite with Jest
      const command = `npx jest "${testPath}" --verbose --detectOpenHandles --forceExit`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../..'),
        stdio: 'pipe'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Parse test results from Jest output
      const testResults = this.parseJestOutput(output, testSuite);
      this.results.push(...testResults);
      
      console.log(`✅ ${testSuite} completed in ${duration}ms`);
      console.log(`   Tests: ${testResults.length}, Passed: ${testResults.filter(r => r.success).length}`);
      
    } catch (error) {
      console.error(`❌ ${testSuite} failed:`, error instanceof Error ? error.message : 'Unknown error');
      
      // Add failed test result
      this.results.push({
        testSuite,
        testName: 'Suite Execution',
        duration: 0,
        success: false,
        metrics: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  /**
   * Parse Jest output to extract test results
   */
  private parseJestOutput(output: string, testSuite: string): PerformanceResult[] {
    const results: PerformanceResult[] = [];
    const lines = output.split('\n');
    
    let currentTest = '';
    let testDuration = 0;
    
    for (const line of lines) {
      // Extract test names
      if (line.includes('✓') || line.includes('✗')) {
        const testMatch = line.match(/[✓✗]\s+(.+?)\s+\((\d+)\s*ms\)/);
        if (testMatch) {
          currentTest = testMatch[1].trim();
          testDuration = parseInt(testMatch[2]);
          
          results.push({
            testSuite,
            testName: currentTest,
            duration: testDuration,
            success: line.includes('✓'),
            metrics: this.extractMetricsFromOutput(output, currentTest)
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Extract performance metrics from test output
   */
  private extractMetricsFromOutput(output: string, testName: string): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    // Look for common performance metrics in the output
    const metricPatterns = [
      { name: 'throughput', pattern: /(\d+\.?\d*)\s+(?:operations|requests|registers)\/second/g },
      { name: 'memoryUsage', pattern: /(\d+\.?\d*)\s*MB/g },
      { name: 'responseTime', pattern: /(\d+\.?\d*)\s*ms/g },
      { name: 'successRate', pattern: /(\d+\.?\d*)%/g }
    ];
    
    for (const { name, pattern } of metricPatterns) {
      const matches = Array.from(output.matchAll(pattern));
      if (matches.length > 0) {
        metrics[name] = matches.map(match => parseFloat(match[1]));
      }
    }
    
    return metrics;
  }

  /**
   * Generate comprehensive performance report
   */
  private generateReport(): void {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const report: PerformanceReport = {
      timestamp: new Date(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        totalMemory: Math.round(require('os').totalmem() / 1024 / 1024) // MB
      },
      results: this.results,
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter(r => r.success).length,
        failedTests: this.results.filter(r => !r.success).length,
        averageDuration: this.results.length > 0 ? this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length : 0,
        totalDuration
      },
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(__dirname, '../../../performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Display summary
    this.displaySummary(report);
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }

  /**
   * Display performance summary
   */
  private displaySummary(report: PerformanceReport): void {
    console.log('\n📈 Performance Test Summary');
    console.log('===========================');
    console.log(`Environment: Node ${report.environment.nodeVersion} on ${report.environment.platform} (${report.environment.arch})`);
    console.log(`Total Memory: ${report.environment.totalMemory}MB`);
    console.log(`Test Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`Tests: ${report.summary.totalTests} (${report.summary.passedTests} passed, ${report.summary.failedTests} failed)`);
    console.log(`Average Test Duration: ${report.summary.averageDuration.toFixed(2)}ms`);

    // Group results by test suite
    const suiteResults = this.results.reduce((acc, result) => {
      if (!acc[result.testSuite]) {
        acc[result.testSuite] = [];
      }
      acc[result.testSuite].push(result);
      return acc;
    }, {} as Record<string, PerformanceResult[]>);

    console.log('\n📊 Results by Test Suite:');
    Object.entries(suiteResults).forEach(([suite, results]) => {
      const passed = results.filter(r => r.success).length;
      const total = results.length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      console.log(`  ${suite}: ${passed}/${total} passed, avg ${avgDuration.toFixed(2)}ms`);
    });

    // Show top performing tests
    const topPerformers = this.results
      .filter(r => r.success && r.duration > 0)
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 5);

    if (topPerformers.length > 0) {
      console.log('\n⚡ Fastest Tests:');
      topPerformers.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.testName}: ${result.duration}ms`);
      });
    }

    // Show slowest tests
    const slowTests = this.results
      .filter(r => r.success && r.duration > 0)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    if (slowTests.length > 0) {
      console.log('\n🐌 Slowest Tests:');
      slowTests.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.testName}: ${result.duration}ms`);
      });
    }

    // Show recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Performance Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }

  /**
   * Generate performance recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze test durations
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const slowTests = this.results.filter(r => r.duration > avgDuration * 2);
    
    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length} tests are significantly slower than average. Consider optimizing these test scenarios.`);
    }

    // Analyze failure rate
    const failureRate = this.results.filter(r => !r.success).length / this.results.length;
    if (failureRate > 0.1) {
      recommendations.push(`High test failure rate (${(failureRate * 100).toFixed(1)}%). Review failing tests for performance issues.`);
    }

    // Analyze memory usage patterns
    const memoryTests = this.results.filter(r => r.metrics.memoryUsage);
    if (memoryTests.length > 0) {
      const avgMemory = memoryTests.reduce((sum, r) => {
        const memory = Array.isArray(r.metrics.memoryUsage) ? r.metrics.memoryUsage[0] : r.metrics.memoryUsage;
        return sum + (memory || 0);
      }, 0) / memoryTests.length;
      
      if (avgMemory > 100) {
        recommendations.push(`High average memory usage detected (${avgMemory.toFixed(1)}MB). Consider enabling memory optimization features.`);
      }
    }

    // Analyze throughput patterns
    const throughputTests = this.results.filter(r => r.metrics.throughput);
    if (throughputTests.length > 0) {
      const avgThroughput = throughputTests.reduce((sum, r) => {
        const throughput = Array.isArray(r.metrics.throughput) ? r.metrics.throughput[0] : r.metrics.throughput;
        return sum + (throughput || 0);
      }, 0) / throughputTests.length;
      
      if (avgThroughput < 10) {
        recommendations.push(`Low average throughput detected (${avgThroughput.toFixed(1)} ops/sec). Consider enabling network optimization features.`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance tests are running within acceptable parameters.');
    }

    return recommendations;
  }
}

// Run performance tests if this script is executed directly
if (require.main === module) {
  const runner = new PerformanceTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Performance test runner failed:', error);
    process.exit(1);
  });
}

export { PerformanceTestRunner };