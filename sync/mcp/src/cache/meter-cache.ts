/**
 * In-memory cache of active meters and their metadata
 * Loaded at MCP server startup for fast lookups during meter collection
 */

export interface CachedMeter {
  meter_id: string;
  name: string;
  ip: string;
  port: string;
  protocol: string;
  element: string;
  device_id?: number;  // NEW: Device ID for querying device_register
}

export class MeterCache {
  private meters: Map<string, CachedMeter> = new Map();
  private valid: boolean = false;

  /**
   * Load all active meters from the database into memory
   */
  async initialize(syncDatabase: any): Promise<void> {
    try {
      console.log('📦 [MeterCache] Initializing meter cache...');
      
      this.meters.clear();
      this.valid = false;

      // Query all active meters from database
      console.log('📦 [MeterCache] Loading meters from database...');
      const syncMeters = await syncDatabase.getMeters(true);

      // Process each meter
      for (const row of syncMeters) {
        // Use composite key: meter_id + meter_element_id to handle multiple elements per meter
        const cacheKey = `${row.meter_id}:${row.meter_element_id}`;
        
        // Convert device_id to number for consistent keying
        const deviceId = typeof row.device_id === 'string' ? parseInt(row.device_id, 10) : row.device_id;
        
        const cachedMeter: CachedMeter = {
          meter_id: row.meter_id,
          name: row.name,
          ip: row.ip,
          port: row.port,
          protocol: row.protocol,
          element: row.element,
          device_id: deviceId,  // Store as number
        };

        this.meters.set(cacheKey, cachedMeter);
      }

      // Mark cache as valid if we loaded at least one meter
      this.valid = this.meters.size > 0;
      
      console.log(`✅ [MeterCache] Loaded ${this.meters.size} meters into memory`);
    } catch (error) {
      console.error('❌ [MeterCache] Failed to initialize:', error);
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

  /**
   * Reload cache from database
   */
  async reload(syncDatabase: any): Promise<void> {
    await this.initialize(syncDatabase);
  }
}
