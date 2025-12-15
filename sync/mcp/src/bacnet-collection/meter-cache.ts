/**
 * In-memory cache of active meters and their register maps
 */

import { CachedMeter, RegisterMap } from './types.js';

export class MeterCache {
  private meters: Map<string, CachedMeter> = new Map();
  private valid: boolean = false;

  /**
   * Validate that a register map has the required structure
   */
  private validateRegisterMap(registerMap: any): boolean {
    if (!registerMap || typeof registerMap !== 'object' || !Array.isArray(registerMap)) {
      return false;
    }

    // Must have at least one data point
    const entries = Object.entries(registerMap);
    if (entries.length === 0) {
      return false;
    }

    // Check that all entries have required fields
    for (const [dataPointName, dataPoint] of entries) {
      // Data point name must be a string (can be any string, even whitespace)
      if (typeof dataPointName !== 'string') {
        return false;
      }

      // Data point must be an object
      if (!dataPoint || typeof dataPoint !== 'object' || Array.isArray(dataPoint)) {
        return false;
      }

      const dp = dataPoint as any;

      // // All required fields must be present and correct type
      // if (
      //   typeof dp.objectType !== 'string' ||
      //   typeof dp.objectInstance !== 'number' ||
      //   !Number.isInteger(dp.objectInstance) ||
      //   dp.objectInstance < 0 ||
      //   typeof dp.propertyId !== 'string'
      // ) {
      //   return false;
      // }
    }

    return true;
  }

  /**
   * Parse register map from JSON string or object
   */
  private parseRegisterMap(registerMapData: any): RegisterMap | null {
    try {
      let registerMap = registerMapData;

      // If it's a string, parse it as JSON
      if (typeof registerMapData === 'string') {
        registerMap = JSON.parse(registerMapData);
      }

      // Validate the structure
      if (!this.validateRegisterMap(registerMap)) {
        return null;
      }

      return registerMap as RegisterMap;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load all active meters from the database into memory
   */
  async reload(database: any): Promise<void> {
    try {
      this.meters.clear();
      this.valid = false;

      // Query all active meters from database
      const meterRows = await database.getMeters(true);

      // Process each meter
      for (const row of meterRows) {
        const registerMap = this.parseRegisterMap(row.register_map);

        // Skip meters with invalid register maps
        if (!registerMap) {
          console.warn(`Skipping meter ${row.id}: invalid or missing register_map`);
          continue;
        }

        const cachedMeter: CachedMeter = {
          id: row.id,
          name: row.name,
          ip: row.ip,
          port: row.port,
          register_map: registerMap,
          protocol: row.protocol,
        };

        this.meters.set(row.id, cachedMeter);
      }

      // Mark cache as valid if we loaded at least one meter
      this.valid = this.meters.size > 0;
    } catch (error) {
      console.error('Failed to reload meter cache:', error);
      this.valid = false;
      throw error;
    }
  }

  /**
   * Get all cached meters
   */
  getMeters(): CachedMeter[] {
    return Array.from(this.meters.values());
  }

  /**
   * Get a specific meter from cache
   */
  getMeter(meterId: string): CachedMeter | null {
    return this.meters.get(meterId) || null;
  }

  /**
   * Check if cache contains valid data
   */
  isValid(): boolean {
    return this.valid;
  }

  /**
   * Clear all cached meters and mark cache as invalid
   */
  clear(): void {
    this.meters.clear();
    this.valid = false;
  }
}
