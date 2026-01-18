/**
 * Centralized types used across the sync system to avoid duplication.
 */

// ==================== ENTITY METADATA ====================

/**
 * Metadata describing how to sync an entity type
 * Used by generic sync functions to handle different entity types uniformly
 */
export interface EntityMetadata {
  tableName: string;                    // Name of the table in the database
  primaryKey: string | string[];        // Single or composite primary key column(s)
  columns: string[];                    // Columns to sync
  compositeKey?: string[];              // For composite keys (e.g., ['device_id', 'register_id'])
  tenantFiltered?: boolean;             // Whether to filter by tenant_id
  remoteQuery?: string;                 // Custom remote query template (optional)
}

/**
 * Registry of entity metadata for all syncable entities
 */
export const ENTITY_METADATA: Record<string, EntityMetadata> = {
  tenant: {
    tableName: 'tenant',
    primaryKey: 'tenant_id',
    columns: ['tenant_id', 'name', 'url', 'street', 'street2', 'city', 'state', 'zip', 'country', 'api_key'],
    tenantFiltered: true
  },
  meter: {
    tableName: 'meter',
    primaryKey: ['meter_id', 'meter_element_id'],
    columns: ['meter_id', 'device_id', 'name', 'active', 'ip', 'port', 'meter_element_id', 'element'],
    compositeKey: ['id', 'meter_element_id'],
    tenantFiltered: true,
    remoteQuery: `select m.meter_id, m.device_id, m.ip, m.port, m.active ,  
                         me.meter_element_id, me.element, me.name as name 
                  from meter m
                     join meter_element me on me.meter_id = m.meter_id
                  where m.tenant_id =$1`,
  },
  register: {
    tableName: 'register',
    primaryKey: 'register_id',
    columns: ['register_id', 'name', 'register', 'unit', 'field_name'],
    tenantFiltered: false,
  },
  device_register: {
    tableName: 'device_register',
    primaryKey: ['device_id', 'register_id'],
    columns: ['device_register_id','device_id', 'register_id'],
    compositeKey: ['device_id', 'register_id'],
    tenantFiltered: false,
  },
};

export interface BaseResponse {
  success: boolean;
  message?: string;
}

export interface BaseSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  error?: string;
  timestamp: Date;
}

export interface BaseSyncStatus {
  isRunning: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  lastSyncSuccess?: boolean;
  lastSyncError?: string;
  lastSyncSkipped?: boolean;
  lastSyncSkipReason?: string;
  lastInsertedCount: number;
  lastUpdatedCount: number;
  lastDeletedCount: number;
  count: number;
}

export interface TenantEntity {
  tenant_id: number;
  url?: string;
  name?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  api_key?: string;
}
export interface MeterEntity {
  meter_id: number;
  device_id: number;
  name: string;
  active: boolean;
  ip: string;
  port: string;
  meter_element_id: number;
  element: string;
}
export interface MeterReadingEntity {
  meter_reading_id?: number;
  meter_id: number;
  name: string;
  timestamp: Date;
  data_point: string;
  value: number;
  unit?: string;
  is_synchronized: boolean;
  retry_count: number;
}

export interface RegisterEntity {
  register_id: number;
  name: string;
  register: number;
  unit: string;
  field_name: string;
}

export interface DeviceRegisterEntity {
  device_register_id: number;
  device_id: number;
  register_id: number;
}

export interface SyncLog {
  sync_log_id: number;
  batch_size: number;
  success: boolean;
  error_message?: string;
  synced_at: Date;
}
// ==================== API TYPES ====================

export interface BatchUploadRequest {
  readings: Array<{
    meter_id: number;
    timestamp: string;
    data_point: string;
    value: number;
    unit?: string;
  }>;
}

export interface BatchUploadResponse {
  success: boolean;
  recordsProcessed: number;
  message?: string;
}


export interface AuthResponse {
  success: boolean;
  siteId?: string;
  message?: string;
}

export interface ConfigDownloadResponse {
  meters: MeterEntity[];
}

// ==================== SYNC TYPES ====================

export interface MeterSyncResult extends BaseSyncResult { }
export interface MeterSyncStatus extends BaseSyncStatus { }

/**
 * Comprehensive sync result that aggregates results from all four sync operations:
 * tenants, meters, registers, and device_register associations
 */
export interface ComprehensiveSyncResult {
  success: boolean;
  tenants: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  meters: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  deviceRegisters: {
    inserted: number;
    updated: number;
    deleted: number;
    skipped: number;
  };
  error?: string;
  timestamp: Date;
}

// ==================== CONFIG TYPES ====================

export interface ApiClientConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}

// ==================== DATABASE SERVICE INTERFACE ====================

export interface SyncDatabase {
  getTenant(): Promise<TenantEntity | null>;
  updateTenantApiKey(apiKey: string): Promise<void>;
  getMeters(activeOnly: boolean): Promise<MeterEntity[]>;
  upsertMeter(meter: MeterEntity): Promise<void>;
  logSyncOperation(operationType: string, readingsCount: number, success: boolean, errorMessage?: string): Promise<void>;
  getUnsynchronizedReadings(limit: number): Promise<MeterReadingEntity[]>;
  deleteSynchronizedReadings(readingIds: number[]): Promise<number>;
  incrementRetryCount(readingIds: number[]): Promise<void>;
  getSyncStats(hours: number): Promise<any>;
  getRecentReadings(hours: number): Promise<MeterReadingEntity[]>;
  getRecentSyncLogs(limit: number): Promise<SyncLog[]>;

  // ==================== REGISTER METHODS ====================
  /**
   * Get all registers from the sync database
   */
  getRegisters(): Promise<RegisterEntity[]>;

  /**
   * Upsert a register into the sync database
   */
  upsertRegister(register: RegisterEntity): Promise<void>;

  /**
   * Delete a register from the sync database
   */
  deleteRegister(registerId: number): Promise<void>;

  // ==================== DEVICE_REGISTER METHODS ====================
  /**
   * Get all device_register associations from the sync database
   */
  getDeviceRegisters(): Promise<DeviceRegisterEntity[]>;

  /**
   * Upsert a device_register association into the sync database
   */
  upsertDeviceRegister(deviceRegister: DeviceRegisterEntity): Promise<void>;

  /**
   * Delete a device_register association from the sync database
   */
  deleteDeviceRegister(deviceId: number, registerId: number): Promise<void>;
}



