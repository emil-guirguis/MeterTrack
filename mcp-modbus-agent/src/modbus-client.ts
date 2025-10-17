import { EventEmitter } from 'events';
import winston from 'winston';
import { EnhancedModbusClient } from './enhanced-modbus-client.js';
import { ModbusClientConfig } from './types/modbus.js';

// Legacy interface for backward compatibility
export interface ModbusConfig {
  ip: string;
  port: number;
  slaveId: number;
  timeout: number;
}

export interface MeterReading {
  timestamp: Date;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
  temperature?: number;
  quality: 'good' | 'estimated' | 'questionable';
  source: string;
  deviceIP: string;
  meterId: string;
  slaveId: number;
  
  // Legacy/calculated fields
  kWh?: number;
  kW?: number;
  V?: number;
  A?: number;
  dPF?: number;
  dPFchannel?: number;
  kWpeak?: number;
  kVARh?: number;
  kVAh?: number;
  
  // Per-phase measurements
  phaseAVoltage?: number;
  phaseBVoltage?: number;
  phaseCVoltage?: number;
  phaseACurrent?: number;
  phaseBCurrent?: number;
  phaseCCurrent?: number;
  phaseAPower?: number;
  phaseBPower?: number;
  phaseCPower?: number;
}

/**
 * ModbusClient - Enhanced wrapper using node-modbus library
 * Maintains backward compatibility while providing improved performance and connection management
 */
export class ModbusClient extends EventEmitter {
  private enhancedClient: EnhancedModbusClient;
  private config: ModbusConfig;
  private logger: winston.Logger;

  constructor(config: ModbusConfig, logger: winston.Logger) {
    super();
    this.config = config;
    this.logger = logger;
    
    // Convert legacy config to enhanced config format
    const enhancedConfig: ModbusClientConfig = {
      host: config.ip,
      port: config.port,
      unitId: config.slaveId,
      timeout: config.timeout,
      maxRetries: 3,
      reconnectDelay: 5000,
      keepAlive: true
    };
    
    // Create enhanced client with improved capabilities
    this.enhancedClient = new EnhancedModbusClient(enhancedConfig, logger);
    this.setupEventHandlers();
    
    this.logger.info('ModbusClient initialized with enhanced node-modbus implementation', {
      host: config.ip,
      port: config.port,
      unitId: config.slaveId,
      timeout: config.timeout
    });
  }

  private setupEventHandlers(): void {
    // Forward events from enhanced client to maintain compatibility
    this.enhancedClient.on('connected', () => {
      this.logger.info('Enhanced Modbus client connected');
      this.emit('connected');
    });

    this.enhancedClient.on('disconnected', () => {
      this.logger.info('Enhanced Modbus client disconnected');
      this.emit('disconnected');
    });

    this.enhancedClient.on('error', (error) => {
      this.logger.error('Enhanced Modbus client error:', error);
      this.emit('error', error);
    });

    this.enhancedClient.on('data', (data) => {
      this.emit('data', data);
    });
  }

  public async connect(): Promise<boolean> {
    try {
      const connected = await this.enhancedClient.connect();
      if (connected) {
        this.logger.info(`Enhanced Modbus client connected to ${this.config.ip}:${this.config.port}`);
      }
      return connected;
    } catch (error) {
      this.logger.error(`Failed to connect enhanced Modbus client: ${error}`);
      return false;
    }
  }

  public async readMeterData(): Promise<MeterReading | null> {
    try {
      // Delegate to enhanced client which handles all the complex logic
      const reading = await this.enhancedClient.readMeterData();
      
      if (reading) {
        // Update source to maintain backward compatibility
        reading.source = 'modbus-enhanced';
        
        // Log with enhanced monitoring capabilities
        const metrics = this.enhancedClient.getPerformanceMetrics();
        this.logger.info('Enhanced meter data read successfully', {
          voltage: `${reading.voltage.toFixed(2)}V`,
          current: `${reading.current.toFixed(2)}A`,
          power: `${reading.power}W`,
          powerFactor: reading.powerFactor.toFixed(3),
          responseTime: `${metrics.readTime}ms`,
          successRate: `${metrics.successRate.toFixed(1)}%`
        });
      }
      
      return reading;
    } catch (error) {
      this.logger.error('Failed to read meter data with enhanced client:', error);
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.enhancedClient.testConnection();
      this.logger.info(`Enhanced connection test ${result ? 'passed' : 'failed'}`);
      return result;
    } catch (error) {
      this.logger.error('Enhanced connection test failed:', error);
      return false;
    }
  }

  public disconnect(): void {
    this.enhancedClient.disconnect();
    this.logger.info('Enhanced Modbus client disconnected');
  }

  public getConnectionStatus(): boolean {
    return this.enhancedClient.getConnectionStatus();
  }

  // Enhanced monitoring methods for better observability
  public getPerformanceMetrics() {
    return this.enhancedClient.getPerformanceMetrics();
  }

  public getHealthStatus() {
    return this.enhancedClient.getHealthStatus();
  }

  public getErrorStatistics() {
    return this.enhancedClient.getErrorStatistics();
  }

  // Cleanup method for proper resource management
  public destroy(): void {
    this.enhancedClient.destroy();
    this.removeAllListeners();
    this.logger.info('ModbusClient destroyed and resources cleaned up');
  }
}