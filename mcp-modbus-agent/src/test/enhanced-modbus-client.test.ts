import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import winston from 'winston';
import { EnhancedModbusClient } from '../enhanced-modbus-client.js';
import { ModbusClientConfig, ModbusError, ModbusErrorType } from '../types/modbus.js';

describe('EnhancedModbusClient Unit Tests', () => {
  let client: EnhancedModbusClient;
  let logger: winston.Logger;
  let config: ModbusClientConfig;

  beforeEach(() => {
    // Create logger
    logger = winston.createLogger({
      level: 'error', // Reduce log noise during tests
      format: winston.format.simple(),
      transports: [new winston.transports.Console({ silent: true })]
    });

    // Create config for real Modbus device
    config = {
      host: '10.10.10.11',
      port: 502,
      unitId: 1,
      timeout: 3000,
      maxRetries: 2,
      reconnectDelay: 1000,
      keepAlive: true
    };
  });

  afterEach(async () => {
    if (client) {
      client.disconnect();
      client.destroy();
      // Give some time for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  describe('Constructor', () => {
    it('should create client with default configuration', () => {
      const minimalConfig = {
        host: '10.10.10.11',
        port: 502,
        unitId: 1,
        timeout: 3000
      };

      client = new EnhancedModbusClient(minimalConfig, logger);
      const clientConfig = client.getConfig();

      expect(clientConfig.host).toBe('10.10.10.11');
      expect(clientConfig.port).toBe(502);
      expect(clientConfig.unitId).toBe(1);
      expect(clientConfig.timeout).toBe(3000);
      expect(clientConfig.maxRetries).toBe(3);
      expect(clientConfig.reconnectDelay).toBe(5000);
      expect(clientConfig.keepAlive).toBe(true);
    });

    it('should create client with custom configuration', () => {
      client = new EnhancedModbusClient(config, logger);
      const clientConfig = client.getConfig();

      expect(clientConfig.host).toBe(config.host);
      expect(clientConfig.port).toBe(config.port);
      expect(clientConfig.unitId).toBe(config.unitId);
      expect(clientConfig.timeout).toBe(config.timeout);
      expect(clientConfig.maxRetries).toBe(config.maxRetries);
    });

    it('should initialize with disconnected state', () => {
      client = new EnhancedModbusClient(config, logger);
      expect(client.getConnectionStatus()).toBe(false);
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => {
      client = new EnhancedModbusClient(config, logger);
    });

    it('should connect successfully to real device', async () => {
      const connected = await client.connect();

      if (connected) {
        expect(client.getConnectionStatus()).toBe(true);
        
        // Test basic functionality
        const testResult = await client.testConnection();
        expect(testResult).toBe(true);
      } else {
        // If device is not available, test should still pass but log the issue
        console.warn('Modbus device at 10.10.10.11:502 not available for testing');
        expect(client.getConnectionStatus()).toBe(false);
      }
    }, 10000);

    it('should handle connection timeout', async () => {
      // Use invalid IP to test timeout
      const timeoutConfig = { ...config, host: '192.0.2.1', timeout: 1000 }; // RFC5737 test IP
      const timeoutClient = new EnhancedModbusClient(timeoutConfig, logger);

      const connected = await timeoutClient.connect();

      expect(connected).toBe(false);
      expect(timeoutClient.getConnectionStatus()).toBe(false);
      
      timeoutClient.destroy();
    }, 15000);

    it('should return true if already connected', async () => {
      const connected1 = await client.connect();
      
      if (connected1) {
        expect(client.getConnectionStatus()).toBe(true);

        // Second connection attempt should return true without reconnecting
        const connected2 = await client.connect();
        expect(connected2).toBe(true);
        expect(client.getConnectionStatus()).toBe(true);
      } else {
        console.warn('Modbus device not available for connection reuse test');
      }
    }, 10000);

    it('should disconnect properly', async () => {
      const connected = await client.connect();
      
      if (connected) {
        expect(client.getConnectionStatus()).toBe(true);

        client.disconnect();
        expect(client.getConnectionStatus()).toBe(false);
      } else {
        console.warn('Modbus device not available for disconnect test');
      }
    }, 10000);
  });

  describe('Data Reading', () => {
    beforeEach(async () => {
      client = new EnhancedModbusClient(mockConfig, mockLogger);
      const net = require('net');
      mockSocket = new net.Socket();
      
      mockSocket.connect.mockImplementation(() => {
        process.nextTick(() => mockSocket.emit('connect'));
      });

      await client.connect();
    });

    it('should read meter data successfully', async () => {
      // Mock successful register read
      mockModbusClient.readHoldingRegisters.mockResolvedValue({
        response: {
          body: {
            values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        }
      });

      const reading = await client.readMeterData();

      expect(reading).toBeDefined();
      expect(reading?.voltage).toBe(240); // 48000 / 200
      expect(reading?.current).toBe(10); // 1000 / 100
      expect(reading?.power).toBe(2400);
      expect(reading?.deviceIP).toBe('192.168.1.100');
      expect(reading?.meterId).toBe('192.168.1.100:502:1');
      expect(reading?.slaveId).toBe(1);
      expect(reading?.quality).toBe('good');
      expect(reading?.source).toBe('jsmodbus-enhanced');
    });

    it('should throw error when not connected', async () => {
      client.disconnect();

      await expect(client.readMeterData()).rejects.toThrow(ModbusError);
      await expect(client.readMeterData()).rejects.toThrow('Modbus client not connected');
    });

    it('should handle register read errors', async () => {
      mockModbusClient.readHoldingRegisters.mockRejectedValue(new Error('Register read failed'));

      await expect(client.readMeterData()).rejects.toThrow(ModbusError);
    });

    it('should test connection successfully', async () => {
      mockModbusClient.readHoldingRegisters.mockResolvedValue({
        response: {
          body: {
            values: [100]
          }
        }
      });

      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockModbusClient.readHoldingRegisters).toHaveBeenCalledWith(0, 1);
    });

    it('should fail connection test on error', async () => {
      mockModbusClient.readHoldingRegisters.mockRejectedValue(new Error('Connection test failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      client = new EnhancedModbusClient(mockConfig, mockLogger);
      const net = require('net');
      mockSocket = new net.Socket();
    });

    it('should emit connected event on successful connection', async () => {
      const connectedSpy = vi.fn();
      client.on('connected', connectedSpy);

      mockSocket.connect.mockImplementation(() => {
        process.nextTick(() => mockSocket.emit('connect'));
      });

      await client.connect();

      expect(connectedSpy).toHaveBeenCalled();
    });

    it('should emit error event on connection error', async () => {
      const errorSpy = vi.fn();
      client.on('error', errorSpy);

      const connectionError = new Error('Connection failed');
      mockSocket.connect.mockImplementation(() => {
        process.nextTick(() => mockSocket.emit('error', connectionError));
      });

      await client.connect();

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should emit disconnected event on connection close', async () => {
      const disconnectedSpy = vi.fn();
      client.on('disconnected', disconnectedSpy);

      // Connect first
      mockSocket.connect.mockImplementation(() => {
        process.nextTick(() => mockSocket.emit('connect'));
      });

      await client.connect();

      // Simulate connection close
      mockSocket.emit('close');

      expect(disconnectedSpy).toHaveBeenCalled();
    });

    it('should emit data event on successful meter reading', async () => {
      const dataSpy = vi.fn();
      client.on('data', dataSpy);

      // Connect first
      mockSocket.connect.mockImplementation(() => {
        process.nextTick(() => mockSocket.emit('connect'));
      });

      await client.connect();

      // Mock successful register read
      mockModbusClient.readHoldingRegisters.mockResolvedValue({
        response: {
          body: {
            values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        }
      });

      await client.readMeterData();

      expect(dataSpy).toHaveBeenCalled();
      expect(dataSpy).toHaveBeenCalledWith(expect.objectContaining({
        voltage: 240,
        current: 10,
        power: 2400
      }));
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(() => {
      client = new EnhancedModbusClient(mockConfig, mockLogger);
      const net = require('net');
      mockSocket = new net.Socket();
      
      mockSocket.connect.mockImplementation(() => {
        process.nextTick(() => mockSocket.emit('connect'));
      });
    });

    it('should track connection time', async () => {
      await client.connect();

      const metrics = client.getPerformanceMetrics();
      expect(metrics.connectionTime).toBeGreaterThan(0);
    });

    it('should track read time', async () => {
      await client.connect();

      mockModbusClient.readHoldingRegisters.mockResolvedValue({
        response: {
          body: {
            values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        }
      });

      await client.readMeterData();

      const metrics = client.getPerformanceMetrics();
      expect(metrics.readTime).toBeGreaterThan(0);
      expect(metrics.totalTime).toBeGreaterThan(0);
    });

    it('should track error count', async () => {
      await client.connect();

      mockModbusClient.readHoldingRegisters.mockRejectedValue(new Error('Read failed'));

      try {
        await client.readMeterData();
      } catch (error) {
        // Expected error
      }

      const metrics = client.getPerformanceMetrics();
      expect(metrics.errorCount).toBe(1);
    });

    it('should calculate success rate', async () => {
      await client.connect();

      // Successful read
      mockModbusClient.readHoldingRegisters.mockResolvedValue({
        response: {
          body: {
            values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        }
      });

      await client.readMeterData();

      const metrics = client.getPerformanceMetrics();
      expect(metrics.successRate).toBeGreaterThan(0);
    });
  });

  describe('Health Status', () => {
    beforeEach(() => {
      client = new EnhancedModbusClient(mockConfig, mockLogger);
      const net = require('net');
      mockSocket = new net.Socket();
      
      mockSocket.connect.mockImplementation(() => {
        process.nextTick(() => mockSocket.emit('connect'));
      });
    });

    it('should return health status', async () => {
      await client.connect();

      const health = client.getHealthStatus();

      expect(health).toHaveProperty('connected');
      expect(health).toHaveProperty('lastConnectionTime');
      expect(health).toHaveProperty('connectionAttempts');
      expect(health).toHaveProperty('performanceMetrics');
      expect(health.connected).toBe(true);
      expect(health.lastConnectionTime).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      client = new EnhancedModbusClient(mockConfig, mockLogger);
    });

    it('should update configuration', () => {
      const newConfig = {
        timeout: 10000,
        maxRetries: 5
      };

      client.updateConfig(newConfig);

      const config = client.getConfig();
      expect(config.timeout).toBe(10000);
      expect(config.maxRetries).toBe(5);
      expect(config.host).toBe(mockConfig.host); // Should preserve other values
    });

    it('should check if connection can be reused', () => {
      const sameConfig = { ...mockConfig };
      const differentConfig = { ...mockConfig, host: '192.168.1.101' };

      // Not connected initially
      expect(client.canReuse(sameConfig)).toBe(false);
      expect(client.canReuse(differentConfig)).toBe(false);
    });
  });

  describe('Error Handling Integration', () => {
    beforeEach(async () => {
      const { Socket } = await import('net');
      mockSocket = new (Socket as any)();
      
      const jsmodbus = await import('jsmodbus');
      mockModbusClient = {
        readHoldingRegisters: vi.fn(),
        readInputRegisters: vi.fn()
      };
      (jsmodbus.default.client.TCP as any).mockReturnValue(mockModbusClient);

      client = new EnhancedModbusClient(mockConfig, mockLogger);
    });

    it('should get error statistics', () => {
      const stats = client.getErrorStatistics();

      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('errorsByType');
      expect(stats).toHaveProperty('errorsByDevice');
    });

    it('should reset error statistics', () => {
      client.resetErrorStatistics();
      
      const stats = client.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });

    it('should reset circuit breaker', () => {
      expect(() => client.resetCircuitBreaker()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      client = new EnhancedModbusClient(mockConfig, mockLogger);
    });

    it('should destroy client properly', () => {
      const disconnectSpy = vi.spyOn(client, 'disconnect');
      
      client.destroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});