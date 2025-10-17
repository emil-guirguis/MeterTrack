"use strict";
const request = require('supertest');
const express = require('express');
const modbusService = require('../../services/modbusService.ts');
// Create test app
const app = express();
app.use(express.json());
// Import routes
const directMeterRoute = require('../../routes/directMeter.ts');
app.use('/api', directMeterRoute);
describe('Modbus Integration Tests', () => {
    let testDeviceIP;
    let testPort;
    let testSlaveId;
    beforeAll(() => {
        // Use environment variables or default test values
        testDeviceIP = process.env.TEST_MODBUS_IP || '192.168.1.100';
        testPort = parseInt(process.env.TEST_MODBUS_PORT) || 502;
        testSlaveId = parseInt(process.env.TEST_MODBUS_SLAVE_ID) || 1;
        console.log(`Testing with device: ${testDeviceIP}:${testPort} (slave ${testSlaveId})`);
    });
    afterAll(async () => {
        // Clean up connections
        modbusService.closeAllConnections();
    });
    describe('Connection Pool Integration', () => {
        test('should get pool statistics', async () => {
            const response = await request(app)
                .get('/api/modbus-pool-stats')
                .expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('stats');
            expect(response.body.stats).toHaveProperty('totalConnections');
            expect(response.body.stats).toHaveProperty('activeConnections');
            expect(response.body.stats).toHaveProperty('idleConnections');
        });
        test('should handle multiple concurrent requests', async () => {
            const requests = [];
            // Create multiple concurrent requests
            for (let i = 0; i < 5; i++) {
                requests.push(request(app)
                    .get('/api/modbus-pool-stats')
                    .expect(200));
            }
            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
                expect(response.body.stats).toBeDefined();
            });
        });
    });
    describe('Connection Testing', () => {
        test('should test connection to valid device', async () => {
            const response = await request(app)
                .post('/api/test-modbus-connection')
                .send({
                ip: testDeviceIP,
                port: testPort,
                slaveId: testSlaveId
            })
                .expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('connected');
            expect(response.body).toHaveProperty('responseTime');
            expect(response.body.deviceInfo).toEqual({
                ip: testDeviceIP,
                port: testPort,
                slaveId: testSlaveId
            });
        }, 10000);
        test('should handle connection to invalid device', async () => {
            const response = await request(app)
                .post('/api/test-modbus-connection')
                .send({
                ip: '192.168.255.255', // Invalid IP
                port: testPort,
                slaveId: testSlaveId
            })
                .expect(503);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('connected', false);
            expect(response.body).toHaveProperty('error');
        }, 15000);
        test('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/test-modbus-connection')
                .send({
                // Missing ip field
                port: testPort,
                slaveId: testSlaveId
            })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Missing required field: ip');
        });
    });
    describe('Direct Meter Reading', () => {
        test('should read meter data with valid configuration', async () => {
            const response = await request(app)
                .post('/api/direct-meter-read')
                .send({
                ip: testDeviceIP,
                port: testPort,
                slaveId: testSlaveId,
                registers: [
                    {
                        address: 0,
                        count: 1,
                        scale: 1,
                        name: 'test_register'
                    }
                ]
            })
                .expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('readings');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('deviceInfo');
            expect(response.body.deviceInfo).toEqual({
                ip: testDeviceIP,
                port: testPort,
                slaveId: testSlaveId
            });
            expect(response.body.readings).toHaveProperty('test_register');
        }, 15000);
        test('should handle multiple register reads', async () => {
            const response = await request(app)
                .post('/api/direct-meter-read')
                .send({
                ip: testDeviceIP,
                port: testPort,
                slaveId: testSlaveId,
                registers: [
                    {
                        address: 0,
                        count: 1,
                        scale: 1,
                        name: 'register_0'
                    },
                    {
                        address: 1,
                        count: 1,
                        scale: 10,
                        name: 'register_1'
                    },
                    {
                        address: 2,
                        count: 1,
                        scale: 100,
                        name: 'register_2'
                    }
                ]
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.readings).toHaveProperty('register_0');
            expect(response.body.readings).toHaveProperty('register_1');
            expect(response.body.readings).toHaveProperty('register_2');
        }, 15000);
        test('should validate required fields for meter read', async () => {
            const response = await request(app)
                .post('/api/direct-meter-read')
                .send({
                // Missing ip and registers
                port: testPort,
                slaveId: testSlaveId
            })
                .expect(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Missing required fields');
        });
        test('should handle invalid device for meter read', async () => {
            const response = await request(app)
                .post('/api/direct-meter-read')
                .send({
                ip: '192.168.255.255', // Invalid IP
                port: testPort,
                slaveId: testSlaveId,
                registers: [
                    {
                        address: 0,
                        count: 1,
                        scale: 1,
                        name: 'test_register'
                    }
                ]
            })
                .expect(503);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        }, 15000);
    });
    describe('Error Scenarios and Recovery', () => {
        test('should handle timeout scenarios gracefully', async () => {
            // Test with very short timeout by using invalid IP that will timeout
            const response = await request(app)
                .post('/api/test-modbus-connection')
                .send({
                ip: '10.255.255.1', // Non-routable IP that will timeout
                port: testPort,
                slaveId: testSlaveId
            })
                .expect(503);
            expect(response.body.success).toBe(false);
            expect(response.body.connected).toBe(false);
        }, 20000);
        test('should handle malformed register configurations', async () => {
            const response = await request(app)
                .post('/api/direct-meter-read')
                .send({
                ip: testDeviceIP,
                port: testPort,
                slaveId: testSlaveId,
                registers: [
                    {
                        // Missing required fields
                        name: 'invalid_register'
                    }
                ]
            });
            // Should handle gracefully, either with error or default values
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('timestamp');
        });
        test('should recover from connection errors', async () => {
            // First, make a request to an invalid device to trigger error
            await request(app)
                .post('/api/test-modbus-connection')
                .send({
                ip: '192.168.255.255',
                port: testPort,
                slaveId: testSlaveId
            })
                .expect(503);
            // Then make a request to a valid device to test recovery
            const response = await request(app)
                .post('/api/test-modbus-connection')
                .send({
                ip: testDeviceIP,
                port: testPort,
                slaveId: testSlaveId
            })
                .expect(200);
            expect(response.body.success).toBe(true);
        }, 20000);
    });
    describe('Performance and Load Testing', () => {
        test('should handle rapid sequential requests', async () => {
            const startTime = Date.now();
            const requests = [];
            // Make 10 rapid sequential requests
            for (let i = 0; i < 10; i++) {
                requests.push(request(app)
                    .get('/api/modbus-pool-stats')
                    .expect(200));
            }
            const responses = await Promise.all(requests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            // All requests should succeed
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
            });
            // Should complete within reasonable time (adjust based on your requirements)
            expect(totalTime).toBeLessThan(5000); // 5 seconds
            console.log(`10 concurrent requests completed in ${totalTime}ms`);
        }, 10000);
        test('should maintain pool efficiency under load', async () => {
            // Get initial pool stats
            const initialStats = await request(app)
                .get('/api/modbus-pool-stats')
                .expect(200);
            // Make multiple connection test requests
            const connectionRequests = [];
            for (let i = 0; i < 5; i++) {
                connectionRequests.push(request(app)
                    .post('/api/test-modbus-connection')
                    .send({
                    ip: testDeviceIP,
                    port: testPort,
                    slaveId: testSlaveId
                }));
            }
            await Promise.all(connectionRequests);
            // Get final pool stats
            const finalStats = await request(app)
                .get('/api/modbus-pool-stats')
                .expect(200);
            // Pool should not have excessive connections
            expect(finalStats.body.stats.totalConnections).toBeLessThanOrEqual(10);
            console.log('Initial pool stats:', initialStats.body.stats);
            console.log('Final pool stats:', finalStats.body.stats);
        }, 20000);
    });
    describe('Configuration Validation', () => {
        test('should handle default port and slave ID', async () => {
            const response = await request(app)
                .post('/api/test-modbus-connection')
                .send({
                ip: testDeviceIP
                // port and slaveId should default
            })
                .expect(200);
            expect(response.body.deviceInfo.port).toBe(502);
            expect(response.body.deviceInfo.slaveId).toBe(1);
        }, 10000);
        test('should handle custom port and slave ID', async () => {
            const customPort = 503;
            const customSlaveId = 2;
            const response = await request(app)
                .post('/api/test-modbus-connection')
                .send({
                ip: testDeviceIP,
                port: customPort,
                slaveId: customSlaveId
            });
            // May fail if device doesn't support custom port/slave, but should handle gracefully
            expect(response.body.deviceInfo.port).toBe(customPort);
            expect(response.body.deviceInfo.slaveId).toBe(customSlaveId);
        });
    });
});
// Helper function to check if test device is available
async function checkTestDeviceAvailability() {
    try {
        const isAvailable = await modbusService.testConnection(process.env.TEST_MODBUS_IP || '192.168.1.100', parseInt(process.env.TEST_MODBUS_PORT) || 502, parseInt(process.env.TEST_MODBUS_SLAVE_ID) || 1);
        if (!isAvailable) {
            console.warn('⚠️  Test Modbus device not available. Some tests may fail.');
            console.warn('   Set TEST_MODBUS_IP, TEST_MODBUS_PORT, TEST_MODBUS_SLAVE_ID environment variables');
            console.warn('   to point to a real Modbus device for comprehensive testing.');
        }
        return isAvailable;
    }
    catch (error) {
        console.warn('⚠️  Could not check test device availability:', error.message);
        return false;
    }
}
// Run device availability check before tests
beforeAll(async () => {
    await checkTestDeviceAvailability();
});
//# sourceMappingURL=modbus-integration.test.js.map