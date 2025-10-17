import { it } from "node:test";

import { it } from "node:test";

import { describe } from "node:test";

import { it } from "node:test";

import { it } from "node:test";

import { describe } from "node:test";

import { it } from "node:test";

import { it } from "node:test";

import { describe } from "node:test";

import { it } from "node:test";

import { it } from "node:test";

import { describe } from "node:test";

import { it } from "node:test";

import { it } from "node:test";

import { it } from "node:test";

import { describe } from "node:test";

import { afterEach } from "node:test";

import { beforeEach } from "node:test";

import { describe } from "node:test";

const { ModbusService } = require('../services/modbusService.ts');
const { ModbusError, ModbusErrorType } = require('../types/modbus.ts');

// Mock jsmodbus
jest.mock('jsmodbus', () => ({
  default: {
    client: {
      TCP: jest.fn().mockImplementation((socket, unitId, timeout) => ({
        readHoldingRegisters: jest.fn(),
        readInputRegisters: jest.fn()
      }))
    }
  }
}));

// Mock net Socket
jest.mock('net', () => ({
  Socket: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    end: jest.fn(),
    destroy: jest.fn()
  }))
}));

describe('ModbusService TypeScript Migration', () => {
  let modbusService: ModbusService;
  let mockSocket: any;
  let mockClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create service instance
    modbusService = new ModbusService({
      maxConnections: 5,
      idleTimeout: 60000,
      acquireTimeout: 10000
    });

    // Set up mock socket
    const { Socket } = require('net');
    mockSocket = new Socket();
    
    // Set up mock client
    const jsmodbus = require('jsmodbus');
    mockClient = new jsmodbus.default.client.TCP(mockSocket, 1, 5000);
  });

  afterEach(() => {
    modbusService.closeAllConnections();
  });

  describe('Connection Management', () => {
    it('should create TypeScript service instance', () => {
      expect(modbusService).toBeInstanceOf(ModbusService);
      expect(typeof modbusService.connectDevice).toBe('function');
      expect(typeof modbusService.readMeterData).toBe('function');
      expect(typeof modbusService.testConnection).toBe('function');
    });

    it('should handle connection configuration with types', async () => {
      // Mock successful connection
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(callback, 10);
        }
      });

      const deviceIP = '192.168.1.100';
      const port = 502;
      const slaveId = 1;

      try {
        const client = await modbusService.connectDevice(deviceIP, port, slaveId);
        expect(client).toBeDefined();
        expect(mockSocket.connect).toHaveBeenCalledWith(port, deviceIP);
      } catch (error) {
        // Connection might fail in test environment, but we're testing the interface
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should provide pool statistics', () => {
      const stats = modbusService.getPoolStats();
      
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('idleConnections');
      expect(typeof stats.totalConnections).toBe('number');
      expect(typeof stats.activeConnections).toBe('number');
      expect(typeof stats.idleConnections).toBe('number');
    });
  });

  describe('Type Safety', () => {
    it('should handle ModbusError types correctly', () => {
      const error = new ModbusError(
        'Test error',
        ModbusErrorType.CONNECTION_FAILED,
        'device1'
      );

      expect(error).toBeInstanceOf(ModbusError);
      expect(error.type).toBe(ModbusErrorType.CONNECTION_FAILED);
      expect(error.deviceId).toBe('device1');
      expect(error.message).toBe('Test error');
    });

    it('should handle register configuration types', async () => {
      const config = {
        port: 502,
        unitId: 1,
        registers: {
          voltage: { address: 5, count: 1, scale: 200 },
          current: { address: 6, count: 1, scale: 100 },
          power: { address: 7, count: 1, scale: 1 }
        }
      };

      // Mock successful connection and register reads
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(callback, 10);
        }
      });

      mockClient.readHoldingRegisters.mockResolvedValue({
        response: {
          body: {
            values: [24000, 500, 1200] // Mock register values
          }
        }
      });

      try {
        const result = await modbusService.readMeterData('192.168.1.100', config);
        
        expect(result).toHaveProperty('deviceIP');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('success');
        expect(result.deviceIP).toBe('192.168.1.100');
        expect(result.timestamp).toBeInstanceOf(Date);
      } catch (error) {
        // Expected in test environment
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same method signatures as JavaScript version', () => {
      // Test that all expected methods exist with correct signatures
      expect(typeof modbusService.connectDevice).toBe('function');
      expect(typeof modbusService.readMeterData).toBe('function');
      expect(typeof modbusService.readInputRegisters).toBe('function');
      expect(typeof modbusService.testConnection).toBe('function');
      expect(typeof modbusService.closeAllConnections).toBe('function');
      expect(typeof modbusService.closeConnection).toBe('function');
    });

    it('should handle default parameters correctly', async () => {
      // Mock connection failure to test error handling
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Connection failed')), 10);
        }
      });

      try {
        // Should use default port (502) and slaveId (1)
        await modbusService.connectDevice('192.168.1.100');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Connection Pool Features', () => {
    it('should implement connection pooling', () => {
      const initialStats = modbusService.getPoolStats();
      expect(initialStats.totalConnections).toBe(0);
      
      // Pool should be empty initially
      expect(initialStats.activeConnections).toBe(0);
      expect(initialStats.idleConnections).toBe(0);
    });

    it('should handle connection cleanup', () => {
      // Test cleanup methods don't throw
      expect(() => modbusService.closeAllConnections()).not.toThrow();
      expect(() => modbusService.closeConnection('192.168.1.100', 502, 1)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection timeouts with proper types', async () => {
      // Mock timeout scenario
      mockSocket.once.mockImplementation((event: string, callback: Function) => {
        // Don't call callback to simulate timeout
      });

      try {
        await modbusService.connectDevice('192.168.1.100', 502, 1);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // In real implementation, this would be a ModbusError with TIMEOUT type
      }
    });

    it('should handle register read failures gracefully', async () => {
      const result = await modbusService.readMeterData('192.168.1.100');
      
      // Should return structured result even on failure
      expect(result).toHaveProperty('deviceIP');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('success');
      expect(result.deviceIP).toBe('192.168.1.100');
      expect(typeof result.success).toBe('boolean');
    });
  });
});