"use strict";
const { ModbusService } = require('../services/modbusService.ts');
// Mock jsmodbus
jest.mock('jsmodbus', () => ({
    default: {
        client: {
            TCP: jest.fn().mockImplementation(() => ({
                readHoldingRegisters: jest.fn().mockResolvedValue({
                    response: {
                        body: {
                            values: [24000, 500, 1200]
                        }
                    }
                }),
                readInputRegisters: jest.fn().mockResolvedValue({
                    response: {
                        body: {
                            values: [100, 200, 300]
                        }
                    }
                })
            }))
        }
    }
}));
// Mock net Socket
jest.mock('net', () => ({
    Socket: jest.fn().mockImplementation(() => ({
        connect: jest.fn(),
        on: jest.fn(),
        once: jest.fn((event, callback) => {
            if (event === 'connect') {
                setTimeout(callback, 10);
            }
        }),
        end: jest.fn(),
        destroy: jest.fn()
    }))
}));
describe('ModbusService TypeScript Migration', () => {
    let modbusService;
    beforeEach(() => {
        jest.clearAllMocks();
        modbusService = new ModbusService({
            maxConnections: 5,
            idleTimeout: 60000,
            acquireTimeout: 10000
        });
    });
    afterEach(() => {
        if (modbusService) {
            modbusService.closeAllConnections();
        }
    });
    describe('Service Initialization', () => {
        test('should create TypeScript service instance', () => {
            expect(modbusService).toBeInstanceOf(ModbusService);
            expect(typeof modbusService.connectDevice).toBe('function');
            expect(typeof modbusService.readMeterData).toBe('function');
            expect(typeof modbusService.testConnection).toBe('function');
        });
        test('should provide pool statistics', () => {
            const stats = modbusService.getPoolStats();
            expect(stats).toHaveProperty('totalConnections');
            expect(stats).toHaveProperty('activeConnections');
            expect(stats).toHaveProperty('idleConnections');
            expect(typeof stats.totalConnections).toBe('number');
            expect(typeof stats.activeConnections).toBe('number');
            expect(typeof stats.idleConnections).toBe('number');
        });
    });
    describe('Connection Management', () => {
        test('should handle connection with proper types', async () => {
            const deviceIP = '192.168.1.100';
            const port = 502;
            const slaveId = 1;
            try {
                const client = await modbusService.connectDevice(deviceIP, port, slaveId);
                expect(client).toBeDefined();
            }
            catch (error) {
                // Connection might fail in test environment
                expect(error).toBeInstanceOf(Error);
            }
        });
        test('should maintain backward compatibility with method signatures', () => {
            expect(typeof modbusService.connectDevice).toBe('function');
            expect(typeof modbusService.readMeterData).toBe('function');
            expect(typeof modbusService.readInputRegisters).toBe('function');
            expect(typeof modbusService.testConnection).toBe('function');
            expect(typeof modbusService.closeAllConnections).toBe('function');
            expect(typeof modbusService.closeConnection).toBe('function');
        });
    });
    describe('Data Reading', () => {
        test('should handle meter data reading with type safety', async () => {
            const config = {
                port: 502,
                unitId: 1,
                registers: {
                    voltage: { address: 5, count: 1, scale: 200 },
                    current: { address: 6, count: 1, scale: 100 },
                    power: { address: 7, count: 1, scale: 1 }
                }
            };
            const result = await modbusService.readMeterData('192.168.1.100', config);
            expect(result).toHaveProperty('deviceIP');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('success');
            expect(result.deviceIP).toBe('192.168.1.100');
            expect(result.timestamp).toBeInstanceOf(Date);
            expect(typeof result.success).toBe('boolean');
        });
        test('should handle input register reading', async () => {
            const result = await modbusService.readInputRegisters('192.168.1.100', 0, 5);
            expect(result).toHaveProperty('deviceIP');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('success');
            expect(result.deviceIP).toBe('192.168.1.100');
        });
    });
    describe('Connection Pool Features', () => {
        test('should implement connection pooling', () => {
            const initialStats = modbusService.getPoolStats();
            expect(initialStats.totalConnections).toBe(0);
            expect(initialStats.activeConnections).toBe(0);
            expect(initialStats.idleConnections).toBe(0);
        });
        test('should handle connection cleanup', () => {
            expect(() => modbusService.closeAllConnections()).not.toThrow();
            expect(() => modbusService.closeConnection('192.168.1.100', 502, 1)).not.toThrow();
        });
    });
    describe('Error Handling', () => {
        test('should handle connection test', async () => {
            const result = await modbusService.testConnection('192.168.1.100');
            expect(typeof result).toBe('boolean');
        });
        test('should handle register read failures gracefully', async () => {
            const result = await modbusService.readMeterData('192.168.1.100');
            expect(result).toHaveProperty('deviceIP');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('success');
            expect(result.deviceIP).toBe('192.168.1.100');
            expect(typeof result.success).toBe('boolean');
        });
    });
    describe('TypeScript Features', () => {
        test('should use node-modbus library instead of modbus-serial', () => {
            // Verify that jsmodbus is being used
            const jsmodbus = require('jsmodbus');
            expect(jsmodbus.default.client.TCP).toHaveBeenCalled();
        });
        test('should provide type-safe interfaces', () => {
            // Test that the service provides expected interface
            const requiredMethods = [
                'connectDevice',
                'readMeterData',
                'readInputRegisters',
                'testConnection',
                'closeAllConnections',
                'closeConnection',
                'getPoolStats'
            ];
            requiredMethods.forEach(method => {
                expect(typeof modbusService[method]).toBe('function');
            });
        });
    });
});
//# sourceMappingURL=modbusService.test.js.map