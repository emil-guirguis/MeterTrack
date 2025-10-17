import express from 'express';
import modbusService from '../services/modbusService.js';
import { ModbusError, ModbusErrorType } from '../types/modbus.js';
import modbusMonitoring from '../monitoring/modbusMonitoring.js';
const router = express.Router();
/**
 * Direct meter read endpoint - connects directly to meter using new TypeScript ModbusService
 * POST /api/direct-meter-read
 */
router.post('/direct-meter-read', async (req, res) => {
    const { ip, port = 502, slaveId = 1, registers } = req.body;
    const startTime = Date.now();
    console.log(`🔌 Direct meter read (TypeScript): ${ip}:${port} slave ${slaveId}`);
    try {
        // Validate input
        if (!ip || !registers || !Array.isArray(registers)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: ip and registers array',
                timestamp: new Date().toISOString(),
                deviceInfo: { ip: ip || 'unknown', port, slaveId }
            });
        }
        // Test connection first
        console.log('🔍 Testing connection to meter...');
        const connectionTest = await modbusService.testConnection(ip, port, slaveId);
        if (!connectionTest) {
            throw new ModbusError(`Failed to connect to meter at ${ip}:${port}`, ModbusErrorType.CONNECTION_FAILED, `${ip}:${port}:${slaveId}`);
        }
        console.log('✅ Connection test successful, reading registers...');
        const readings = {};
        // Read each register as specified using the new service
        for (const reg of registers) {
            try {
                console.log(`📊 Reading register ${reg.address} (${reg.name})...`);
                const result = await modbusService.readInputRegisters(ip, reg.address, reg.count, { port, unitId: slaveId });
                if (result.success && result.data && Array.isArray(result.data)) {
                    const rawValue = result.data[0];
                    const scaledValue = rawValue / reg.scale;
                    readings[reg.name] = scaledValue;
                    console.log(`📊 Register ${reg.address}: ${rawValue} -> ${scaledValue} (${reg.name})`);
                }
                else {
                    console.warn(`⚠️  Failed to read register ${reg.address} (${reg.name})`);
                    readings[reg.name] = 0;
                }
            }
            catch (regError) {
                console.warn(`⚠️  Failed to read register ${reg.address} (${reg.name}):`, regError instanceof Error ? regError.message : String(regError));
                readings[reg.name] = 0;
            }
        }
        console.log('✅ Direct meter read complete:', readings);
        // Record successful operation
        const responseTime = Date.now() - startTime;
        modbusMonitoring.recordOperation(true, responseTime);
        res.json({
            success: true,
            readings,
            timestamp: new Date().toISOString(),
            deviceInfo: {
                ip,
                port,
                slaveId
            }
        });
    }
    catch (error) {
        console.error('❌ Direct meter read failed:', error instanceof Error ? error.message : String(error));
        // Record failed operation
        const responseTime = Date.now() - startTime;
        modbusMonitoring.recordOperation(false, responseTime, error instanceof Error ? error : new Error(String(error)));
        let errorMessage = 'Unknown error occurred';
        let statusCode = 500;
        if (error instanceof ModbusError) {
            errorMessage = error.message;
            switch (error.type) {
                case ModbusErrorType.CONNECTION_FAILED:
                    statusCode = 503; // Service Unavailable
                    break;
                case ModbusErrorType.TIMEOUT:
                    statusCode = 408; // Request Timeout
                    break;
                case ModbusErrorType.PROTOCOL_ERROR:
                case ModbusErrorType.INVALID_REGISTER:
                    statusCode = 400; // Bad Request
                    break;
                default:
                    statusCode = 500;
            }
        }
        else if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            deviceInfo: {
                ip: ip || 'unknown',
                port,
                slaveId
            }
        });
    }
});
/**
 * Get connection pool statistics endpoint
 * GET /api/modbus-pool-stats
 */
router.get('/modbus-pool-stats', (req, res) => {
    try {
        const stats = modbusService.getPoolStats();
        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Failed to get pool stats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get pool statistics',
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * Test connection endpoint
 * POST /api/test-modbus-connection
 */
router.post('/test-modbus-connection', async (req, res) => {
    const { ip, port = 502, slaveId = 1 } = req.body;
    console.log(`🔍 Testing Modbus connection: ${ip}:${port} slave ${slaveId}`);
    try {
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: ip',
                timestamp: new Date().toISOString()
            });
        }
        const startTime = Date.now();
        const isConnected = await modbusService.testConnection(ip, port, slaveId);
        const responseTime = Date.now() - startTime;
        if (isConnected) {
            console.log(`✅ Connection test successful in ${responseTime}ms`);
            res.json({
                success: true,
                connected: true,
                responseTime,
                timestamp: new Date().toISOString(),
                deviceInfo: { ip, port, slaveId }
            });
        }
        else {
            console.log(`❌ Connection test failed in ${responseTime}ms`);
            res.status(503).json({
                success: false,
                connected: false,
                responseTime,
                error: 'Connection test failed',
                timestamp: new Date().toISOString(),
                deviceInfo: { ip, port, slaveId }
            });
        }
    }
    catch (error) {
        console.error('❌ Connection test error:', error);
        res.status(500).json({
            success: false,
            connected: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
            timestamp: new Date().toISOString(),
            deviceInfo: { ip: ip || 'unknown', port, slaveId }
        });
    }
});
export default router;
//# sourceMappingURL=directMeter.js.map