/**
 * Centralized types used across the sync system to avoid duplication.
 */

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
}
export interface MeterEntity {
  meter_id: number;
  meter_element_id: number;
  active: boolean;
  ip: string;
  port: string;
  element: number;
}
export interface MeterReadingEntity {
  meter_id: number;
  meter_element_id: number;
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


export interface AuthResponse {
  success: boolean;
  siteId?: string;
  message?: string;
}

export interface HeartbeatResponse {
  success: boolean;
  timestamp: string;
}

export interface ConfigDownloadResponse {
  meters: MeterEntity[];
}

// ==================== SYNC TYPES ====================

export interface MeterSyncResult extends BaseSyncResult { }
export interface MeterSyncStatus extends BaseSyncStatus { }

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
  getMeters(activeOnly: boolean): Promise<MeterEntity[]>;
  upsertMeter(meter: MeterEntity): Promise<void>;
  deleteInactiveMeter(meterId: string): Promise<void>;
  logSyncOperation(batchSize: number, success: boolean, errorMessage?: string): Promise<void>;
  getUnsynchronizedReadings(limit: number): Promise<MeterReadingEntity[]>;
  deleteSynchronizedReadings(readingIds: number[]): Promise<number>;
  incrementRetryCount(readingIds: number[]): Promise<void>;
  getUnsynchronizedCount(): Promise<number>;
  getSyncStats(hours: number): Promise<any>;
  getRecentReadings(hours: number): Promise<MeterReadingEntity[]>;
  getRecentSyncLogs(limit: number): Promise<SyncLog[]>;
}



