/**
 * BACnet client wrapper for communication with BACnet devices
 */

import BACnetStack from 'bacstack';
import { BACnetReadResult } from './types.js';

/**
 * Maps BACnet object type names to numeric IDs
 */
const OBJECT_TYPE_MAP: Record<string, number> = {
  analogInput: 0,
  analogOutput: 1,
  analogValue: 2,
  binaryInput: 3,
  binaryOutput: 4,
  binaryValue: 5,
  multiStateInput: 13,
  multiStateOutput: 14,
  multiStateValue: 19,
};

/**
 * Maps BACnet property names to numeric IDs
 */
const PROPERTY_ID_MAP: Record<string, number> = {
  presentValue: 85,
  units: 117,
  status: 112,
  description: 28,
  objectName: 77,
  objectType: 79,
  deviceType: 30,
};

export class BACnetClient {
  private client: any = null;
  private readonly bacnetInterface: string;
  private readonly bacnetPort: number;

  constructor(bacnetInterface: string = '0.0.0.0', bacnetPort: number = 47808) {
    this.bacnetInterface = bacnetInterface;
    this.bacnetPort = bacnetPort;
  }

  /**
   * Initialize the BACnet client
   */
  private initializeClient(): void {
    if (!this.client) {
      this.client = new BACnetStack({
        interface: this.bacnetInterface,
        port: this.bacnetPort,
      });

      // Setup error handler
      this.client.on('error', (error: Error) => {
        console.error('BACnet client error:', error);
      });
    }
  }

  /**
   * Convert object type name to numeric ID
   */
  private getObjectTypeId(objectType: string): number {
    const id = OBJECT_TYPE_MAP[objectType];
    if (id === undefined) {
      throw new Error(`Unknown object type: ${objectType}`);
    }
    return id;
  }

  /**
   * Convert property name to numeric ID
   */
  private getPropertyId(propertyId: string): number {
    const id = PROPERTY_ID_MAP[propertyId];
    if (id === undefined) {
      throw new Error(`Unknown property: ${propertyId}`);
    }
    return id;
  }

  /**
   * Read a single BACnet property
   */
  async readProperty(
    ip: string,
    port: number,
    objectType: string,
    objectInstance: number,
    propertyId: string,
    timeoutMs: number
  ): Promise<BACnetReadResult> {
    try {
      this.initializeClient();

      // Convert string identifiers to numeric IDs
      const objectTypeId = this.getObjectTypeId(objectType);
      const propertyIdNum = this.getPropertyId(propertyId);

      // Format the address as "ip:port"
      const address = `${ip}:${port}`;

      return new Promise((resolve) => {
        // Set up timeout
        const timeoutHandle = setTimeout(() => {
          console.error(`BACnet read timeout for ${address}, object ${objectType}:${objectInstance}, property ${propertyId}`);
          resolve({
            success: false,
            error: `Read timeout after ${timeoutMs}ms`,
          });
        }, timeoutMs);

        try {
          // Perform the read
          this.client!.readProperty(
            address,
            { type: objectTypeId, instance: objectInstance },
            propertyIdNum,
            (error: Error | null, value: any) => {
              clearTimeout(timeoutHandle);

              if (error) {
                console.error(`BACnet read error for ${address}:`, error.message);
                resolve({
                  success: false,
                  error: error.message,
                });
                return;
              }

              // Extract the value from the response
              if (value && value.values && value.values.length > 0) {
                const readValue = value.values[0].value;
                console.log(`BACnet read successful: ${address} ${objectType}:${objectInstance} ${propertyId} = ${readValue}`);
                resolve({
                  success: true,
                  value: readValue,
                });
              } else {
                console.error(`BACnet read returned empty value for ${address}`);
                resolve({
                  success: false,
                  error: 'Empty response from device',
                });
              }
            }
          );
        } catch (err) {
          clearTimeout(timeoutHandle);
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`BACnet read exception for ${address}:`, errorMsg);
          resolve({
            success: false,
            error: errorMsg,
          });
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`BACnet read error:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Close BACnet connections gracefully
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        this.client.close();
        console.log('BACnet client closed successfully');
      } catch (error) {
        console.error('Error closing BACnet client:', error);
      } finally {
        this.client = null;
      }
    }
  }
}
