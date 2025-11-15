/**
 * Unit tests for ModbusMCPServerWorker
 */

import { ModbusMCPServerWorker } from '../ModbusMCPServerWorker.js';
import { jest } from '@jest/globals';

// Mock winston logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
};

jest.mock('winston', () => ({
  createLogger: jest.fn(() => mockLogger),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn()
  },
  transports: {
    Console: jest.fn()
  }
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('ModbusMCPServerWorker', () => {
  let worker;
  let mockConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      modbus: {
        ip: '10.10.10.11',
        port: 502,
        slaveId: 1,
        timeout: 5000
      },
      database: {
        url: 'postgresql://localhost:5432/test',
        database: 'test',
        table: 'meter_readings'
      },
      collectionInterval: 900000,
      autoStart: false
    };

    worker = new ModbusMCPServerWorker(mockConfig, mockLogger);
  });

  describe('constructor', () => {
    test('should initialize with provided configuration', () => {
      expect(worker).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'ModbusMCPServerWorker initialized',
        expect.objectContaining({
          modbusIp: '10.10.10.11',
          collectionInterval: 900000
        })
      );
    });

    test('should initialize with default configuration', () => {
      const defaultWorker = new ModbusMCPServerWorker();
      expect(defaultWorker).toBeDefined();
    });

    test('should mask sensitive database URI in logs', () => {
      const sensitiveConfig = {
        ...mockConfig,
        database: {
          ...mockConfig.database,
          url: 'postgresql://user:password@localhost:5432/test'
        }
      };

      new ModbusMCPServerWorker(sensitiveConfig, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'ModbusMCPServerWorker initialized',
        expect.objectContaining({
          databaseUrl: 'postgresql://***@localhost:5432/test'
        })
      );
    });
  });

  describe('start', () => {
    test('should start successfully', async () => {
      await worker.start();

      expect(mockLogger.info).toHaveBeenCalledWith('Starting MCP Server in worker thread...');
      expect(mockLogger.info).toHaveBeenCalledWith('MCP Server started successfully in worker thread');
    });

    test('should not start if already running', async () => {
      await worker.start();
      
      // Try to start again
      await worker.start();

      expect(mockLogger.warn).toHaveBeenCalledWith('MCP Server already running in worker thread');
    });

    test('should auto-start data collection when configured', async () => {
      const autoStartConfig = { ...mockConfig, autoStart: true };
      const autoStartWorker = new ModbusMCPServerWorker(autoStartConfig, mockLogger);

      await autoStartWorker.start();

      expect(mockLogger.info).toHaveBeenCalledWith('Auto-starting data collection...');
    });

    test('should handle start errors', async () => {
      // Mock an error during initialization
      const errorWorker = new ModbusMCPServerWorker(mockConfig, mockLogger);
      
      // Override the initializeDataCollector to throw an error
      errorWorker.initializeDataCollector = jest.fn().mockRejectedValue(new Error('Init failed'));

      await expect(errorWorker.start()).rejects.toThrow('Init failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to start MCP Server in worker thread:',
        expect.any(Error)
      );
    });
  });

  describe('shutdown', () => {
    test('should shutdown successfully', async () => {
      await worker.start();
      await worker.shutdown();

      expect(mockLogger.info).toHaveBeenCalledWith('Shutting down MCP Server in worker thread...');
      expect(mockLogger.info).toHaveBeenCalledWith('MCP Server shutdown complete in worker thread');
    });

    test('should handle shutdown when not running', async () => {
      await worker.shutdown();

      // Should not log shutdown messages if not running
      expect(mockLogger.info).not.toHaveBeenCalledWith('Shutting down MCP Server in worker thread...');
    });

    test('should handle shutdown errors', async () => {
      await worker.start();
      
      // Mock shutdown error
      worker.dataCollector = {
        shutdown: jest.fn().mockRejectedValue(new Error('Shutdown failed'))
      };

      await expect(worker.shutdown()).rejects.toThrow('Shutdown failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during MCP Server shutdown:',
        expect.any(Error)
      );
    });
  });

  describe('getStatus', () => {
    test('should return status when running', async () => {
      await worker.start();
      const status = await worker.getStatus();

      expect(status).toHaveProperty('isRunning', true);
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('memoryUsage');
      expect(status).toHaveProperty('uptime');
      expect(status.config).toHaveProperty('modbus');
      expect(status.config.modbus).toHaveProperty('ip', '10.10.10.11');
    });

    test('should return status when not running', async () => {
      const status = await worker.getStatus();

      expect(status).toHaveProperty('isRunning', false);
      expect(status).toHaveProperty('dataCollector', null);
    });
  });

  describe('updateConfig', () => {
    test('should update configuration', async () => {
      const newConfig = {
        modbus: { ip: '192.168.1.100' },
        collectionInterval: 600000
      };

      await worker.updateConfig(newConfig);

      expect(mockLogger.info).toHaveBeenCalledWith('Updating MCP Server configuration...');
      expect(mockLogger.info).toHaveBeenCalledWith('Configuration updated successfully');
    });

    test('should restart if running when config updated', async () => {
      await worker.start();
      
      const newConfig = { modbus: { ip: '192.168.1.100' } };
      await worker.updateConfig(newConfig);

      // Should have shutdown and restarted
      expect(mockLogger.info).toHaveBeenCalledWith('Shutting down MCP Server in worker thread...');
      expect(mockLogger.info).toHaveBeenCalledWith('Starting MCP Server in worker thread...');
    });
  });

  describe('handleDataRequest', () => {
    beforeEach(async () => {
      await worker.start();
    });

    test('should handle start_collection request', async () => {
      const request = { action: 'start_collection' };
      const result = await worker.handleDataRequest(request);

      expect(result).toBe(true); // Mock data collector returns true
    });

    test('should handle stop_collection request', async () => {
      const request = { action: 'stop_collection' };
      const result = await worker.handleDataRequest(request);

      expect(result).toEqual({
        success: true,
        message: 'Data collection stopped'
      });
    });

    test('should handle get_status request', async () => {
      const request = { action: 'get_status' };
      const result = await worker.handleDataRequest(request);

      expect(result).toHaveProperty('isRunning', true);
      expect(result).toHaveProperty('errorCount', 0);
    });

    test('should handle read_current_data request', async () => {
      const request = { action: 'read_current_data' };
      const result = await worker.handleDataRequest(request);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('meterId', 'worker-thread-meter');
      expect(result).toHaveProperty('voltage');
      expect(result).toHaveProperty('current');
    });

    test('should handle get_latest_reading request', async () => {
      const request = { action: 'get_latest_reading' };
      const result = await worker.handleDataRequest(request);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('meterId', 'worker-thread-meter');
      expect(result).toHaveProperty('kWh');
    });

    test('should handle get_statistics request', async () => {
      const request = { action: 'get_statistics', params: { hours: 24 } };
      const result = await worker.handleDataRequest(request);

      expect(result).toHaveProperty('period', '24 hours');
      expect(result).toHaveProperty('totalReadings');
      expect(result).toHaveProperty('averagePower');
    });

    test('should handle test_connections request', async () => {
      const request = { action: 'test_connections' };
      const result = await worker.handleDataRequest(request);

      expect(result).toHaveProperty('postgresql');
      expect(result).toHaveProperty('modbus');
      expect(result).toHaveProperty('timestamp');
    });

    test('should handle unknown action', async () => {
      const request = { action: 'unknown_action' };

      await expect(worker.handleDataRequest(request))
        .rejects.toThrow('Unknown data request action: unknown_action');
    });

    test('should handle request when data collector not initialized', async () => {
      worker.dataCollector = null;
      const request = { action: 'get_status' };

      await expect(worker.handleDataRequest(request))
        .rejects.toThrow('Data collector not initialized');
    });
  });

  describe('handleMCPToolCall', () => {
    beforeEach(async () => {
      await worker.start();
    });

    test('should handle start_data_collection tool', async () => {
      const result = await worker.handleMCPToolCall('start_data_collection', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0].text).toContain('Data collection started successfully');
    });

    test('should handle stop_data_collection tool', async () => {
      const result = await worker.handleMCPToolCall('stop_data_collection', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Data collection stopped');
    });

    test('should handle get_collection_status tool', async () => {
      const result = await worker.handleMCPToolCall('get_collection_status', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Data Collection Status:');
    });

    test('should handle read_current_meter_data tool', async () => {
      const result = await worker.handleMCPToolCall('read_current_meter_data', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Current Meter Reading:');
    });

    test('should handle get_latest_reading tool', async () => {
      const result = await worker.handleMCPToolCall('get_latest_reading', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Latest Reading from Database:');
    });

    test('should handle get_meter_statistics tool with default hours', async () => {
      const result = await worker.handleMCPToolCall('get_meter_statistics', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Meter Statistics (24 hours):');
    });

    test('should handle get_meter_statistics tool with custom hours', async () => {
      const result = await worker.handleMCPToolCall('get_meter_statistics', { hours: 48 });

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Meter Statistics (48 hours):');
    });

    test('should handle test_connections tool', async () => {
      const result = await worker.handleMCPToolCall('test_connections', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Connection Test Results:');
    });

    test('should handle unknown tool', async () => {
      const result = await worker.handleMCPToolCall('unknown_tool', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Error executing unknown_tool');
    });

    test('should handle tool execution errors', async () => {
      // Mock data collector to throw error
      worker.dataCollector.collectData = jest.fn().mockRejectedValue(new Error('Collection failed'));

      const result = await worker.handleMCPToolCall('read_current_meter_data', {});

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Error executing read_current_meter_data');
    });
  });

  describe('getAvailableTools', () => {
    test('should return list of available tools', async () => {
      await worker.start();
      const tools = worker.getAvailableTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toContain('start_data_collection');
      expect(tools).toContain('stop_data_collection');
      expect(tools).toContain('get_collection_status');
      expect(tools).toContain('read_current_meter_data');
      expect(tools).toContain('get_latest_reading');
      expect(tools).toContain('get_meter_statistics');
      expect(tools).toContain('test_connections');
    });
  });

  describe('testConnections', () => {
    test('should test database and modbus connections', async () => {
      await worker.start();
      
      // Access private method through handleDataRequest
      const result = await worker.handleDataRequest({ action: 'test_connections' });

      expect(result).toHaveProperty('postgresql');
      expect(result).toHaveProperty('modbus');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.postgresql).toBe('boolean');
      expect(typeof result.modbus).toBe('boolean');
    });
  });

  describe('environment variable handling', () => {
    test('should load environment variables', () => {
      // The constructor should call dotenv.config()
      const { config } = require('dotenv');
      expect(config).toHaveBeenCalled();
    });
  });

  describe('configuration initialization', () => {
    test('should use environment variables for default config', () => {
      // Mock environment variables
      process.env.MODBUS_IP = '192.168.1.50';
      process.env.MODBUS_PORT = '503';
      process.env.DATABASE_URL = 'postgresql://test:5432/testdb';

      const envWorker = new ModbusMCPServerWorker();
      
      // The worker should use environment variables
      expect(envWorker).toBeDefined();
    });
  });
});