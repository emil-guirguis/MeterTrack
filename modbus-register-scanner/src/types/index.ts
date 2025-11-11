// Core TypeScript interfaces for the Modbus Register Scanner

/**
 * Information about a discovered Modbus register
 */
export interface RegisterInfo {
  address: number;           // 0-65535
  functionCode: number;      // 1, 2, 3, or 4
  dataType: string;         // "coil", "discrete", "holding", "input"
  value: number | boolean;   // Current register value
  accessible: boolean;       // Whether register responded
  timestamp: Date;          // When register was read
  error?: {                 // Error information if register failed
    code?: number;          // Modbus exception code
    message: string;        // Error message
    description?: string;   // Human-readable description
  };
}

/**
 * Configuration for scanning a Modbus device
 */
export interface ScanConfig {
  host: string;             // Target IP address
  port: number;             // TCP port (default 502)
  slaveId: number;          // Modbus slave ID (1-247)
  timeout: number;          // Request timeout in ms
  retries: number;          // Max retry attempts
  batchSize: number;        // Max registers per batch
}

/**
 * Results from a completed scan operation
 */
export interface ScanResults {
  config: ScanConfig;
  startTime: Date;
  endTime: Date;
  totalRegisters: number;
  accessibleRegisters: number;
  registers: RegisterInfo[];
  errors: string[];
}