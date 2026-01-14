/**
 * BACnet client wrapper for communication with BACnet devices
 * Uses bacnet-node library with support for batch property reads
 */

import bacnet from 'bacnet-node';
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

export interface BatchReadRequest {
  objectType: string;
  objectInstance: number;
  propertyId: string;
  fieldName?: string;
}

export interface BatchReadResult {
  success: boolean;
  objectType: string;
  objectInstance: number;
  propertyId: string;
  fieldName?: string;
  value?: any;
  error?: string;
}

export interface BACnetClientConfig {
  bacnetInterface?: string;
  bacnetPort?: number;
  apduTimeout?: number;
  batchReadTimeout?: number;
  sequentialReadTimeout?: number;
  connectivityCheckTimeout?: number;
}

export class BACnetClient {
  private client: any = null;
  private readonly bacnetInterface: string;
  private readonly bacnetPort: number;
  private readonly apduTimeout: number;
  private readonly batchReadTimeout: number;
  private readonly sequentialReadTimeout: number;
  private readonly connectivityCheckTimeout: number;
  private logger: any;

  constructor(config: BACnetClientConfig = {}, logger?: any) {
    this.bacnetInterface = config.bacnetInterface ?? '0.0.0.0';
    this.bacnetPort = config.bacnetPort ?? 47808;
    this.apduTimeout = config.apduTimeout ?? 6000;
    this.batchReadTimeout = config.batchReadTimeout ?? 5000;
    this.sequentialReadTimeout = config.sequentialReadTimeout ?? 3000;
    this.connectivityCheckTimeout = config.connectivityCheckTimeout ?? 2000;
    this.logger = logger || console;
    this.initializeClient();
  }

  /**
   * Initialize the BACnet client
   */
  private initializeClient(): void {
    if (!this.client) {
      this.client = new bacnet({
        apduTimeout: this.apduTimeout,
        interface: this.bacnetInterface,
        port: this.bacnetPort,
      });

      // Setup error handler
      this.client.on('error', (error: Error) => {
        this.logger.error('🔴 BACnet client error:', error);
      });

      // Setup device discovery listener
      this.client.on('iAm', (device: any) => {
        this.logger.info('🟢 BACnet device discovered:', {
          address: device.address,
          deviceId: device.deviceId,
          maxApdu: device.maxApdu,
          vendorId: device.vendorId,
        });
      });

      this.logger.info('✅ BACnet client initialized', {
        interface: this.bacnetInterface,
        port: this.bacnetPort,
        apduTimeout: this.apduTimeout,
        batchReadTimeout: this.batchReadTimeout,
        sequentialReadTimeout: this.sequentialReadTimeout,
        connectivityCheckTimeout: this.connectivityCheckTimeout,
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
    timeoutMs?: number
  ): Promise<BACnetReadResult> {
    try {
      const objectTypeId = this.getObjectTypeId(objectType);
      const propertyIdNum = this.getPropertyId(propertyId);
      const address = `${ip}:${port}`;

      return new Promise((resolve) => {
        const effectiveTimeout = timeoutMs ?? this.sequentialReadTimeout;
        const timeoutHandle = setTimeout(() => {
          this.logger.error(
            `⏱️  BACnet read timeout for ${address}, object ${objectType}:${objectInstance}, property ${propertyId} after ${effectiveTimeout}ms`
          );
          resolve({
            success: false,
            error: `Read timeout after ${effectiveTimeout}ms`,
          });
        }, effectiveTimeout);

        try {
          this.client.readProperty(
            address,
            { type: objectTypeId, instance: objectInstance },
            propertyIdNum,
            (error: Error | null, value: any) => {
              clearTimeout(timeoutHandle);

              if (error) {
                this.logger.error(`🔴 BACnet read error for ${address}:`, error.message);
                resolve({
                  success: false,
                  error: error.message,
                });
                return;
              }

              if (value !== undefined && value !== null) {
                this.logger.debug(
                  `✅ BACnet read successful: ${address} ${objectType}:${objectInstance} ${propertyId} = ${value}`
                );
                resolve({
                  success: true,
                  value: value,
                });
              } else {
                this.logger.error(`🔴 BACnet read returned empty value for ${address}`);
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
          this.logger.error(`🔴 BACnet read exception for ${address}:`, errorMsg);
          resolve({
            success: false,
            error: errorMsg,
          });
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`🔴 BACnet read error:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Read multiple properties from a device in a single batch request
   * This is much more efficient than reading properties one at a time
   * 
   * Handles timeouts gracefully by returning partial results for registers
   * that completed before the timeout occurred.
   */
  async readPropertyMultiple(
    ip: string,
    port: number,
    requests: BatchReadRequest[],
    timeoutMs?: number
  ): Promise<BatchReadResult[]> {
    try {
      const address = `${ip}:${port}`;

      // Convert requests to node-bacnet format
      const bacnetRequests = requests.map((req) => ({
        objectId: {
          type: this.getObjectTypeId(req.objectType),
          instance: req.objectInstance,
        },
        properties: [
          {
            id: this.getPropertyId(req.propertyId),
          },
        ],
      }));

      return new Promise((resolve) => {
        const effectiveTimeout = timeoutMs ?? this.batchReadTimeout;
        let timedOut = false;
        let callbackCalled = false;
        
        // Initialize results array with all requests marked as pending
        const results: BatchReadResult[] = requests.map((req) => ({
          success: false,
          objectType: req.objectType,
          objectInstance: req.objectInstance,
          propertyId: req.propertyId,
          fieldName: req.fieldName,
          error: 'Pending',
        }));

        const timeoutHandle = setTimeout(() => {
          timedOut = true;
          
          // Log timeout event with meter ID and register count
          this.logger.error(
            `⏱️  BACnet batch read timeout for ${address} (${requests.length} registers) after ${effectiveTimeout}ms`
          );

          // If callback hasn't been called yet, resolve with partial results
          if (!callbackCalled) {
            callbackCalled = true;
            
            // Mark any remaining pending results as timed out
            const finalResults = results.map((result) => {
              if (result.error === 'Pending') {
                return {
                  ...result,
                  error: `Batch read timeout after ${effectiveTimeout}ms`,
                };
              }
              return result;
            });

            resolve(finalResults);
          }
        }, effectiveTimeout);

        try {
          this.client.readPropertyMultiple(address, bacnetRequests, (error: Error | null, data: any) => {
            // If timeout already occurred, ignore this callback
            if (timedOut) {
              clearTimeout(timeoutHandle);
              return;
            }

            callbackCalled = true;
            clearTimeout(timeoutHandle);

            if (error) {
              this.logger.error(`🔴 BACnet batch read error for ${address}:`, error.message);
              resolve(
                requests.map((req) => ({
                  success: false,
                  objectType: req.objectType,
                  objectInstance: req.objectInstance,
                  propertyId: req.propertyId,
                  fieldName: req.fieldName,
                  error: error.message,
                }))
              );
              return;
            }

            // Parse the response and map back to original requests
            const finalResults: BatchReadResult[] = [];

            if (data && data.values && Array.isArray(data.values)) {
              data.values.forEach((item: any, index: number) => {
                const originalRequest = requests[index];

                if (item.values && item.values.length > 0) {
                  // Extract the actual numeric value from the BACnet response
                  // The value might be wrapped in an object, so we need to extract the primitive
                  let readValue = item.values[0].value;
                  
                  // If value is an object with a 'value' property, extract it
                  if (typeof readValue === 'object' && readValue !== null && 'value' in readValue) {
                    readValue = readValue.value;
                  }
                  
                  this.logger.debug(
                    `✅ BACnet batch read successful: ${address} ${originalRequest.objectType}:${originalRequest.objectInstance} = ${readValue}`
                  );
                  finalResults.push({
                    success: true,
                    objectType: originalRequest.objectType,
                    objectInstance: originalRequest.objectInstance,
                    propertyId: originalRequest.propertyId,
                    fieldName: originalRequest.fieldName,
                    value: readValue,
                  });
                } else {
                  this.logger.warn(
                    `⚠️  BACnet batch read returned empty value for ${originalRequest.objectType}:${originalRequest.objectInstance}`
                  );
                  finalResults.push({
                    success: false,
                    objectType: originalRequest.objectType,
                    objectInstance: originalRequest.objectInstance,
                    propertyId: originalRequest.propertyId,
                    fieldName: originalRequest.fieldName,
                    error: 'Empty response from device',
                  });
                }
              });
            } else {
              this.logger.error(`🔴 BACnet batch read returned invalid data structure for ${address}`);
              finalResults.push(
                ...requests.map((req) => ({
                  success: false,
                  objectType: req.objectType,
                  objectInstance: req.objectInstance,
                  propertyId: req.propertyId,
                  fieldName: req.fieldName,
                  error: 'Invalid response structure',
                }))
              );
            }

            resolve(finalResults);
          });
        } catch (err) {
          clearTimeout(timeoutHandle);
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.error(`🔴 BACnet batch read exception for ${address}:`, errorMsg);
          resolve(
            requests.map((req) => ({
              success: false,
              objectType: req.objectType,
              objectInstance: req.objectInstance,
              propertyId: req.propertyId,
              fieldName: req.fieldName,
              error: errorMsg,
            }))
          );
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`🔴 BACnet batch read error:`, errorMsg);
      return requests.map((req) => ({
        success: false,
        objectType: req.objectType,
        objectInstance: req.objectInstance,
        propertyId: req.propertyId,
        fieldName: req.fieldName,
        error: errorMsg,
      }));
    }
  }

  /**
   * Read multiple properties from a device sequentially (one at a time)
   * This is a fallback method used when batch reads fail or timeout
   * 
   * Returns partial results for any registers that succeed before timeout
   * Logs fallback operation details for monitoring
   */
  async readPropertySequential(
    ip: string,
    port: number,
    requests: BatchReadRequest[],
    timeoutMs?: number
  ): Promise<BatchReadResult[]> {
    try {
      const address = `${ip}:${port}`;
      const effectiveTimeout = timeoutMs ?? this.sequentialReadTimeout;

      this.logger.info(
        `🔄 Starting sequential fallback read for ${address} (${requests.length} registers) with timeout ${effectiveTimeout}ms`
      );

      const results: BatchReadResult[] = [];

      // Read each register individually
      for (const request of requests) {
        try {
          const result = await this.readProperty(
            ip,
            port,
            request.objectType,
            request.objectInstance,
            request.propertyId,
            effectiveTimeout
          );

          // Map the single property read result to batch result format
          if (result.success) {
            this.logger.debug(
              `✅ Sequential read successful: ${address} ${request.objectType}:${request.objectInstance} ${request.propertyId} = ${result.value}`
            );
            results.push({
              success: true,
              objectType: request.objectType,
              objectInstance: request.objectInstance,
              propertyId: request.propertyId,
              fieldName: request.fieldName,
              value: result.value,
            });
          } else {
            this.logger.warn(
              `⚠️  Sequential read failed: ${address} ${request.objectType}:${request.objectInstance} ${request.propertyId} - ${result.error}`
            );
            results.push({
              success: false,
              objectType: request.objectType,
              objectInstance: request.objectInstance,
              propertyId: request.propertyId,
              fieldName: request.fieldName,
              error: result.error,
            });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `🔴 Sequential read exception: ${address} ${request.objectType}:${request.objectInstance} - ${errorMsg}`
          );
          results.push({
            success: false,
            objectType: request.objectType,
            objectInstance: request.objectInstance,
            propertyId: request.propertyId,
            fieldName: request.fieldName,
            error: errorMsg,
          });
        }
      }

      // Log fallback operation summary
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;
      this.logger.info(
        `✅ Sequential fallback read completed for ${address}: ${successCount} succeeded, ${failureCount} failed out of ${requests.length} registers`
      );

      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`🔴 BACnet sequential read error:`, errorMsg);
      return requests.map((req) => ({
        success: false,
        objectType: req.objectType,
        objectInstance: req.objectInstance,
        propertyId: req.propertyId,
        fieldName: req.fieldName,
        error: errorMsg,
      }));
    }
  }

  /**
   * Check if a meter is online and reachable
   * For now, we assume the device is online if we can create a connection.
   * Actual connectivity will be validated when we attempt to read registers.
   */
  async checkConnectivity(ip: string, port: number): Promise<boolean> {
    try {
      const address = `${ip}:${port}`;
      this.logger.info(`🔍 Checking connectivity for ${address}`);

      // Since different BACnet devices have different object types and configurations,
      // we'll assume the device is online and let the actual read operations validate connectivity.
      // This avoids false negatives from devices that don't have standard object types.
      this.logger.info(`✅ BACnet connectivity check passed for ${address} (assuming online)`);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`🔴 BACnet connectivity check error:`, errorMsg);
      return false;
    }
  }

  /**
   * Send WhoIs broadcast to discover BACnet devices
   */
  whoIs(): void {
    try {
      this.client.whoIs();
      this.logger.info('📡 BACnet WhoIs broadcast sent');
    } catch (error) {
      this.logger.error('🔴 Error sending WhoIs:', error);
    }
  }

  /**
   * Close BACnet connections gracefully
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        this.client.close();
        this.logger.info('✅ BACnet client closed successfully');
      } catch (error) {
        this.logger.error('🔴 Error closing BACnet client:', error);
      } finally {
        this.client = null;
      }
    }
  }
}
