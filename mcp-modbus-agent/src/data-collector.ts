import winston from 'winston';
import cron from 'node-cron';
import { ModbusClient, ModbusConfig, MeterReading } from './modbus-client.js';
import { DatabaseManager, DatabaseConfig } from './database-manager.js';

export interface DataCollectorConfig {
  modbus: ModbusConfig;
  database: DatabaseConfig;
  collectionInterval: number; // milliseconds
  autoStart: boolean;
}

export class DataCollector {
  public readonly modbusClient: ModbusClient;
  public readonly databaseManager: DatabaseManager;
  private logger: winston.Logger;
  private config: DataCollectorConfig;
  private collectionTimer: NodeJS.Timeout | null = null;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private errorCount: number = 0;
  private maxErrors: number = 5;

  constructor(config: DataCollectorConfig, logger: winston.Logger) {
    this.config = config;
    this.logger = logger;
    
    this.modbusClient = new ModbusClient(config.modbus, logger);
    this.databaseManager = new DatabaseManager(config.database, logger);
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
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

    this.modbusClient.on('data', async (reading: MeterReading) => {
      try {
        await this.databaseManager.insertMeterReading(reading);
        this.logger.debug('Meter reading stored successfully');
        this.errorCount = 0; // Reset error count on successful operation
      } catch (error) {
        this.logger.error('Failed to store meter reading:', error);
        this.errorCount++;
      }
    });
  }

  public async initialize(): Promise<boolean> {
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
    } catch (error) {
      this.logger.error('Failed to initialize data collector:', error);
      return false;
    }
  }

  public async start(): Promise<boolean> {
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
    } catch (error) {
      this.logger.error('Failed to start data collection:', error);
      return false;
    }
  }

  public stop(): void {
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

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down data collector...');
    
    this.stop();
    
    this.modbusClient.disconnect();
    await this.databaseManager.disconnect();
    
    this.logger.info('Data collector shutdown complete');
  }

  public async collectData(): Promise<MeterReading | null> {
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
    } catch (error) {
      this.logger.error('Failed to collect data:', error);
      return null;
    }
  }

  private async healthCheck(): Promise<void> {
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
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  public async getStatus(): Promise<any> {
    return {
      isRunning: this.isRunning,
      errorCount: this.errorCount,
      modbusConnected: this.modbusClient.getConnectionStatus(),
      databaseConnected: this.databaseManager.getConnectionStatus(),
      collectionInterval: this.config.collectionInterval,
      uptime: process.uptime()
    };
  }

  public async getLatestReading(): Promise<MeterReading | null> {
    const meterId = `${this.config.modbus.ip}_${this.config.modbus.slaveId}`;
    return await this.databaseManager.getLatestReading(meterId);
  }

  public async getStatistics(hours: number = 24): Promise<any> {
    const meterId = `${this.config.modbus.ip}_${this.config.modbus.slaveId}`;
    return await this.databaseManager.getStatistics(meterId, hours);
  }
}