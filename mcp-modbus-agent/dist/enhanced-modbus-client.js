import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { ModbusError, ModbusErrorType } from './types/modbus.js';
import { ModbusErrorHandler } from './error-handler.js';
// Import jsmodbus (node-modbus) library
import jsmodbus from 'jsmodbus';
/**
 * Enhanced Modbus client using jsmodbus (node-modbus) library
 * Supports connection pooling, automatic reconnection, and enhanced error handling
 */
export class EnhancedModbusClient extends EventEmitter {
    client; // jsmodbus client
    socket; // TCP socket
    config;
    logger;
    isConnected = false;
    reconnectTimeout = null;
    connectionAttempts = 0;
    fieldMap = null;
    lastConnectionTime = 0;
    errorHandler;
    performanceMetrics = {
        connectionTime: 0,
        readTime: 0,
        totalTime: 0,
        retryCount: 0,
        errorCount: 0,
        successRate: 0
    };
    constructor(config, logger) {
        super();
        this.config = {
            host: config.host,
            port: config.port,
            unitId: config.unitId,
            timeout: config.timeout ?? 5000,
            maxRetries: config.maxRetries ?? 3,
            reconnectDelay: config.reconnectDelay ?? 5000,
            keepAlive: config.keepAlive ?? true,
            maxConnections: config.maxConnections
        };
        this.logger = logger;
        // Initialize error handler
        this.errorHandler = new ModbusErrorHandler({
            maxRetries: this.config.maxRetries,
            baseRetryDelay: 1000,
            maxRetryDelay: 30000,
            backoffMultiplier: 2,
            jitterEnabled: true,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 60000
        }, logger);
        this.setupClient();
        this.loadFieldMap();
    }
    setupClient() {
        try {
            // Create jsmodbus TCP client - jsmodbus uses a different pattern
            // We'll create the client when connecting, not in setup
            this.client = null;
            this.socket = null;
        }
        catch (error) {
            this.logger.error('Failed to setup jsmodbus client:', error);
            throw new ModbusError(`Failed to setup client: ${error}`, ModbusErrorType.CONNECTION_FAILED, this.getDeviceId());
        }
    }
    setupEventHandlers(socket) {
        if (!socket)
            return;
        socket.on('connect', () => {
            this.isConnected = true;
            this.connectionAttempts = 0;
            this.lastConnectionTime = Date.now();
            this.logger.info(`Connected to Modbus device at ${this.config.host}:${this.config.port}`);
            this.emit('connected');
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        });
        socket.on('error', (error) => {
            this.isConnected = false;
            this.performanceMetrics.errorCount++;
            this.logger.error('Modbus socket error:', error);
            const modbusError = new ModbusError(`Socket error: ${error.message}`, ModbusErrorType.CONNECTION_FAILED, this.getDeviceId());
            this.emit('error', modbusError);
            this.scheduleReconnect();
        });
        socket.on('close', () => {
            this.isConnected = false;
            this.logger.info('Modbus connection closed');
            this.emit('disconnected');
            this.scheduleReconnect();
        });
        socket.on('timeout', () => {
            this.isConnected = false;
            this.performanceMetrics.errorCount++;
            this.logger.warn('Modbus connection timeout');
            const timeoutError = new ModbusError('Connection timeout', ModbusErrorType.TIMEOUT, this.getDeviceId());
            this.emit('error', timeoutError);
            this.scheduleReconnect();
        });
    }
    loadFieldMap() {
        try {
            const mapPath = process.env.MODBUS_MAP_FILE;
            if (!mapPath)
                return;
            const resolved = path.isAbsolute(mapPath) ? mapPath : path.join(process.cwd(), mapPath);
            if (!fs.existsSync(resolved)) {
                this.logger.warn(`Modbus map file not found at ${resolved}`);
                return;
            }
            const raw = fs.readFileSync(resolved, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.fields)) {
                this.fieldMap = parsed.fields;
                this.logger.info(`Loaded Modbus field map with ${this.fieldMap.length} fields from ${resolved}`);
            }
            else {
                this.logger.warn('Modbus map file missing "fields" array');
            }
        }
        catch (error) {
            this.logger.error('Failed to load Modbus field map:', error);
            this.fieldMap = null;
        }
    }
    async connect() {
        if (this.isConnected) {
            return true;
        }
        const startTime = Date.now();
        const deviceId = this.getDeviceId();
        try {
            await this.errorHandler.handleError(new Error('Initial connection attempt'), deviceId, 'connect', async () => {
                // Create jsmodbus client - need to create socket first
                const net = await import('net');
                this.socket = new net.Socket();
                this.client = new jsmodbus.client.TCP(this.socket, this.config.unitId, this.config.timeout);
                // Set up event handlers
                this.setupEventHandlers(this.socket);
                // Connect the socket with timeout
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Connection timeout'));
                    }, this.config.timeout);
                    this.socket.connect(this.config.port, this.config.host);
                    this.socket.once('connect', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                    this.socket.once('error', (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    });
                });
                this.performanceMetrics.connectionTime = Date.now() - startTime;
                return true;
            });
            return true;
        }
        catch (error) {
            this.performanceMetrics.connectionTime = Date.now() - startTime;
            this.performanceMetrics.errorCount++;
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to connect to Modbus device: ${message}`);
            this.emit('error', error);
            return false;
        }
    }
    scheduleReconnect() {
        if (this.reconnectTimeout || this.isConnected)
            return;
        // Exponential backoff with jitter
        const baseDelay = this.config.reconnectDelay || 5000;
        const backoffMultiplier = Math.min(Math.pow(2, this.connectionAttempts - 1), 8);
        const jitter = Math.random() * 1000;
        const delay = baseDelay * backoffMultiplier + jitter;
        this.logger.info(`Scheduling reconnect in ${Math.round(delay)}ms (attempt ${this.connectionAttempts})`);
        this.reconnectTimeout = setTimeout(async () => {
            this.reconnectTimeout = null;
            this.logger.info('Attempting to reconnect to Modbus device...');
            await this.connect();
        }, delay);
    }
    async readMeterData() {
        if (!this.isConnected) {
            throw new ModbusError('Modbus client not connected', ModbusErrorType.CONNECTION_FAILED, this.getDeviceId());
        }
        const startTime = Date.now();
        const deviceId = this.getDeviceId();
        try {
            return await this.errorHandler.handleError(new Error('Initial read attempt'), deviceId, 'readMeterData', async () => {
                // Read core meter registers (0-19) for basic measurements
                const coreData = await this.readHoldingRegistersWithRetry(0, 20);
                // Extract real values using discovered mapping from existing implementation
                const voltage = coreData[5] / 200; // Register 5 / 200
                const current = coreData[6] / 100; // Register 6 / 100
                const power = coreData[7]; // Register 7 direct watts
                // Calculate derived values
                const apparentPower = voltage * current;
                const powerFactor = apparentPower > 0 ? Math.min(power / apparentPower, 1.0) : 0;
                // Estimate frequency (Register 0 might be frequency * 10)
                const frequency = coreData[0] > 50 && coreData[0] < 70 ?
                    coreData[0] / 10 : 60; // Default to 60Hz if unclear
                // Estimate energy accumulation
                const energy = power * 0.001; // Convert to kWh estimate
                const reading = {
                    timestamp: new Date(),
                    voltage,
                    current,
                    power,
                    energy,
                    frequency,
                    powerFactor,
                    quality: 'good',
                    source: 'jsmodbus-enhanced',
                    deviceIP: this.config.host,
                    meterId: this.getDeviceId(),
                    slaveId: this.config.unitId
                };
                // Read additional fields from field map if available
                if (this.fieldMap && this.fieldMap.length > 0) {
                    try {
                        const additionalFields = await this.readAdditionalFieldsFromMap();
                        Object.assign(reading, additionalFields);
                        this.logger.debug('Additional mapped fields collected', {
                            keys: Object.keys(additionalFields)
                        });
                    }
                    catch (error) {
                        this.logger.warn('Failed to collect additional mapped fields:', error);
                    }
                }
                // Update performance metrics
                this.performanceMetrics.readTime = Date.now() - startTime;
                this.performanceMetrics.totalTime = this.performanceMetrics.connectionTime + this.performanceMetrics.readTime;
                this.updateSuccessRate(true);
                this.logger.info('Enhanced meter data read successfully', {
                    voltage: `${voltage.toFixed(2)}V`,
                    current: `${current.toFixed(2)}A`,
                    power: `${power}W`,
                    powerFactor: powerFactor.toFixed(3),
                    responseTime: `${this.performanceMetrics.readTime}ms`
                });
                this.emit('data', reading);
                return reading;
            });
        }
        catch (error) {
            this.updateSuccessRate(false);
            this.emit('error', error);
            throw error;
        }
    }
    async readHoldingRegistersWithRetry(address, length) {
        try {
            const result = await this.client.readHoldingRegisters(address, length);
            return result.response.body.values;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new ModbusError(`Failed to read holding registers at ${address}: ${message}`, ModbusErrorType.PROTOCOL_ERROR, this.getDeviceId(), address);
        }
    }
    async readInputRegistersWithRetry(address, length) {
        try {
            const result = await this.client.readInputRegisters(address, length);
            return result.response.body.values;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new ModbusError(`Failed to read input registers at ${address}: ${message}`, ModbusErrorType.PROTOCOL_ERROR, this.getDeviceId(), address);
        }
    }
    async readAdditionalFieldsFromMap() {
        const additionalFields = {};
        const fields = this.fieldMap || [];
        for (const field of fields) {
            try {
                const count = field.type === 'u16' || field.type === 'i16' ? 1 : 2;
                let rawData;
                // Read based on source type
                switch (field.source) {
                    case 'holding':
                        rawData = await this.readHoldingRegistersWithRetry(field.address, count);
                        break;
                    case 'input':
                        rawData = await this.readInputRegistersWithRetry(field.address, count);
                        break;
                    default:
                        this.logger.warn(`Unsupported field source: ${field.source} for field ${field.name}`);
                        continue;
                }
                // Parse value based on type
                let value;
                switch (field.type) {
                    case 'u16':
                        value = rawData[0];
                        break;
                    case 'i16':
                        value = rawData[0] > 32767 ? rawData[0] - 65536 : rawData[0];
                        break;
                    case 'u32':
                        const hi = rawData[0];
                        const lo = rawData[1];
                        const first = (field.wordOrder || 'HI_LO') === 'HI_LO' ? hi : lo;
                        const second = (field.wordOrder || 'HI_LO') === 'HI_LO' ? lo : hi;
                        value = (first << 16) + second;
                        break;
                    case 'i32':
                        const hiSigned = rawData[0];
                        const loSigned = rawData[1];
                        const firstSigned = (field.wordOrder || 'HI_LO') === 'HI_LO' ? hiSigned : loSigned;
                        const secondSigned = (field.wordOrder || 'HI_LO') === 'HI_LO' ? loSigned : hiSigned;
                        const unsignedValue = (firstSigned << 16) + secondSigned;
                        value = unsignedValue > 2147483647 ? unsignedValue - 4294967296 : unsignedValue;
                        break;
                    case 'float32':
                        const hiFloat = rawData[0];
                        const loFloat = rawData[1];
                        const wordOrder = field.wordOrder || 'HI_LO';
                        const isLittleEndian = (field.floatEndian || 'BE') === 'LE';
                        const w1 = wordOrder === 'HI_LO' ? hiFloat : loFloat;
                        const w2 = wordOrder === 'HI_LO' ? loFloat : hiFloat;
                        const buffer = Buffer.alloc(4);
                        if (isLittleEndian) {
                            buffer.writeUInt16LE(w1, 0);
                            buffer.writeUInt16LE(w2, 2);
                            value = buffer.readFloatLE(0);
                        }
                        else {
                            buffer.writeUInt16BE(w1, 0);
                            buffer.writeUInt16BE(w2, 2);
                            value = buffer.readFloatBE(0);
                        }
                        break;
                    default:
                        this.logger.warn(`Unsupported field type: ${field.type} for field ${field.name}`);
                        continue;
                }
                // Apply scaling
                const scale = field.scale ?? 1;
                additionalFields[field.name] = value / scale;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.warn(`Failed to read field ${field.name} at address ${field.address}: ${message}`);
            }
        }
        return additionalFields;
    }
    async testConnection() {
        try {
            if (!this.isConnected) {
                const connected = await this.connect();
                if (!connected)
                    return false;
            }
            // Try to read a single register to test connection
            await this.readHoldingRegistersWithRetry(0, 1);
            return true;
        }
        catch (error) {
            this.logger.error('Connection test failed:', error);
            return false;
        }
    }
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.socket && this.isConnected) {
            this.socket.end();
            this.socket.destroy();
        }
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.logger.info('Disconnected from Modbus device');
        this.emit('disconnected');
    }
    destroy() {
        this.disconnect();
        if (this.errorHandler) {
            this.errorHandler.destroy();
        }
        this.removeAllListeners();
    }
    getConnectionStatus() {
        return this.isConnected;
    }
    getConfig() {
        return { ...this.config };
    }
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    getDeviceId() {
        return `${this.config.host}:${this.config.port}:${this.config.unitId}`;
    }
    updateSuccessRate(success) {
        const totalOperations = this.performanceMetrics.errorCount +
            (success ? 1 : 0) +
            Math.max(0, this.performanceMetrics.retryCount);
        if (totalOperations > 0) {
            const successfulOperations = totalOperations - this.performanceMetrics.errorCount;
            this.performanceMetrics.successRate = (successfulOperations / totalOperations) * 100;
        }
    }
    // Health monitoring methods
    getHealthStatus() {
        return {
            connected: this.isConnected,
            lastConnectionTime: this.lastConnectionTime,
            connectionAttempts: this.connectionAttempts,
            performanceMetrics: this.getPerformanceMetrics()
        };
    }
    // Configuration update methods
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logger.info('Modbus client configuration updated', { newConfig });
        // If connection parameters changed, reconnect
        if (newConfig.host || newConfig.port || newConfig.unitId) {
            this.disconnect();
            this.setupClient();
        }
    }
    // Utility method for connection pooling support
    canReuse(config) {
        return this.config.host === config.host &&
            this.config.port === config.port &&
            this.config.unitId === config.unitId &&
            this.isConnected;
    }
    // Error handling and monitoring methods
    getErrorStatistics() {
        return this.errorHandler.getErrorStatistics();
    }
    resetErrorStatistics() {
        this.errorHandler.resetStatistics();
    }
    resetCircuitBreaker() {
        this.errorHandler.resetCircuitBreaker(this.getDeviceId());
    }
}
