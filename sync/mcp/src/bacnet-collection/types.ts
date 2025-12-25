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

// ==================== CACHED METER ====================

export interface CachedMeter {
  id: string;
  name: string;
  ip: string;
  port: string;
  protocol: string;
}

// ==================== COLLECTION ERRORS ====================

export interface CollectionError {
  meterId: string;
  dataPoint?: string;
  operation: 'connect' | 'read' | 'write';
  error: string;
  timestamp: Date;
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
}

// ==================== AGENT STATUS ====================

export interface AgentStatus {
  isRunning: boolean;
  lastCycleResult?: CollectionCycleResult;
  totalCyclesExecuted: number;
  totalReadingsCollected: number;
  totalErrorsEncountered: number;
  activeErrors: CollectionError[];
}

// ==================== PENDING READING ====================

export interface PendingReading {
  meter_id: string;
  timestamp: Date;
  data_point: string;
  value: number;
  unit?: string;
}

// ==================== AGENT CONFIG ====================

export interface BACnetMeterReadingAgentConfig {
  database: any; // SyncDatabase type
  collectionIntervalSeconds?: number;  // Default: 60
  enableAutoStart?: boolean;            // Default: true
  bacnetInterface?: string;             // Default: '0.0.0.0'
  bacnetPort?: number;                  // Default: 47808
  connectionTimeoutMs?: number;         // Default: 5000
  readTimeoutMs?: number;               // Default: 3000
}
