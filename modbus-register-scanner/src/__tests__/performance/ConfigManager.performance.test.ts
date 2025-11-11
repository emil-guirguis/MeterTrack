import { ConfigManager } from '../../config/ConfigManager';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigManager Performance Tests', () => {
  const testConfigDir = path.join(__dirname, 'test-configs');
  const testConfigPath = path.join(testConfigDir, 'test-config.json');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup test directory
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  test('should handle large configuration files efficiently', async () => {
    const configManager = new ConfigManager();

    // Create a large configuration with many custom settings
    const largeConfig = {
      connection: {
        host: '192.168.1.100',
        port: 502,
        slaveId: 1,
        timeout: 5000,
        retries: 3
      },
      scanning: {
        startAddress: 0,
        endAddress: 65535,
        functionCodes: [1, 2, 3, 4],
        batchSize: 125,
        enableBatching: true,
        enableStreaming: true,
        streamingThreshold: 10000
      },
      performance: {
        enableMemoryOptimization: true,
        enableNetworkOptimization: true,
        maxMemoryUsage: 500 * 1024 * 1024,
        requestDelay: 10,
        maxConcurrentRequests: 1,
        adaptiveDelay: true
      },
      export: {
        format: 'both' as const,
        outputPath: './scan-results',
        includeTimestamp: true,
        includeInaccessibleRegisters: false
      },
      advanced: {
        enableAutoSave: true,
        autoSaveInterval: 30000,
        enableProgressReporting: true,
        progressInterval: 1000,
        enableErrorLogging: true,
        logLevel: 'info' as const
      },
      // Add some additional custom properties to increase size
      customSettings: {
        deviceProfiles: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Device_${i}`,
          description: `Test device profile ${i} with various configuration parameters`,
          settings: {
            timeout: 5000 + i * 100,
            retries: 3,
            batchSize: 50 + i,
            customParameters: Array.from({ length: 10 }, (_, j) => ({
              key: `param_${j}`,
              value: `value_${i}_${j}`,
              description: `Custom parameter ${j} for device ${i}`
            }))
          }
        }))
      }
    };

    // Write large configuration
    const writeStartTime = Date.now();
    fs.writeFileSync(testConfigPath, JSON.stringify(largeConfig, null, 2));
    const writeEndTime = Date.now();

    const fileSize = fs.statSync(testConfigPath).size;

    // Load configuration
    const loadStartTime = Date.now();
    await configManager.loadConfig(testConfigPath);
    const loadEndTime = Date.now();

    // Validate configuration
    const validateStartTime = Date.now();
    const validation = configManager.validateConfig();
    const validateEndTime = Date.now();

    // Save configuration
    const saveStartTime = Date.now();
    await configManager.saveConfig(testConfigPath + '.copy');
    const saveEndTime = Date.now();

    const writeTime = writeEndTime - writeStartTime;
    const loadTime = loadEndTime - loadStartTime;
    const validateTime = validateEndTime - validateStartTime;
    const saveTime = saveEndTime - saveStartTime;

    console.log(`Large Configuration Performance:`);
    console.log(`- File size: ${(fileSize / 1024).toFixed(2)}KB`);
    console.log(`- Write time: ${writeTime}ms`);
    console.log(`- Load time: ${loadTime}ms`);
    console.log(`- Validate time: ${validateTime}ms`);
    console.log(`- Save time: ${saveTime}ms`);
    console.log(`- Validation result: ${validation.isValid ? 'Valid' : 'Invalid'}`);

    // Performance assertions
    expect(loadTime).toBeLessThan(100); // Should load within 100ms
    expect(validateTime).toBeLessThan(50); // Should validate within 50ms
    expect(saveTime).toBeLessThan(100); // Should save within 100ms
    expect(validation.isValid).toBe(true);

    // Cleanup
    if (fs.existsSync(testConfigPath + '.copy')) {
      fs.unlinkSync(testConfigPath + '.copy');
    }
  });

  test('should handle multiple rapid configuration operations', async () => {
    const operationCount = 50;
    const configManager = new ConfigManager();

    // Create base configuration
    await configManager.createDefaultConfig(testConfigPath);

    const operations: Promise<any>[] = [];
    const startTime = Date.now();

    // Perform multiple rapid operations
    for (let i = 0; i < operationCount; i++) {
      const operation = async () => {
        const tempConfigManager = new ConfigManager();
        
        // Load
        await tempConfigManager.loadConfig(testConfigPath);
        
        // Update
        tempConfigManager.updateConfig({
          connection: {
            timeout: 5000 + i * 10
          },
          scanning: {
            startAddress: i * 10,
            endAddress: i * 10 + 100
          }
        });
        
        // Validate
        const validation = tempConfigManager.validateConfig();
        
        // Save to unique file
        const uniquePath = path.join(testConfigDir, `config_${i}.json`);
        await tempConfigManager.saveConfig(uniquePath);
        
        return { validation, path: uniquePath };
      };

      operations.push(operation());
    }

    // Wait for all operations to complete
    const results = await Promise.allSettled(operations);
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    const throughput = operationCount / (totalTime / 1000);

    console.log(`Rapid Operations Performance:`);
    console.log(`- Operations: ${operationCount}`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Throughput: ${throughput.toFixed(2)} operations/second`);
    console.log(`- Success rate: ${(successCount / operationCount * 100).toFixed(1)}%`);
    console.log(`- Failures: ${failureCount}`);

    // Performance assertions
    expect(successCount).toBe(operationCount); // All operations should succeed
    expect(failureCount).toBe(0);
    expect(throughput).toBeGreaterThan(10); // Should achieve reasonable throughput
    expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

    // Cleanup generated files
    for (let i = 0; i < operationCount; i++) {
      const filePath = path.join(testConfigDir, `config_${i}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  test('should validate complex configurations efficiently', () => {
    const configManager = new ConfigManager();

    // Test configurations with various complexity levels
    const testConfigurations = [
      {
        name: 'Simple Configuration',
        config: {
          connection: { host: '192.168.1.100' },
          scanning: { startAddress: 0, endAddress: 100 }
        }
      },
      {
        name: 'Complex Valid Configuration',
        config: {
          connection: {
            host: '192.168.1.100',
            port: 502,
            slaveId: 1,
            timeout: 5000,
            retries: 3
          },
          scanning: {
            startAddress: 0,
            endAddress: 65535,
            functionCodes: [1, 2, 3, 4],
            batchSize: 125,
            enableBatching: true,
            enableStreaming: true,
            streamingThreshold: 10000
          },
          performance: {
            enableMemoryOptimization: true,
            enableNetworkOptimization: true,
            maxMemoryUsage: 500 * 1024 * 1024,
            requestDelay: 10,
            maxConcurrentRequests: 1,
            adaptiveDelay: true
          },
          export: {
            format: 'both' as const,
            outputPath: './scan-results',
            includeTimestamp: true,
            includeInaccessibleRegisters: false
          },
          advanced: {
            enableAutoSave: true,
            autoSaveInterval: 30000,
            enableProgressReporting: true,
            progressInterval: 1000,
            enableErrorLogging: true,
            logLevel: 'info' as const
          }
        }
      },
      {
        name: 'Invalid Configuration',
        config: {
          connection: {
            host: '192.168.1.100',
            port: 70000, // Invalid port
            slaveId: 300, // Invalid slave ID
            timeout: 500, // Too low timeout
            retries: -1 // Invalid retries
          },
          scanning: {
            startAddress: -1, // Invalid start address
            endAddress: 70000, // Invalid end address
            functionCodes: [5, 6], // Invalid function codes
            batchSize: 200 // Invalid batch size
          }
        }
      }
    ];

    const validationResults: any[] = [];

    testConfigurations.forEach(testConfig => {
      const startTime = Date.now();
      
      configManager.updateConfig(testConfig.config);
      const validation = configManager.validateConfig();
      
      const endTime = Date.now();
      const validationTime = endTime - startTime;

      validationResults.push({
        name: testConfig.name,
        validationTime,
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length
      });

      console.log(`${testConfig.name}:`);
      console.log(`- Validation time: ${validationTime}ms`);
      console.log(`- Valid: ${validation.isValid}`);
      console.log(`- Errors: ${validation.errors.length}`);
      console.log(`- Warnings: ${validation.warnings.length}`);
    });

    // All validations should complete quickly
    validationResults.forEach(result => {
      expect(result.validationTime).toBeLessThan(50); // Should validate within 50ms
    });

    // Validation results should be accurate
    expect(validationResults[0].isValid).toBe(true); // Simple config should be valid
    expect(validationResults[1].isValid).toBe(true); // Complex valid config should be valid
    expect(validationResults[2].isValid).toBe(false); // Invalid config should be invalid
    expect(validationResults[2].errorCount).toBeGreaterThan(0); // Invalid config should have errors
  });

  test('should handle concurrent configuration access', async () => {
    const configManager = new ConfigManager();
    await configManager.createDefaultConfig(testConfigPath);

    const concurrentOperations = 20;
    const operations: Promise<any>[] = [];

    // Create multiple concurrent operations
    for (let i = 0; i < concurrentOperations; i++) {
      const operation = async () => {
        const tempManager = new ConfigManager();
        
        // Random operation type
        const operationType = i % 4;
        
        switch (operationType) {
          case 0: // Load
            await tempManager.loadConfig(testConfigPath);
            return { type: 'load', success: true };
            
          case 1: // Validate
            await tempManager.loadConfig(testConfigPath);
            const validation = tempManager.validateConfig();
            return { type: 'validate', success: validation.isValid };
            
          case 2: // Update and validate
            await tempManager.loadConfig(testConfigPath);
            tempManager.updateConfig({
              connection: { timeout: 5000 + i * 100 }
            });
            const updateValidation = tempManager.validateConfig();
            return { type: 'update', success: updateValidation.isValid };
            
          case 3: // Get config sections
            await tempManager.loadConfig(testConfigPath);
            const connectionConfig = tempManager.getConnectionConfig();
            const scanningConfig = tempManager.getScanningConfig();
            return { 
              type: 'get', 
              success: connectionConfig && scanningConfig,
              data: { connectionConfig, scanningConfig }
            };
            
          default:
            return { type: 'unknown', success: false };
        }
      };

      operations.push(operation());
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(operations);
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const operationTypes = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r.value as any).type)
      .reduce((acc: any, type: string) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

    console.log(`Concurrent Access Performance:`);
    console.log(`- Concurrent operations: ${concurrentOperations}`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Success rate: ${(successCount / concurrentOperations * 100).toFixed(1)}%`);
    console.log(`- Operation types:`, operationTypes);
    console.log(`- Average time per operation: ${(totalTime / concurrentOperations).toFixed(2)}ms`);

    // Concurrent access should work correctly
    expect(successCount).toBe(concurrentOperations); // All operations should succeed
    expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
  });

  test('should generate configuration schema efficiently', () => {
    const configManager = new ConfigManager();
    const iterations = 100;

    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const schema = configManager.getConfigSchema();
      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`Schema Generation Performance:`);
    console.log(`- Iterations: ${iterations}`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Average time per generation: ${avgTime.toFixed(3)}ms`);

    // Schema generation should be fast
    expect(avgTime).toBeLessThan(1); // Should generate schema in less than 1ms on average
    expect(totalTime).toBeLessThan(100); // Total time should be reasonable
  });

  test('should create example configurations quickly', () => {
    const iterations = 50;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const exampleConfig = ConfigManager.createExampleConfig();
      expect(exampleConfig).toBeDefined();
      expect(typeof exampleConfig).toBe('string');
      expect(exampleConfig.length).toBeGreaterThan(100); // Should be substantial
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`Example Configuration Generation Performance:`);
    console.log(`- Iterations: ${iterations}`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Average time per generation: ${avgTime.toFixed(3)}ms`);

    // Example generation should be very fast
    expect(avgTime).toBeLessThan(2); // Should generate in less than 2ms on average
    expect(totalTime).toBeLessThan(100); // Total time should be minimal
  });
});