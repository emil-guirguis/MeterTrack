/**
 * Centralized types used across the sync system to avoid duplication.
 */

// ==================== BASE INTERFACES ====================

export interface BaseEntity {
  id: number;
  tenant_id?: string;
  active: boolean;
  created_at: Date;
  updated_at?:Date;
}

export interface BaseResponse {
  success: boolean;
  message?: string;
}

export interface BaseAddress {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface BaseSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  error?: string;
  timestamp: Date;
}

export interface BasrSyncStatus {
  isRunning: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  lastSyncSuccess?: boolean;
  lastSyncError?: string;
  lastInsertedCount: number;
  lastUpdatedCount: number;
  lastDeletedCount: number;
  count: number;
}

// ==================== DATABASE TYPES ====================

export interface TenantEntity  extends BaseEntity {
  name: string;
  url?: string;
  address: BaseAddress;
}

export interface MeterEntity extends BaseEntity {
  name: string;
  type: string;
  serial_number: string;
  installation_date: string;
  device_id: string;
  location_id: string;
  ip: string;
  port: string;
  protocol: string;
  status: string;
  register_map?: any;
  notes?: string;
}

export interface MeterReadingEntity extends BaseEntity {
  meter_id: string;
  timestamp: Date;
  data_point: string;
  value: number;
  unit?: string;
  is_synchronized: boolean;
  retry_count: number;
}

export interface SyncLog {
  id: number;
  batch_size: number;
  success: boolean;
  error_message?: string;
  synced_at: Date;
}
// ==================== API TYPES ====================

export interface BatchUploadRequest {
  readings: Array<{
    meter_id: string;
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

export interface ConfigDownloadResponse {
  meters: MeterEntity[];
}

export interface AuthResponse {
  success: boolean;
  siteId?: string;
  message?: string;
}

export interface HeartbeatResponse {
  success: boolean;
  timestamp: string;
}
// ==================== SYNC TYPES ====================

export interface MeterSyncResult extends BaseSyncResult {}
export interface MeterSyncStatus extends BasrSyncStatus {}

// ==================== CONFIG TYPES ====================

export interface ApiClientConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}
