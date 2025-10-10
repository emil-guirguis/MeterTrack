import cron from 'node-cron';
import { ModbusClient } from './modbus-client.js';
import { PostgresDatabaseManager } from './postgres-database-manager.js';
export class DataCollector {
    modbusClient;
    databaseManager;
    logger;
    config;
    collectionTimer = null;
    cronJob = null;
    isRunning = false;
    errorCount = 0;
    maxErrors = 5;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.modbusClient = new ModbusClient(config.modbus, logger);
        this.databaseManager = new PostgresDatabaseManager(config.database, logger);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Modbus client events
        this.modbusClient.on('connected', () => {
            this.logger.info('Modbus client connected');
            this.errorCount = 0; // Reset error count on successful connection
        });
        this.modbusClient.on('error', (error) => {
            this.logger.error('Modbus client error:', error);
            this.errorCount++;
            if (this.errorCount >= this.maxErrors) {
                this.logger.error('Maximum error count reached, stopping data collection');
                this.stop();
            }
        });
        this.modbusClient.on('data', async (reading) => {
            try {
                await this.databaseManager.insertMeterReading(reading);
                this.logger.debug('Meter reading stored successfully');
                this.errorCount = 0; // Reset error count on successful operation
            }
            catch (error) {
                this.logger.error('Failed to store meter reading:', error);
                this.errorCount++;
            }
        });
    }
    async initialize() {
        try {
            this.logger.info('Initializing data collector...');
            // Connect to database
            const dbConnected = await this.databaseManager.connect();
            if (!dbConnected) {
                throw new Error('Failed to connect to database');
            }
            // Connect to Modbus device
            const modbusConnected = await this.modbusClient.connect();
            if (!modbusConnected) {
                throw new Error('Failed to connect to Modbus device');
            }
            this.logger.info('Data collector initialized successfully');
            return true;
        }
        catch (error) {
            this.logger.error('Failed to initialize data collector:', error);
            return false;
        }
    }
    async start() {
        if (this.isRunning) {
            this.logger.warn('Data collection is already running');
            return true;
        }
        try {
            const initialized = await this.initialize();
            if (!initialized) {
                return false;
            }
            // Start data collection timer
            this.collectionTimer = setInterval(async () => {
                await this.collectData();
            }, this.config.collectionInterval);
            // Schedule periodic connection health checks
            this.cronJob = cron.schedule('*/5 * * * *', async () => {
                await this.healthCheck();
            });
            this.isRunning = true;
            this.logger.info(`Data collection started with interval: ${this.config.collectionInterval}ms`);
            // Collect initial data point
            await this.collectData();
            return true;
        }
        catch (error) {
            this.logger.error('Failed to start data collection:', error);
            return false;
        }
    }
    stop() {
        if (!this.isRunning) {
            this.logger.warn('Data collection is not running');
            return;
        }
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = null;
        }
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
        }
        this.isRunning = false;
        this.logger.info('Data collection stopped');
    }
    async shutdown() {
        this.logger.info('Shutting down data collector...');
        this.stop();
        this.modbusClient.disconnect();
        await this.databaseManager.disconnect();
        this.logger.info('Data collector shutdown complete');
    }
    async collectData() {
        try {
            const reading = await this.modbusClient.readMeterData();
            if (reading) {
                this.logger.debug('Data collected successfully', {
                    timestamp: reading.timestamp,
                    voltage: reading.voltage,
                    current: reading.current,
                    power: reading.power
                });
            }
            return reading;
        }
        catch (error) {
            this.logger.error('Failed to collect data:', error);
            return null;
        }
    }
    async healthCheck() {
        try {
            this.logger.debug('Performing health check...');
            // Check Modbus connection
            const modbusOk = await this.modbusClient.testConnection();
            if (!modbusOk) {
                this.logger.warn('Modbus connection health check failed');
            }
            // Check database connection
            const dbOk = await this.databaseManager.testConnection();
            if (!dbOk) {
                this.logger.warn('Database connection health check failed');
            }
            if (modbusOk && dbOk) {
                this.logger.debug('Health check passed');
            }
        }
        catch (error) {
            this.logger.error('Health check failed:', error);
        }
    }
    async getStatus() {
        return {
            isRunning: this.isRunning,
            errorCount: this.errorCount,
            modbusConnected: this.modbusClient.getConnectionStatus(),
            databaseConnected: this.databaseManager.getConnectionStatus(),
            collectionInterval: this.config.collectionInterval,
            uptime: process.uptime()
        };
    }
    async getLatestReading() {
        const meterId = `${this.config.modbus.ip}_${this.config.modbus.slaveId}`;
        return await this.databaseManager.getLatestReading(meterId);
    }
    async getStatistics(hours = 24) {
        const meterId = `${this.config.modbus.ip}_${this.config.modbus.slaveId}`;
        return await this.databaseManager.getStatistics(meterId, hours);
    }
}
