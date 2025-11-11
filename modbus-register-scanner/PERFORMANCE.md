# Performance Testing Guide

This document describes the performance testing framework for the Modbus Register Scanner and how to use it to validate and optimize scanning performance.

## Overview

The performance testing suite includes comprehensive tests for:

- **Memory Optimization**: Tests memory usage patterns, streaming efficiency, and garbage collection
- **Network Optimization**: Tests request patterns, adaptive delays, and throughput optimization
- **Scanner Engine**: Tests end-to-end scanning performance with various configurations
- **Configuration Management**: Tests configuration loading, validation, and concurrent access

## Running Performance Tests

### Quick Start

```bash
# Run all performance tests
npm run test:performance

# Run specific performance test suites
npm run test:memory      # Memory optimization tests
npm run test:network     # Network optimization tests
npm run test:scanner     # Scanner engine tests
npm run test:config      # Configuration management tests

# Run comprehensive benchmark
npm run benchmark
```

### Individual Test Execution

```bash
# Run with Jest directly for more control
npx jest src/__tests__/performance/MemoryOptimizer.performance.test.ts --verbose
npx jest src/__tests__/performance/NetworkOptimizer.performance.test.ts --verbose
npx jest src/__tests__/performance/ScannerEngine.performance.test.ts --verbose
npx jest src/__tests__/performance/ConfigManager.performance.test.ts --verbose
```

## Test Scenarios

### Memory Optimization Tests

- **Large Register Sets**: Tests handling of 10,000+ registers with streaming
- **Sustained Load**: Tests memory efficiency under continuous operation
- **Memory Pressure**: Tests graceful handling of memory constraints
- **Statistics Accuracy**: Validates memory usage tracking and reporting

**Key Metrics:**
- Memory usage increase (should be < 100MB for large scans)
- Streaming efficiency (registers streamed vs. kept in memory)
- Garbage collection effectiveness
- Processing throughput (registers/second)

### Network Optimization Tests

- **High-Throughput Patterns**: Tests handling of many concurrent requests
- **Adaptive Delay**: Tests automatic delay adjustment based on network conditions
- **Sustained Load**: Tests performance stability over time
- **Batch Operations**: Tests efficiency of batched request patterns

**Key Metrics:**
- Request throughput (requests/second)
- Average response time (milliseconds)
- Error rate (percentage)
- Adaptive delay effectiveness

### Scanner Engine Tests

- **Small Range Scans**: Tests performance with 100-200 registers
- **Medium Range Scans**: Tests streaming mode with 1,000+ registers
- **Optimization Comparison**: Compares different optimization strategies
- **Interruption Handling**: Tests graceful scan interruption and resumption

**Key Metrics:**
- Scan completion time
- Register discovery rate
- Memory usage during scanning
- Optimization effectiveness

### Configuration Management Tests

- **Large Configuration Files**: Tests handling of complex configuration files
- **Rapid Operations**: Tests performance under high-frequency config operations
- **Validation Performance**: Tests configuration validation speed
- **Concurrent Access**: Tests thread-safe configuration access

**Key Metrics:**
- Configuration load/save time
- Validation speed
- Concurrent operation throughput
- Memory usage for configuration data

## Performance Benchmarks

### Expected Performance Targets

| Test Category | Metric | Target | Acceptable |
|---------------|--------|--------|------------|
| Memory Usage | Large scan memory increase | < 50MB | < 100MB |
| Memory Usage | Streaming efficiency | > 80% | > 60% |
| Network | Request throughput | > 20 req/sec | > 10 req/sec |
| Network | Average response time | < 50ms | < 100ms |
| Scanner | Small scan (200 regs) | < 5 seconds | < 10 seconds |
| Scanner | Medium scan (1000 regs) | < 15 seconds | < 30 seconds |
| Config | Load/save operations | < 50ms | < 100ms |
| Config | Validation | < 20ms | < 50ms |

### Benchmark Scenarios

The `benchmark-config.json` file defines several test scenarios:

1. **Small Scan**: 100 registers, 2 function codes (baseline test)
2. **Medium Scan**: 1,000 registers with streaming enabled
3. **Large Scan**: 5,000 registers, all function codes, full optimization
4. **Memory Stress**: 10,000 registers with aggressive memory management
5. **Network Optimization**: Focused on network performance tuning
6. **No Optimization**: Baseline comparison without optimizations

## Interpreting Results

### Performance Report

After running tests, a detailed report is generated in `performance-report.json`:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": {
    "nodeVersion": "v18.17.0",
    "platform": "win32",
    "arch": "x64",
    "totalMemory": 16384
  },
  "results": [...],
  "summary": {
    "totalTests": 25,
    "passedTests": 24,
    "failedTests": 1,
    "averageDuration": 1250.5,
    "totalDuration": 31262
  },
  "recommendations": [...]
}
```

### Key Indicators

**🟢 Good Performance:**
- All tests pass within target timeframes
- Memory usage stays within acceptable limits
- Throughput meets or exceeds targets
- No memory leaks detected

**🟡 Acceptable Performance:**
- Tests pass but some metrics are below targets
- Memory usage is higher than ideal but stable
- Throughput is adequate for most use cases

**🔴 Performance Issues:**
- Tests fail or timeout
- Excessive memory usage or memory leaks
- Very low throughput
- High error rates

### Common Performance Issues

1. **High Memory Usage**
   - Enable streaming for large scans
   - Reduce batch sizes
   - Increase garbage collection frequency

2. **Low Throughput**
   - Enable network optimization
   - Reduce request delays
   - Optimize batch sizes

3. **Timeouts**
   - Increase timeout values
   - Enable adaptive delays
   - Check network connectivity

4. **Memory Leaks**
   - Ensure proper cleanup in error cases
   - Check for unclosed connections
   - Review event listener management

## Optimization Strategies

### Memory Optimization

```javascript
// Enable streaming for large scans
const options = {
  enableStreaming: true,
  streamingThreshold: 5000,
  enableMemoryOptimization: true
};
```

### Network Optimization

```javascript
// Enable adaptive network optimization
const options = {
  enableNetworkOptimization: true,
  requestDelay: 10,
  adaptiveDelay: true,
  maxConcurrentRequests: 1
};
```

### Batch Optimization

```javascript
// Optimize batch sizes based on device capabilities
const options = {
  enableBatching: true,
  batchSize: 125, // Start with maximum, will adapt
};
```

## Continuous Performance Monitoring

### Automated Testing

Include performance tests in your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Performance Tests
  run: npm run test:performance
  
- name: Check Performance Regression
  run: |
    if [ -f performance-baseline.json ]; then
      npm run benchmark -- --compare-baseline
    fi
```

### Performance Regression Detection

1. Establish baseline performance metrics
2. Run performance tests on each build
3. Compare results against baseline
4. Alert on significant regressions

### Monitoring in Production

- Track scan completion times
- Monitor memory usage patterns
- Log network performance metrics
- Set up alerts for performance degradation

## Troubleshooting Performance Issues

### Debug Mode

Enable detailed logging for performance analysis:

```bash
# Run with debug logging
DEBUG=modbus-scanner:performance npm run test:performance
```

### Memory Profiling

Use Node.js built-in profiling:

```bash
# Enable garbage collection logging
node --expose-gc --trace-gc src/__tests__/performance/performance-runner.ts
```

### Network Analysis

Monitor network patterns:

```bash
# Enable network request logging
DEBUG=modbus-scanner:network npm run test:network
```

## Contributing Performance Improvements

When contributing performance improvements:

1. Run baseline performance tests before changes
2. Implement optimizations
3. Run performance tests again
4. Document performance impact
5. Update benchmarks if significant improvements are made

### Performance Test Guidelines

- Tests should be deterministic and repeatable
- Use realistic data sizes and patterns
- Include both positive and negative test cases
- Measure multiple metrics (time, memory, throughput)
- Provide clear success/failure criteria

## Support

For performance-related questions or issues:

1. Check the performance test results for insights
2. Review the optimization recommendations
3. Consult the troubleshooting guide
4. Open an issue with performance test results attached