/**
 * In-memory cache of active meters and their register maps
 */

import { CachedMeter } from './types.js';

export class MeterCache {
  private meters: Map<string, CachedMeter> = new Map();
  private valid: boolean = false;


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
        const cachedMeter: CachedMeter = {
          id: row.id,
          name: row.name,
          ip: row.ip,
          port: row.port,
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
