/**
 * Core types for BACnet meter reading collection
 */

// ==================== REGISTER MAP ====================

export interface RegisterMap {
  [dataPointName: string]: {
    objectType: string;      // e.g., "analogInput", "analogOutput"
    objectInstance: number;  // e.g., 0, 1, 2
    propertyId: string;      // e.g., "presentValue", "units"
  };
}

// ==================== BACNET READ RESULT ====================

export interface BACnetReadResult {
  success: boolean;
  value?: any;
  unit?: string;
  error?: string;
}



// ==================== COLLECTION ERRORS ====================

export interface CollectionError {
  meterId: string;
  dataPoint?: string;
  operation: 'connect' | 'read' | 'write' | 'connectivity';
  error: string;
  timestamp: Date;
}

// ==================== TIMEOUT EVENT ====================

export interface TimeoutEvent {
  meterId: string;
  timestamp: Date;
  registerCount: number;
  batchSize: number;
  timeoutMs: number;
  recoveryMethod: 'sequential' | 'reduced_batch' | 'offline';
  success: boolean;
}

// ==================== TIMEOUT METRICS ====================

export interface TimeoutMetrics {
  totalTimeouts: number;
  timeoutsByMeter: Record<string, number>;
  averageTimeoutRecoveryMs: number;
  lastTimeoutTime?: Date;
  timeoutEvents: TimeoutEvent[];
}

// ==================== COLLECTION CYCLE RESULT ====================

export interface CollectionCycleResult {
  cycleId: string;
  startTime: Date;
  endTime: Date;
  metersProcessed: number;
  readingsCollected: number;
  errors: CollectionError[];
  success: boolean;
  timeoutMetrics?: TimeoutMetrics;
}

// ==================== OFFLINE METER STATUS ====================

export interface OfflineMeterStatus {
  meterId: string;
  lastCheckedAt: Date;
  consecutiveFailures: number;
  offlineSince?: Date;
}

// ==================== AGENT STATUS ====================

export interface AgentStatus {
  isRunning: boolean;
  lastCycleResult?: CollectionCycleResult;
  totalCyclesExecuted: number;
  totalReadingsCollected: number;
  totalErrorsEncountered: number;
  activeErrors: CollectionError[];
  timeoutMetrics?: TimeoutMetrics;
  offlineMeters: OfflineMeterStatus[];
}

// ==================== PENDING READING ====================

export interface PendingReading {
  meter_id: number;
  meter_element_id: number;
  field_name: string;
  value: number;
  created_at: Date;
  element: string;
  register: number;
}

// ==================== VALIDATION RESULT ====================

export interface ValidationResult {
  valid: number;
  invalid: number;
  skipped: number;
  errors: ValidationError[];
}

// ==================== VALIDATION ERROR ====================

export interface ValidationError {
  readingIndex: number;
  reading: PendingReading;
  errors: string[];
}

// ==================== BATCH INSERTION RESULT ====================

export interface BatchInsertionResult {
  success: boolean;
  totalReadings: number;
  insertedCount: number;
  failedCount: number;
  skippedCount: number;
  timestamp: Date;
  errors?: string[];
  retryAttempts: number;
}

// ==================== AGENT CONFIG ====================

export interface BACnetMeterReadingAgentConfig {
  syncDatabase: any; // SyncDatabase type
  collectionIntervalSeconds?: number;  // Default: 60
  uploadIntervalMinutes?: number;       // Default: 5 (upload every 5 minutes)
  enableAutoStart?: boolean;            // Default: true
  bacnetInterface?: string;             // Default: '0.0.0.0'
  bacnetPort?: number;                  // Default: 47808
  connectionTimeoutMs?: number;         // Default: 5000
  readTimeoutMs?: number;               // Default: 3000
  batchReadTimeoutMs?: number;          // Default: 5000
  sequentialReadTimeoutMs?: number;     // Default: 3000
  connectivityCheckTimeoutMs?: number;  // Default: 2000
  enableConnectivityCheck?: boolean;    // Default: true - Check meter online before reading
  enableSequentialFallback?: boolean;   // Default: true - Fall back to sequential reads on batch failure
  adaptiveBatchSizing?: boolean;        // Default: true - Reduce batch size on timeout
  meterCache?: any;                     // Optional: shared MeterCache instance
  deviceRegisterCache?: any;            // Optional: shared DeviceRegisterCache instance
  apiClient?: any;                      // Optional: ClientSystemApiClient for uploads
}
