/**
 * In-memory cache of device_register mappings
 * Loaded at MCP server startup for fast lookups during meter collection
 * 
 */

export interface CachedDeviceRegister {
  device_id: number;
  register_id: number;
  register: number;
  field_name: string;
  unit: string;
}

export class DeviceRegisterCache {
  private deviceRegisters: Map<number, CachedDeviceRegister[]> = new Map();
  private valid: boolean = false;

  /**
   * Load all device_register mappings from database at startup
   * 
   * Queries the device_register table and joins with register table to get all needed data.
   * Populates the in-memory cache for fast lookups during meter collection.
   */
  async initialize(syncDatabase: any): Promise<void> {
    try {
      console.log('📦 [DeviceRegisterCache] Initializing device_register cache...');
      
      this.deviceRegisters.clear();
      this.valid = false;

      // Load all device_register mappings with register details
      console.log('📦 [DeviceRegisterCache] Loading device_register mappings from database...');
      const deviceRegisters = await syncDatabase.getDeviceRegisters();
      console.log(`📋 [DeviceRegisterCache] Raw device_registers from DB (${deviceRegisters.length} total): ${JSON.stringify(deviceRegisters)}`);
      
      if (deviceRegisters.length === 0) {
        console.warn('⚠️  [DeviceRegisterCache] WARNING: No device_register mappings found in database!');
      }
      
      // Process each device_register mapping
      for (const row of deviceRegisters) {
        // Convert device_id to number for consistent keying
        const deviceId = typeof row.device_id === 'string' ? parseInt(row.device_id, 10) : row.device_id;

        const cached: CachedDeviceRegister = {
          device_id: deviceId,
          register_id: row.register_id,
          register: row.register,
          field_name: row.field_name,
          unit: row.unit,
        };

        if (!this.deviceRegisters.has(deviceId)) {
          this.deviceRegisters.set(deviceId, []);
        }
        this.deviceRegisters.get(deviceId)!.push(cached);
      }
      
      console.log(`✅ [DeviceRegisterCache] Loaded ${this.deviceRegisters.size} devices with ${deviceRegisters.length} total device_register mappings into memory`);
      console.log(`📊 [DeviceRegisterCache] Device register map: ${JSON.stringify(Array.from(this.deviceRegisters.entries()))}`);

      this.valid = true;
      console.log('✅ [DeviceRegisterCache] Cache is now VALID and ready for use');
    } catch (error) {
      console.error('❌ [DeviceRegisterCache] Failed to initialize:', error);
      this.valid = false;
      throw error;
    }
  }

  /**
   * Get all registers for a device from cache
   */
  getDeviceRegisters(deviceId: number): CachedDeviceRegister[] {
    const result = this.deviceRegisters.get(deviceId) || [];
    console.log(`🔍 [DeviceRegisterCache] getDeviceRegisters(${deviceId}): Found ${result.length} registers. Cache has devices: [${Array.from(this.deviceRegisters.keys()).join(', ')}]`);
    return result;
  }

  /**
   * Check if cache is valid
   */
  isValid(): boolean {
    return this.valid;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.deviceRegisters.clear();
    this.valid = false;
  }

  /**
   * Reload cache from database
   */
  async reload(syncDatabase: any): Promise<void> {
    await this.initialize(syncDatabase);
  }
}
