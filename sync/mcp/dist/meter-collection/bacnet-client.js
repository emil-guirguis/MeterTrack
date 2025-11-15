import { EventEmitter } from 'events';
import bacnet from 'bacstack';
/**
 * BACnetClient - Client for reading data from BACnet devices
 * Provides device discovery and property reading capabilities
 */
export class BACnetClient extends EventEmitter {
    client;
    config;
    logger;
    isConnected = false;
    discoveredDevices = new Map();
    constructor(config, logger) {
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
    async connect() {
        try {
            this.client = new bacnet({
                apduTimeout: this.config.timeout,
                interface: this.config.interface,
                port: this.config.port,
                broadcastAddress: this.config.broadcastAddress
            });
            // Setup error handler
            this.client.on('error', (error) => {
                this.logger.error('BACnet client error:', error);
                this.emit('error', error);
            });
            this.isConnected = true;
            this.logger.info('BACnet client connected successfully');
            this.emit('connected');
            return true;
        }
        catch (error) {
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
    async discoverDevices(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('BACnet client not connected'));
                return;
            }
            const devices = [];
            const deviceIds = new Set();
            this.logger.info('Starting BACnet device discovery...');
            // Listen for IAm responses
            const iAmHandler = (device) => {
                if (!deviceIds.has(device.deviceId)) {
                    deviceIds.add(device.deviceId);
                    const bacnetDevice = {
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
    async readProperty(deviceId, address, objectType, instance, property = 85 // PRESENT_VALUE
    ) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('BACnet client not connected'));
                return;
            }
            const timeout = setTimeout(() => {
                reject(new Error(`Read property timeout for device ${deviceId}`));
            }, this.config.timeout);
            this.client.readProperty(address, { type: objectType, instance: instance }, property, (err, value) => {
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
            });
        });
    }
    /**
     * Read multiple properties from a BACnet device
     * @param deviceId BACnet device ID
     * @param address Device IP address
     * @param dataPoints Array of data points to read
     * @returns Array of readings
     */
    async readMultipleProperties(deviceId, address, dataPoints) {
        const readings = [];
        const timestamp = new Date();
        for (const dataPoint of dataPoints) {
            try {
                const value = await this.readProperty(deviceId, address, dataPoint.objectType, dataPoint.instance, dataPoint.property);
                if (value !== undefined && value !== null) {
                    const reading = {
                        timestamp,
                        meterId: `${deviceId}`,
                        deviceId,
                        deviceIP: address,
                        dataPoint: dataPoint.name,
                        value: Number(value),
                        quality: 'good',
                        source: 'bacnet'
                    };
                    readings.push(reading);
                    this.emit('data', reading);
                }
            }
            catch (error) {
                this.logger.error(`Failed to read data point ${dataPoint.name}`, {
                    deviceId,
                    address,
                    dataPoint: dataPoint.name,
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
    async testConnection(deviceId, address) {
        if (!this.isConnected) {
            return false;
        }
        if (!deviceId || !address) {
            // Just check if client is connected
            return this.isConnected;
        }
        try {
            // Try to read device object name as a connection test
            await this.readProperty(deviceId, address, 8, // DEVICE object type
            deviceId, 77 // OBJECT_NAME property
            );
            return true;
        }
        catch (error) {
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
    disconnect() {
        if (this.client) {
            try {
                this.client.close();
                this.isConnected = false;
                this.logger.info('BACnet client disconnected');
                this.emit('disconnected');
            }
            catch (error) {
                this.logger.error('Error disconnecting BACnet client:', error);
            }
        }
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }
    /**
     * Get discovered devices
     */
    getDiscoveredDevices() {
        return Array.from(this.discoveredDevices.values());
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.disconnect();
        this.removeAllListeners();
        this.discoveredDevices.clear();
        this.logger.info('BACnetClient destroyed and resources cleaned up');
    }
}
