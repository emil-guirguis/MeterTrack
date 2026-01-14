import { EventEmitter } from 'events';
import winston from 'winston';
import bacnet from 'bacstack';

export interface BACnetConfig {
  interface?: string;
  port?: number;
  broadcastAddress?: string;
  timeout?: number;
}

export interface BACnetDevice {
  deviceId: number;
  address: string;
  maxApdu?: number;
  segmentation?: number;
  vendorId?: number;
}

export interface BACnetDataPoint {
  objectType: number;
  instance: number;
  property: number;
  name: string;
  registerNumber?: number;  // NEW: The calculated element-specific register number
  fieldName?: string;       // NEW: The field_name from register table
}

/**
 * Represents a meter reading obtained from a BACnet device
 * Includes element-specific register information for proper data mapping
 */
export interface MeterReading {
  /** Timestamp when the reading was taken */
  timestamp: Date;
  
  /** Meter ID as a string */
  meterId: string;
  
  /** BACnet device ID */
  deviceId: number;
  
  /** Device IP address */
  deviceIP: string;
  
  /** Data point name or identifier */
  dataPoint: string;
  
  /** Measured value */
  value: number;
  
  /** Unit of measurement (optional) */
  unit?: string;
  
  /** Quality indicator for the reading */
  quality: 'good' | 'estimated' | 'questionable';
  
  /** Source of the reading (e.g., 'bacnet') */
  source: string;
  
  /** The calculated element-specific BACnet register number that was read */
  registerNumber?: number;
  
  /** The field_name from the register table, used as column name in meter_reading table */
  fieldName?: string;
}

/**
 * BACnetClient - Client for reading data from BACnet devices
 * Provides device discovery and property reading capabilities
 */
export class BACnetClient extends EventEmitter {
  private client: any;
  private config: BACnetConfig;
  private logger: winston.Logger;
  private isConnected: boolean = false;
  private discoveredDevices: Map<number, BACnetDevice> = new Map();

  constructor(config: BACnetConfig, logger: winston.Logger) {
    super();
    this.config = {
      interface: config.interface || '0.0.0.0',
      port: config.port || 47808,
      broadcastAddress: config.broadcastAddress || '255.255.255.255',
      timeout: config.timeout || 6000,
    };
    this.logger = logger;
    
    this.logger.info('BACnetClient initialized', {
      interface: this.config.interface,
      port: this.config.port,
      broadcastAddress: this.config.broadcastAddress,
      timeout: this.config.timeout
    });
  }

  /**
   * Connect to BACnet network
   */
  public async connect(): Promise<boolean> {
    try {
      this.client = new bacnet({
        apduTimeout: this.config.timeout,
        interface: this.config.interface,
        port: this.config.port,
        broadcastAddress: this.config.broadcastAddress
      });

      // Setup error handler
      this.client.on('error', (error: Error) => {
        this.logger.error('BACnet client error:', error);
        this.emit('error', error);
      });

      this.isConnected = true;
      this.logger.info('BACnet client connected successfully');
      this.emit('connected');
      
      return true;
    } catch (error) {
      this.logger.error('Failed to connect BACnet client:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Discover BACnet devices on the network
   * @param timeout Discovery timeout in milliseconds
   * @returns Array of discovered devices
   */
  public async discoverDevices(timeout: number = 5000): Promise<BACnetDevice[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('BACnet client not connected'));
        return;
      }

      const devices: BACnetDevice[] = [];
      const deviceIds = new Set<number>();

      this.logger.info('Starting BACnet device discovery...');

      // Listen for IAm responses
      const iAmHandler = (device: any) => {
        if (!deviceIds.has(device.deviceId)) {
          deviceIds.add(device.deviceId);
          
          const bacnetDevice: BACnetDevice = {
            deviceId: device.deviceId,
            address: device.address,
            maxApdu: device.maxApdu,
            segmentation: device.segmentation,
            vendorId: device.vendorId
          };
          
          devices.push(bacnetDevice);
          this.discoveredDevices.set(device.deviceId, bacnetDevice);
          
          this.logger.info('Discovered BACnet device', {
            deviceId: device.deviceId,
            address: device.address
          });
        }
      };

      this.client.on('iAm', iAmHandler);

      // Send WhoIs broadcast
      this.client.whoIs();

      // Wait for responses
      setTimeout(() => {
        this.client.removeListener('iAm', iAmHandler);
        this.logger.info(`Device discovery complete. Found ${devices.length} devices`);
        resolve(devices);
      }, timeout);
    });
  }

  /**
   * Read a property from a BACnet device
   * @param deviceId BACnet device ID
   * @param address Device IP address
   * @param objectType BACnet object type (e.g., bacnet.enum.ObjectType.ANALOG_INPUT)
   * @param instance Object instance number
   * @param property Property ID (e.g., bacnet.enum.PropertyIdentifier.PRESENT_VALUE)
   * @returns Property value
   */
  public async readProperty(
    deviceId: number,
    address: string,
    objectType: number,
    instance: number,
    property: number = 85 // PRESENT_VALUE
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('BACnet client not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Read property timeout for device ${deviceId}`));
      }, this.config.timeout);

      this.client.readProperty(
        address,
        { type: objectType, instance: instance },
        property,
        (err: Error, value: any) => {
          clearTimeout(timeout);
          
          if (err) {
            this.logger.error('Failed to read property', {
              deviceId,
              address,
              objectType,
              instance,
              property,
              error: err.message
            });
            reject(err);
            return;
          }

          this.logger.debug('Property read successfully', {
            deviceId,
            address,
            objectType,
            instance,
            property,
            value: value?.values?.[0]?.value
          });

          resolve(value?.values?.[0]?.value);
        }
      );
    });
  }

  /**
   * Read multiple properties from a BACnet device
   * @param deviceId BACnet device ID
   * @param address Device IP address
   * @param dataPoints Array of data points to read (may include calculated register numbers)
   * @returns Array of readings with register number and field name information
   */
  public async readMultipleProperties(
    deviceId: number,
    address: string,
    dataPoints: BACnetDataPoint[]
  ): Promise<MeterReading[]> {
    const readings: MeterReading[] = [];
    const timestamp = new Date();

    for (const dataPoint of dataPoints) {
      try {
        // Use the calculated register number if provided, otherwise use instance
        const instanceToRead = dataPoint.registerNumber ?? dataPoint.instance;

        const value = await this.readProperty(
          deviceId,
          address,
          dataPoint.objectType,
          instanceToRead,
          dataPoint.property
        );

        if (value !== undefined && value !== null) {
          const reading: MeterReading = {
            timestamp,
            meterId: `${deviceId}`,
            deviceId,
            deviceIP: address,
            dataPoint: dataPoint.name,
            value: Number(value),
            quality: 'good',
            source: 'bacnet',
            registerNumber: dataPoint.registerNumber,  // Include calculated register number
            fieldName: dataPoint.fieldName              // Include field name from register
          };

          readings.push(reading);
          this.emit('data', reading);

          this.logger.debug('BACnet read successful with register mapping', {
            deviceId,
            address,
            dataPoint: dataPoint.name,
            registerNumber: dataPoint.registerNumber,
            fieldName: dataPoint.fieldName,
            value
          });
        }
      } catch (error) {
        this.logger.error(`Failed to read data point ${dataPoint.name}`, {
          deviceId,
          address,
          dataPoint: dataPoint.name,
          registerNumber: dataPoint.registerNumber,
          fieldName: dataPoint.fieldName,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Continue with other data points even if one fails
        continue;
      }
    }

    return readings;
  }

  /**
   * Test connection to a specific BACnet device
   * @param deviceId BACnet device ID
   * @param address Device IP address
   * @returns True if device is reachable
   */
  public async testConnection(deviceId?: number, address?: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    if (!deviceId || !address) {
      // Just check if client is connected
      return this.isConnected;
    }

    try {
      // Try to read device object name as a connection test
      await this.readProperty(
        deviceId,
        address,
        8, // DEVICE object type
        deviceId,
        77 // OBJECT_NAME property
      );
      return true;
    } catch (error) {
      this.logger.warn(`Connection test failed for device ${deviceId}`, {
        address,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Disconnect from BACnet network
   */
  public disconnect(): void {
    if (this.client) {
      try {
        this.client.close();
        this.isConnected = false;
        this.logger.info('BACnet client disconnected');
        this.emit('disconnected');
      } catch (error) {
        this.logger.error('Error disconnecting BACnet client:', error);
      }
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get discovered devices
   */
  public getDiscoveredDevices(): BACnetDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disconnect();
    this.removeAllListeners();
    this.discoveredDevices.clear();
    this.logger.info('BACnetClient destroyed and resources cleaned up');
  }
}
