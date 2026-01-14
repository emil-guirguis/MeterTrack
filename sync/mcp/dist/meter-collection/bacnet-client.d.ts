import { EventEmitter } from 'events';
import winston from 'winston';
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
    registerNumber?: number;
    fieldName?: string;
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
export declare class BACnetClient extends EventEmitter {
    private client;
    private config;
    private logger;
    private isConnected;
    private discoveredDevices;
    constructor(config: BACnetConfig, logger: winston.Logger);
    /**
     * Connect to BACnet network
     */
    connect(): Promise<boolean>;
    /**
     * Discover BACnet devices on the network
     * @param timeout Discovery timeout in milliseconds
     * @returns Array of discovered devices
     */
    discoverDevices(timeout?: number): Promise<BACnetDevice[]>;
    /**
     * Read a property from a BACnet device
     * @param deviceId BACnet device ID
     * @param address Device IP address
     * @param objectType BACnet object type (e.g., bacnet.enum.ObjectType.ANALOG_INPUT)
     * @param instance Object instance number
     * @param property Property ID (e.g., bacnet.enum.PropertyIdentifier.PRESENT_VALUE)
     * @returns Property value
     */
    readProperty(deviceId: number, address: string, objectType: number, instance: number, property?: number): Promise<any>;
    /**
     * Read multiple properties from a BACnet device
     * @param deviceId BACnet device ID
     * @param address Device IP address
     * @param dataPoints Array of data points to read (may include calculated register numbers)
     * @returns Array of readings with register number and field name information
     */
    readMultipleProperties(deviceId: number, address: string, dataPoints: BACnetDataPoint[]): Promise<MeterReading[]>;
    /**
     * Test connection to a specific BACnet device
     * @param deviceId BACnet device ID
     * @param address Device IP address
     * @returns True if device is reachable
     */
    testConnection(deviceId?: number, address?: string): Promise<boolean>;
    /**
     * Disconnect from BACnet network
     */
    disconnect(): void;
    /**
     * Get connection status
     */
    getConnectionStatus(): boolean;
    /**
     * Get discovered devices
     */
    getDiscoveredDevices(): BACnetDevice[];
    /**
     * Cleanup resources
     */
    destroy(): void;
}
