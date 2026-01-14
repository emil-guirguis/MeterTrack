/**
 * Orchestrates a single collection cycle
 */

import { CollectionCycleResult, CollectionError, PendingReading } from './types.js';
import { MeterCache, DeviceRegisterCache } from '../cache/index.js';
import { BACnetClient, BatchReadRequest } from './bacnet-client.js';
import { ReadingBatcher } from './reading-batcher.js';

export class CollectionCycleManager {
  private logger: any;
  private deviceRegisterCache: DeviceRegisterCache;

  constructor(deviceRegisterCache: DeviceRegisterCache, logger?: any) {
    this.deviceRegisterCache = deviceRegisterCache;
    this.logger = logger || console;
  }

  /**
   * Generate a simple cycle ID
   */
  private generateCycleId(): string {
    return `cycle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Execute a complete collection cycle
   * 
   * Iterates through all meters in the cache, connects to each via BACnet,
   * reads all configured data points, and persists readings to the database.
   * 
   * If the cache is empty, it will be loaded from the database before processing.
   * After the cycle completes, the cache is cleared to ensure fresh data on next cycle.
   */
  async executeCycle(
    meterCache: MeterCache,
    bacnetClient: BACnetClient,
    database: any,
    readTimeoutMs: number = 3000
  ): Promise<CollectionCycleResult> {
    const cycleId = this.generateCycleId();
    const startTime = new Date();
    const errors: CollectionError[] = [];
    let metersProcessed = 0;
    let readingsCollected = 0;
    let success = true;

    this.logger.info(`Starting collection cycle ${cycleId}`);

    try {
      // Load cache from database if it's empty
      if (!meterCache.isValid()) {
        this.logger.info('Cache is empty or invalid, loading from database');
        try {
          await meterCache.reload(database);
          this.logger.info(`Loaded ${meterCache.getMeters().length} meters into cache`);
        } catch (reloadError) {
          const errorMsg = reloadError instanceof Error ? reloadError.message : String(reloadError);
          this.logger.error(`Failed to load meter cache from database: ${errorMsg}`);
          errors.push({
            meterId: 'system',
            operation: 'connect',
            error: `Cache reload failed: ${errorMsg}`,
            timestamp: new Date(),
          });
          success = false;
        }
      }

      // Get all meters from cache
      const meters = meterCache.getMeters();

      if (meters.length === 0) {
        this.logger.warn('No meters in cache for collection cycle');
        return {
          cycleId,
          startTime,
          endTime: new Date(),
          metersProcessed: 0,
          readingsCollected: 0,
          errors,
          success: success && errors.length === 0,
        };
      }

      // Process each meter
      for (const meter of meters) {
        try {
          // Log meter info including device_id
          this.logger.info(`🔍 Processing Meter: ID=${meter.meter_id}, Name=${meter.name}, Device ID=${meter.device_id}, IP=${meter.ip}:${meter.port}`);

          // Create a batcher for this meter's readings
          const batcher = new ReadingBatcher(this.logger);

          // Attempt to read all data points from this meter
          const meterReadings = await this.readMeterDataPoints(
            meter,
            bacnetClient,
            readTimeoutMs,
            errors
          );

          // Add readings to batcher
          for (const reading of meterReadings) {
            batcher.addReading(reading);
          }

          // Flush readings to database
          if (batcher.getPendingCount() > 0) {
            try {
              const insertedCount = await batcher.flushBatch(database);
              readingsCollected += insertedCount;
              this.logger.info(
                `Meter ${meter.meter_id}: inserted ${insertedCount} readings`
              );
            } catch (writeError) {
              const errorMsg = writeError instanceof Error ? writeError.message : String(writeError);
              this.logger.error(
                `Failed to write readings for meter ${meter.meter_id}: ${errorMsg}`
              );
              errors.push({
                meterId: meter.meter_id,
                operation: 'write',
                error: errorMsg,
                timestamp: new Date(),
              });
              success = false;
            }
          }

          metersProcessed++;
        } catch (meterError) {
          const errorMsg = meterError instanceof Error ? meterError.message : String(meterError);
          this.logger.error(`Error processing meter ${meter.meter_id}: ${errorMsg}`);
          errors.push({
            meterId: meter.meter_id,
            operation: 'connect',
            error: errorMsg,
            timestamp: new Date(),
          });
          success = false;
          // Continue to next meter
        }
      }

      const endTime = new Date();
      const result: CollectionCycleResult = {
        cycleId,
        startTime,
        endTime,
        metersProcessed,
        readingsCollected,
        errors,
        success: success && errors.length === 0,
      };

      this.logger.info(
        `Collection cycle ${cycleId} completed: ` +
        `${metersProcessed} meters, ${readingsCollected} readings, ${errors.length} errors`
      );

      return result;
    } catch (cycleError) {
      const errorMsg = cycleError instanceof Error ? cycleError.message : String(cycleError);
      this.logger.error(`Collection cycle ${cycleId} failed: ${errorMsg}`);

      return {
        cycleId,
        startTime,
        endTime: new Date(),
        metersProcessed,
        readingsCollected,
        errors,
        success: false,
      };
    } finally {
      // Clear cache after cycle completes to ensure fresh data on next cycle
      this.logger.debug(`Clearing meter cache after cycle ${cycleId}`);
      meterCache.clear();
    }
  }

  /**
   * Read all data points from a meter
   * 
   * Gets all configured registers for the device from the register cache,
   * then reads all registers in a single batch request via BACnet
   */
  private async readMeterDataPoints(
    meter: any,
    bacnetClient: BACnetClient,
    readTimeoutMs: number,
    errors: CollectionError[]
  ): Promise<PendingReading[]> {
    const readings: PendingReading[] = [];

    try {
      // Get all configured registers for this device from cache
      const deviceRegisters = this.deviceRegisterCache.getDeviceRegisters(meter.device_id);
      
      if (deviceRegisters.length === 0) {
        this.logger.warn(`No registers configured for device ${meter.device_id} (meter ${meter.meter_id}), skipping meter`);
        errors.push({
          meterId: String(meter.meter_id),
          operation: 'read',
          error: `No registers configured for device ${meter.device_id}`,
          timestamp: new Date(),
        });
        return readings;
      }

      this.logger.info(`Found ${deviceRegisters.length} configured registers for device ${meter.device_id}`);
      
      // Log all register details for debugging
      this.logger.info(`📋 Device ${meter.device_id} Registers:`);
      deviceRegisters.forEach((reg: any, index: number) => {
        this.logger.info(`  [${index + 1}] Register ID: ${reg.register_id}, Register #: ${reg.register}, Field: ${reg.field_name}, Unit: ${reg.unit}`);
      });
      this.logger.info(`📊 Total Register Numbers: [${deviceRegisters.map((r: any) => r.register).join(', ')}]`);

      // Build batch read requests for all registers
      const batchRequests: BatchReadRequest[] = deviceRegisters.map((register: any) => ({
        objectType: 'analogInput',
        objectInstance: register.register,
        propertyId: 'presentValue',
        fieldName: register.field_name,
      }));

      this.logger.info(`Performing batch read of ${batchRequests.length} registers from meter ${meter.meter_id}`);

      // Read all registers in a single batch request
      const batchResults = await bacnetClient.readPropertyMultiple(
        meter.ip,
        meter.port || 47808,
        batchRequests,
        readTimeoutMs
      );

      // Process batch results
      batchResults.forEach((result: any, index: number) => {
        const register = deviceRegisters[index];

        if (result.success && result.value !== undefined) {
          readings.push({
            meter_id: meter.meter_id,
            timestamp: new Date(),
            data_point: register.field_name,
            value: Number(result.value),
            unit: register.unit || 'unknown',
          });
          this.logger.info(
            `Successfully read register ${register.register} (${register.field_name}) from meter ${meter.meter_id}: ${result.value}`
          );
        } else {
          const errorMsg = result.error || 'Unknown error';
          this.logger.warn(
            `Failed to read register ${register.register} (${register.field_name}) from meter ${meter.meter_id}: ${errorMsg}`
          );
          errors.push({
            meterId: String(meter.meter_id),
            dataPoint: register.field_name,
            operation: 'read',
            error: errorMsg,
            timestamp: new Date(),
          });
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error reading meter data points for meter ${meter.meter_id}: ${errorMsg}`);
      errors.push({
        meterId: String(meter.meter_id),
        operation: 'read',
        error: errorMsg,
        timestamp: new Date(),
      });
    }

    return readings;
  }

}
