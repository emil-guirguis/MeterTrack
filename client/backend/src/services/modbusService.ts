import jsmodbus from 'jsmodbus';
import { Socket } from 'net';
import { 
  ModbusClientConfig, 
  MeterReading, 
  ModbusError, 
  ModbusErrorType,
  RegisterConfig,
  ModbusServiceInterface,
  ConnectionPoolConfig
} from '../types/modbus.js';

interface ModbusClient {
  client: any;
  socket: Socket;
  config: ModbusClientConfig;
  lastUsed: Date;
  isConnected: boolean;
}

interface RegisterMapping {
  [key: string]: RegisterConfig;
}

interface MeterReadResult {
  deviceIP: string;
  timestamp: Date;
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Enhanced Modbus service using node-modbus library with connection pooling
 * Provides type-safe interfaces for all Modbus operations
 */
export class ModbusService implements ModbusServiceInterface {
  private clients: Map<string, ModbusClient> = new Map();
  private poolConfig: ConnectionPoolConfig;

  constructor(poolConfig: Partial<ConnectionPoolConfig> = {}) {
    this.poolConfig = {
      maxConnections: poolConfig.maxConnections ?? 10,
      idleTimeout: poolConfig.idleTimeout ?? 300000, // 5 minutes
      acquireTimeout: poolConfig.acquireTimeout ?? 30000, // 30 seconds
      createRetryInterval: poolConfig.createRetryInterval ?? 5000,
      maxRetries: poolConfig.maxRetries ?? 3,
      healthCheckInterval: poolConfig.healthCheckInterval ?? 60000
    };

    // Start cleanup interval
    setInterval(() => this.cleanupIdleConnections(), this.poolConfig.idleTimeout / 2);
  }

  /**
   * Connect to a Modbus TCP device with connection pooling
   */
  public async connectDevice(deviceIP: string, port: number = 502, slaveId: number = 1): Promise<any> {
    const clientKey = `${deviceIP}:${port}:${slaveId}`;
    console.log(`[ModbusService] Attempting connection to ${deviceIP}:${port} (slaveId=${slaveId})`);

    // Check for existing connection
    const existingClient = this.clients.get(clientKey);
    if (existingClient && existingClient.isConnected) {
      console.log(`[ModbusService] Reusing existing client for ${clientKey}`);
      existingClient.lastUsed = new Date();
      return existingClient.client;
    }

    // Check connection pool limits
    if (this.clients.size >= this.poolConfig.maxConnections) {
      // Remove oldest idle connection
      this.removeOldestIdleConnection();
    }

    try {
      const socket = new Socket();
      const client = new jsmodbus.client.TCP(socket, slaveId, 5000); // 5 second timeout

      // Connect with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new ModbusError(
            'Connection timeout',
            ModbusErrorType.TIMEOUT,
            clientKey
          ));
        }, this.poolConfig.acquireTimeout);

        socket.connect(port, deviceIP);
        socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        socket.once('error', (error) => {
          clearTimeout(timeout);
          reject(new ModbusError(
            `Connection failed: ${error.message}`,
            ModbusErrorType.CONNECTION_FAILED,
            clientKey
          ));
        });
      });

      const modbusClient: ModbusClient = {
        client,
        socket,
        config: { host: deviceIP, port, unitId: slaveId, timeout: 5000 },
        lastUsed: new Date(),
        isConnected: true
      };

      // Set up error handlers
      socket.on('error', (error) => {
        console.error(`[ModbusService] Socket error for ${clientKey}:`, error);
        modbusClient.isConnected = false;
      });

      socket.on('close', () => {
        console.log(`[ModbusService] Connection closed for ${clientKey}`);
        modbusClient.isConnected = false;
      });

      this.clients.set(clientKey, modbusClient);
      console.log(`[ModbusService] Connected to ${clientKey}`);
      return client;

    } catch (error) {
      console.error(`[ModbusService] Connection failed for ${clientKey}:`, error);
      throw new ModbusError(
        `Failed to connect to Modbus device at ${deviceIP}:${port} - ${error instanceof Error ? error.message : String(error)}`,
        ModbusErrorType.CONNECTION_FAILED,
        clientKey
      );
    }
  }

  /**
   * Read energy meter data from a Modbus device with enhanced type safety
   */
  public async readMeterData(deviceIP: string, config: Partial<ModbusClientConfig> = {}): Promise<MeterReadResult> {
    const {
      port = 502,
      unitId = 1,
      registers = this.getDefaultRegisterMapping()
    } = config;

    let client: any;
    try {
      client = await this.connectDevice(deviceIP, port, unitId);
      console.log(`[ModbusService] Connected, starting register reads for ${deviceIP}`);
      
      const readings: Record<string, number | number[] | null> = {};

      // Read each register type with error handling
      for (const [key, regConfig] of Object.entries(registers)) {
        try {
          console.log(`[ModbusService] Reading ${key}: address=${regConfig.address}, count=${regConfig.count}`);
          
          const result = await client.readHoldingRegisters(regConfig.address, regConfig.count);
          console.log(`[ModbusService] ${key} raw data:`, result.response.body.values);
          
          const rawData = result.response.body.values;
          
          const scale = regConfig.scale ?? 1;
          
          if (regConfig.count === 1) {
            readings[key] = rawData[0] / scale;
          } else if (regConfig.count === 2) {
            // Handle 32-bit values
            const hi = rawData[0];
            const lo = rawData[1];
            const combined = (hi << 16) + lo;
            readings[key] = combined / scale;
          } else {
            readings[key] = rawData.map((val: number) => val / scale);
          }
        } catch (regError) {
          console.warn(`[ModbusService] Failed to read ${key} from ${deviceIP}: ${regError instanceof Error ? regError.message : String(regError)}`);
          readings[key] = null;
        }
      }

      console.log(`[ModbusService] Final readings:`, readings);
      return {
        deviceIP,
        timestamp: new Date(),
        success: true,
        data: readings
      };

    } catch (error) {
      console.error(`[ModbusService] Error during meter read:`, error);
      return {
        deviceIP,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: null
      };
    }
  }

  /**
   * Read input registers with type safety
   */
  public async readInputRegisters(
    deviceIP: string, 
    startAddress: number, 
    count: number, 
    options: Partial<ModbusClientConfig> = {}
  ): Promise<MeterReadResult> {
    const { port = 502, unitId = 1 } = options;
    
    let client: any;
    try {
      client = await this.connectDevice(deviceIP, port, unitId);
      const result = await client.readInputRegisters(startAddress, count);
      
      return {
        deviceIP,
        timestamp: new Date(),
        success: true,
        data: result.response.body.values
      };
    } catch (error) {
      return {
        deviceIP,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: null
      };
    }
  }

  /**
   * Test connection to a Modbus device
   */
  public async testConnection(deviceIP: string, port: number = 502, slaveId: number = 1): Promise<boolean> {
    let client: any;
    try {
      client = await this.connectDevice(deviceIP, port, slaveId);
      // Try to read a single register to test connection
      await client.readHoldingRegisters(0, 1);
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${deviceIP}:${port} - ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Close all Modbus connections
   */
  public closeAllConnections(): void {
    for (const [key, modbusClient] of this.clients) {
      try {
        modbusClient.socket.end();
        modbusClient.socket.destroy();
      } catch (error) {
        console.warn(`Error closing connection ${key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    this.clients.clear();
  }

  /**
   * Close specific connection
   */
  public closeConnection(deviceIP: string, port: number = 502, slaveId: number = 1): void {
    const clientKey = `${deviceIP}:${port}:${slaveId}`;
    const modbusClient = this.clients.get(clientKey);
    
    if (modbusClient) {
      try {
        modbusClient.socket.end();
        modbusClient.socket.destroy();
        this.clients.delete(clientKey);
      } catch (error) {
        console.warn(`Error closing connection ${clientKey}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get connection pool statistics
   */
  public getPoolStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
  } {
    let activeConnections = 0;
    let idleConnections = 0;

    for (const modbusClient of this.clients.values()) {
      if (modbusClient.isConnected) {
        const idleTime = Date.now() - modbusClient.lastUsed.getTime();
        if (idleTime < 60000) { // Active if used within last minute
          activeConnections++;
        } else {
          idleConnections++;
        }
      }
    }

    return {
      totalConnections: this.clients.size,
      activeConnections,
      idleConnections
    };
  }

  /**
   * Get default register mapping based on real meter configuration
   */
  private getDefaultRegisterMapping(): RegisterMapping {
    return {
      // REAL METER MAPPING - Based on actual device at 10.10.10.11:502
      voltage: { address: 5, count: 1, scale: 200 },    // Register 5, scale by 200
      current: { address: 6, count: 1, scale: 100 },    // Register 6, scale by 100  
      power: { address: 7, count: 1, scale: 1 },        // Register 7, direct watts
      energy: { address: 8, count: 1, scale: 1 },       // Register 8 estimate
      frequency: { address: 0, count: 1, scale: 10 },   // Register 0, scale by 10
      powerFactor: { address: 9, count: 1, scale: 1000 }, // Register 9 estimate
      
      // Phase voltages
      phaseAVoltage: { address: 12, count: 1, scale: 10 },
      phaseBVoltage: { address: 14, count: 1, scale: 10 },
      phaseCVoltage: { address: 16, count: 1, scale: 10 },
      
      // Phase currents
      phaseACurrent: { address: 18, count: 1, scale: 100 },
      phaseBCurrent: { address: 20, count: 1, scale: 100 },
      phaseCCurrent: { address: 22, count: 1, scale: 100 },
      
      // Phase powers
      phaseAPower: { address: 24, count: 1, scale: 1 },
      phaseBPower: { address: 26, count: 1, scale: 1 },
      phaseCPower: { address: 28, count: 1, scale: 1 },
      
      // Line-to-line voltages
      lineToLineVoltageAB: { address: 30, count: 1, scale: 10 },
      lineToLineVoltageBC: { address: 32, count: 1, scale: 10 },
      lineToLineVoltageCA: { address: 34, count: 1, scale: 10 },
      
      // Power measurements
      totalReactivePower: { address: 36, count: 1, scale: 1 },
      totalApparentPower: { address: 38, count: 1, scale: 1 },
      
      // Energy measurements
      totalActiveEnergyWh: { address: 40, count: 2, scale: 1 },
      totalReactiveEnergyVARh: { address: 42, count: 2, scale: 1 },
      totalApparentEnergyVAh: { address: 44, count: 2, scale: 1 },
      
      // Additional measurements
      temperatureC: { address: 46, count: 1, scale: 10 },
      neutralCurrent: { address: 48, count: 1, scale: 100 },
      
      // Power factor per phase
      phaseAPowerFactor: { address: 50, count: 1, scale: 1000 },
      phaseBPowerFactor: { address: 52, count: 1, scale: 1000 },
      phaseCPowerFactor: { address: 54, count: 1, scale: 1000 },
      
      // Harmonic distortion
      voltageThd: { address: 56, count: 1, scale: 100 },
      currentThd: { address: 58, count: 1, scale: 100 },
      
      // Demand measurements
      maxDemandKW: { address: 60, count: 1, scale: 1 },
      maxDemandKVAR: { address: 62, count: 1, scale: 1 },
      maxDemandKVA: { address: 64, count: 1, scale: 1 }
    };
  }

  /**
   * Clean up idle connections
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    for (const [key, modbusClient] of this.clients) {
      const idleTime = now - modbusClient.lastUsed.getTime();
      if (idleTime > this.poolConfig.idleTimeout) {
        connectionsToRemove.push(key);
      }
    }

    for (const key of connectionsToRemove) {
      const modbusClient = this.clients.get(key);
      if (modbusClient) {
        try {
          modbusClient.socket.end();
          modbusClient.socket.destroy();
        } catch (error) {
          console.warn(`Error closing idle connection ${key}: ${error instanceof Error ? error.message : String(error)}`);
        }
        this.clients.delete(key);
        console.log(`[ModbusService] Cleaned up idle connection: ${key}`);
      }
    }
  }

  /**
   * Remove oldest idle connection to make room for new connections
   */
  private removeOldestIdleConnection(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, modbusClient] of this.clients) {
      if (modbusClient.lastUsed.getTime() < oldestTime) {
        oldestTime = modbusClient.lastUsed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const modbusClient = this.clients.get(oldestKey);
      if (modbusClient) {
        try {
          modbusClient.socket.end();
          modbusClient.socket.destroy();
        } catch (error) {
          console.warn(`Error closing oldest connection ${oldestKey}: ${error instanceof Error ? error.message : String(error)}`);
        }
        this.clients.delete(oldestKey);
        console.log(`[ModbusService] Removed oldest connection to make room: ${oldestKey}`);
      }
    }
  }
}

// Create singleton instance with default configuration
const modbusService = new ModbusService({
  maxConnections: 10,
  idleTimeout: 300000, // 5 minutes
  acquireTimeout: 30000 // 30 seconds
});

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('Closing Modbus connections...');
  modbusService.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing Modbus connections...');
  modbusService.closeAllConnections();
  process.exit(0);
});

export default modbusService;