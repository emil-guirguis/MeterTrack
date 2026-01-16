/**
 * In-memory cache of active meters and their metadata
 * Loaded at MCP server startup for fast lookups during meter collection
 */

export interface CachedMeter {
  meter_id: string;
  name: string;
  ip: string;
  port: string;
  meter_element_id: number;
  element: string;
  device_id: number;
}

export class MeterCache {
  private meters: Map<string, CachedMeter> = new Map();
  private valid: boolean = false;

  /**
   * Load all active meters from the database into memory
   */
  async initialize(syncDatabase: any): Promise<void> {
    try {
      console.log('\n📦 [MeterCache] Initializing meter cache...');
      
      this.meters.clear();
      this.valid = false;

      // Query all active meters from database
      console.log('📦 [MeterCache] Loading meters from database...');
      const syncMeters = await syncDatabase.getMeters(true);

      console.log(`📦 [MeterCache] Database returned ${syncMeters.length} meters`);

      // Process each meter
      for (const row of syncMeters) {
        // Use composite key: meter_id + meter_element_id to handle multiple elements per meter
        const cacheKey = `${row.meter_id}:${row.meter_element_id}`;
        
        const cachedMeter: CachedMeter = {
          meter_id: row.meter_id,
          name: row.name,
          ip: row.ip,
          port: row.port,
          meter_element_id: row.meter_element_id,
          element: row.element,
          device_id: row.device_id,  
        };

        this.meters.set(cacheKey, cachedMeter);
        console.log(`   ✓ Cached meter: ${cacheKey} (${row.name})`);
      }

      // Mark cache as valid if we loaded at least one meter
      this.valid = this.meters.size > 0;
      
      console.log(`\n✅ [MeterCache] Cache initialization complete:`);
      console.log(`   Total meters cached: ${this.meters.size}`);
      console.log(`   Cache valid: ${this.valid}`);
      
      if (this.meters.size === 0) {
        console.warn(`⚠️  [MeterCache] WARNING: No meters were loaded into cache!`);
      }
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
  getMeterById(meterId: string): CachedMeter | null {
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
