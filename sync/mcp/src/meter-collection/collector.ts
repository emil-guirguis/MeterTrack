import winston from 'winston';
import * as cron from 'node-cron';
import { BACnetClient, BACnetConfig, BACnetDataPoint, MeterReading } from './bacnet-client.js';
import { SyncDatabase } from '../database/index.js';
import fs from 'fs/promises';
import path from 'path';

export interface MeterConfig {
  id: string;
  name: string;
  bacnet_device_id: number;
  bacnet_ip: string;
  data_points: Array<{
    object_type: number;
    instance: number;
    property: number;
    name: string;
  }>;
}

export interface MetersConfiguration {
  description?: string;
  meters: MeterConfig[];
}

export interface CollectorConfig {
  bacnet: BACnetConfig;
  collectionInterval: number; // seconds
  configPath: string;
  autoStart: boolean;
}

export class MeterCollector {
  private bacnetClient: BACnetClient;
  private database: SyncDatabase;
  private logger: winston.Logger;
  private config: CollectorConfig;
  private meters: MeterConfig[] = [];
  private collectionTimer: NodeJS.Timeout | null = null;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private errorCount: number = 0;
  private maxErrors: number = 5;
  private meterErrorCounts: Map<string, number> = new Map();

  constructor(
    config: CollectorConfig,
    database: SyncDatabase,
    logger: winston.Logger
  ) {
    this.config = config;
    this.database = database;
    this.logger = logger;
    
    this.bacnetClient = new BACnetClient(config.bacnet, logger);
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // BACnet client events
    this.bacnetClient.on('connected', () => {
      this.logger.info('BACnet client connected');
      this.errorCount = 0; // Reset error count on successful connection
    });

    this.bacnetClient.on('error', (error) => {
      this.logger.error('BACnet client error:', error);
      this.errorCount++;
      
      if (this.errorCount >= this.maxErrors) {
        this.logger.error('Maximum error count reached, stopping data collection');
        this.stop();
      }
    });

    this.bacnetClient.on('data', async (reading: MeterReading) => {
      try {
        await this.storeReading(reading);
        this.logger.debug('Meter reading stored successfully', {
          meterId: reading.meterId,
          dataPoint: reading.dataPoint,
          value: reading.value
        });
        this.errorCount = 0; // Reset error count on successful operation
      } catch (error) {
        this.logger.error('Failed to store meter reading:', error);
        this.errorCount++;
      }
    });
  }

  /**
   * Load meter configuration from JSON file
   */
  private async loadMeterConfiguration(): Promise<void> {
    try {
      const configPath = path.resolve(this.config.configPath);
      this.logger.info(`Loading meter configuration from ${configPath}`);
      
      const configData = await fs.readFile(configPath, 'utf-8');
      const config: MetersConfiguration = JSON.parse(configData);
      
      this.meters = config.meters;
      this.logger.info(`Loaded ${this.meters.length} meters from configuration`);
      
      // Log meter details
      this.meters.forEach(meter => {
        this.logger.info(`Meter: ${meter.name} (${meter.id})`, {
          deviceId: meter.bacnet_device_id,
          ip: meter.bacnet_ip,
          dataPoints: meter.data_points.length
        });
      });
    } catch (error) {
      this.logger.error('Failed to load meter configuration:', error);
      throw error;
    }
  }

  /**
   * Store a meter reading in the Sync Database
   */
  private async storeReading(reading: MeterReading): Promise<void> {
    try {
      await this.database.insertReading({
        meter_external_id: reading.meterId,
        timestamp: reading.timestamp,
        data_point: reading.dataPoint,
        value: reading.value,
        unit: reading.unit
      });
    } catch (error) {
      this.logger.error('Failed to store reading in database:', error);
      throw error;
    }
  }

  /**
   * Initialize the collector
   */
  public async initialize(): Promise<boolean> {
    try {
      this.logger.info('Initializing meter collector...');
      
      // Load meter configuration
      await this.loadMeterConfiguration();
      
      if (this.meters.length === 0) {
        throw new Error('No meters configured');
      }
      
      // Connect to BACnet network
      const bacnetConnected = await this.bacnetClient.connect();
      if (!bacnetConnected) {
        throw new Error('Failed to connect to BACnet network');
      }

      this.logger.info('Meter collector initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize meter collector:', error);
      return false;
    }
  }

  /**
   * Start data collection
   */
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
      const intervalMs = this.config.collectionInterval * 1000;
      this.collectionTimer = setInterval(async () => {
        await this.collectAllMeters();
      }, intervalMs);

      // Schedule periodic health checks
      this.cronJob = cron.schedule('*/5 * * * *', async () => {
        await this.healthCheck();
      });

      this.isRunning = true;
      this.logger.info(`Data collection started with interval: ${this.config.collectionInterval}s`);
      
      // Collect initial data
      await this.collectAllMeters();
      
      return true;
    } catch (error) {
      this.logger.error('Failed to start data collection:', error);
      return false;
    }
  }

  /**
   * Stop data collection
   */
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

  /**
   * Shutdown the collector
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down meter collector...');
    
    this.stop();
    this.bacnetClient.disconnect();
    
    this.logger.info('Meter collector shutdown complete');
  }

  /**
   * Collect data from all configured meters
   */
  public async collectAllMeters(): Promise<void> {
    this.logger.info(`Collecting data from ${this.meters.length} meters...`);
    
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    for (const meter of this.meters) {
      try {
        await this.collectMeterData(meter);
        successCount++;
        
        // Reset error count for this meter on success
        this.meterErrorCounts.set(meter.id, 0);
      } catch (error) {
        errorCount++;
        
        // Track errors per meter
        const currentErrors = this.meterErrorCounts.get(meter.id) || 0;
        this.meterErrorCounts.set(meter.id, currentErrors + 1);
        
        this.logger.error(`Failed to collect data from meter ${meter.name} (${meter.id})`, {
          error: error instanceof Error ? error.message : String(error),
          consecutiveErrors: currentErrors + 1
        });
      }
    }

    const duration = Date.now() - startTime;
    this.logger.info('Collection cycle complete', {
      duration: `${duration}ms`,
      success: successCount,
      errors: errorCount,
      total: this.meters.length
    });
  }

  /**
   * Collect data from a single meter
   */
  private async collectMeterData(meter: MeterConfig): Promise<void> {
    this.logger.debug(`Collecting data from meter ${meter.name} (${meter.id})`);
    
    // Convert config data points to BACnet data points
    const dataPoints: BACnetDataPoint[] = meter.data_points.map(dp => ({
      objectType: dp.object_type,
      instance: dp.instance,
      property: dp.property,
      name: dp.name
    }));

    // Read all data points from the meter
    const readings = await this.bacnetClient.readMultipleProperties(
      meter.bacnet_device_id,
      meter.bacnet_ip,
      dataPoints
    );

    // Store each reading
    for (const reading of readings) {
      // Update meterId to use the configured meter ID
      reading.meterId = meter.id;
      await this.storeReading(reading);
    }

    this.logger.debug(`Collected ${readings.length} readings from meter ${meter.name}`);
  }

  /**
   * Perform health check on all meters
   */
  private async healthCheck(): Promise<void> {
    try {
      this.logger.debug('Performing health check...');
      
      let healthyCount = 0;
      let unhealthyCount = 0;

      for (const meter of this.meters) {
        const isHealthy = await this.bacnetClient.testConnection(
          meter.bacnet_device_id,
          meter.bacnet_ip
        );
        
        if (isHealthy) {
          healthyCount++;
        } else {
          unhealthyCount++;
          this.logger.warn(`Meter ${meter.name} (${meter.id}) health check failed`);
        }
      }

      this.logger.info('Health check complete', {
        healthy: healthyCount,
        unhealthy: unhealthyCount,
        total: this.meters.length
      });
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  /**
   * Get collector status
   */
  public async getStatus(): Promise<any> {
    const meterStatuses = await Promise.all(
      this.meters.map(async (meter) => {
        const errorCount = this.meterErrorCounts.get(meter.id) || 0;
        const isHealthy = await this.bacnetClient.testConnection(
          meter.bacnet_device_id,
          meter.bacnet_ip
        );
        
        return {
          id: meter.id,
          name: meter.name,
          deviceId: meter.bacnet_device_id,
          ip: meter.bacnet_ip,
          isHealthy,
          errorCount,
          dataPointCount: meter.data_points.length
        };
      })
    );

    return {
      isRunning: this.isRunning,
      errorCount: this.errorCount,
      bacnetConnected: this.bacnetClient.getConnectionStatus(),
      collectionInterval: this.config.collectionInterval,
      meterCount: this.meters.length,
      meters: meterStatuses,
      uptime: process.uptime()
    };
  }

  /**
   * Get latest readings for a specific meter
   */
  public async getLatestReadings(meterId: string, limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT 
          meter_external_id,
          timestamp,
          data_point,
          value,
          unit,
          is_synchronized
        FROM meter_reading
        WHERE meter_external_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `;
      
      const result = await this.database.query(query, [meterId, limit]);
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get latest readings:', error);
      return [];
    }
  }

  /**
   * Get statistics for a meter
   */
  public async getStatistics(meterId: string, hours: number = 24): Promise<any> {
    try {
      const query = `
        SELECT 
          data_point,
          COUNT(*) as reading_count,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          MIN(timestamp) as first_reading,
          MAX(timestamp) as last_reading
        FROM meter_reading
        WHERE meter_external_id = $1
          AND timestamp >= NOW() - INTERVAL '${hours} hours'
        GROUP BY data_point
        ORDER BY data_point
      `;
      
      const result = await this.database.query(query, [meterId]);
      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get statistics:', error);
      return [];
    }
  }
}
