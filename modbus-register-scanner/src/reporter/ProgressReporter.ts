import { RegisterInfo } from '../types';
import { RegisterNameMapper } from '../utils/RegisterNameMapper';

/**
 * Progress information for the scanning process
 */
export interface ScanProgress {
  currentAddress: number;
  currentFunctionCode: number;
  totalRegistersToScan: number;
  registersScanned: number;
  registersFound: number;
  percentComplete: number;
  estimatedTimeRemaining: number; // in milliseconds
  elapsedTime: number; // in milliseconds
  scanRate: number; // registers per second
}

/**
 * Table display configuration
 */
interface TableConfig {
  showLiveTable: boolean;
  maxTableRows: number;
  updateInterval: number;
}

/**
 * Error information for logging and reporting
 */
export interface ErrorInfo {
  timestamp: Date;
  type: 'connection' | 'timeout' | 'modbus_exception' | 'network' | 'unknown';
  message: string;
  details?: {
    address?: number;
    functionCode?: number;
    errorCode?: number;
    retryAttempt?: number;
  };
}

/**
 * ProgressReporter provides real-time updates during Modbus register scanning
 */
export class ProgressReporter {
  private startTime: Date;
  private lastUpdateTime: Date;
  private errors: ErrorInfo[] = [];
  private discoveredRegisters: RegisterInfo[] = [];
  private totalRegistersToScan: number;
  private registerNameMapper: RegisterNameMapper;
  private registersScanned: number = 0;
  private updateInterval: number = 1000; // Update every 1 second
  private lastDisplayUpdate: number = 0;

  constructor(totalRegistersToScan: number = 262144) { // 4 function codes * 65536 addresses
    this.totalRegistersToScan = totalRegistersToScan;
    this.startTime = new Date();
    this.lastUpdateTime = new Date();
    this.registerNameMapper = new RegisterNameMapper();
  }

  /**
   * Start the scanning process and display initial information
   */
  public startScan(config: { host: string; port: number; slaveId: number }): void {
    console.log('\n🔍 Starting Modbus TCP/IP Register Scan');
    console.log('═'.repeat(100));
    console.log(`Target Device: ${config.host}:${config.port} (Slave ID: ${config.slaveId})`);
    console.log(`Total registers to scan: ${this.totalRegistersToScan.toLocaleString()}`);
    console.log(`Protocol: Modbus TCP/IP (Big-endian, MBAP header)`);
    console.log(`Scanning Strategy: Sequential address scanning with TCP optimization`);
    console.log('═'.repeat(100));
    console.log('');

    // Print enhanced table header with better spacing
    console.log('ADDRESS  | FC | TYPE     | STATUS | VALUE        | REGISTER NAME           | UNIT | DESCRIPTION');
    console.log('-'.repeat(100));
    
    // Show scanning progress info
    console.log('🔄 Scanning in progress... (Press Ctrl+C to save state and exit)');
    console.log('');
  }

  /**
   * Update progress for the current register being scanned
   */
  public updateProgress(address: number, functionCode: number): void {
    this.registersScanned++;
    const now = Date.now();

    // Only update display at specified intervals to avoid overwhelming the console
    if (now - this.lastDisplayUpdate >= this.updateInterval) {
      const progress = this.calculateProgress(address, functionCode);
      this.displayProgress(progress);
      this.lastDisplayUpdate = now;
    }
  }

  /**
   * Report a discovered register
   */
  public reportDiscoveredRegister(register: RegisterInfo): void {
    this.discoveredRegisters.push(register);

    // Get register name and info
    const registerInfo = this.registerNameMapper.getRegisterInfo(register.address, register.functionCode);
    const registerName = registerInfo ? registerInfo.name : 'Unknown';
    const unit = registerInfo ? (registerInfo.unit || '') : '';
    const description = registerInfo ? registerInfo.description : '';

    // Display register in enhanced table format with better alignment
    const address = register.address.toString().padStart(8, ' '); 
    const fc = register.functionCode.toString().padStart(2, ' ');
    const type = this.getDataTypeDisplay(register.functionCode).padEnd(8, ' ');
    const status = register.accessible ? 'FOUND ' : 'ERROR ';
    const value = this.formatValueForDisplay(register.value, register.dataType).padEnd(12, ' ');
    const name = registerName.padEnd(23, ' ');
    const unitStr = unit.padEnd(4, ' ');
    const desc = description.length > 30 ? description.substring(0, 27) + '...' : description;

    console.log(`${address} | ${fc} | ${type} | ${status} | ${value} | ${name} | ${unitStr} | ${desc}`);
  }

  /**
   * Log an error that occurred during scanning
   */
  public logError(error: ErrorInfo): void {
    this.errors.push(error);

    // Display error immediately for critical issues
    if (error.type === 'connection' || error.type === 'network') {
      console.log(`❌ ${error.type.toUpperCase()}: ${error.message}`);
    }
  }

  /**
   * Complete the scan and display final summary
   */
  public completeScan(): void {
    const endTime = new Date();
    const totalTime = endTime.getTime() - this.startTime.getTime();

    console.log('\n');
    console.log('═'.repeat(100));
    console.log('🎉 MODBUS TCP/IP SCAN COMPLETE!');
    console.log('═'.repeat(100));
    console.log(`Total time: ${this.formatDuration(totalTime)}`);
    console.log(`Registers scanned: ${this.registersScanned.toLocaleString()}`);
    console.log(`Accessible registers found: ${this.discoveredRegisters.length.toLocaleString()}`);
    console.log(`Success rate: ${((this.discoveredRegisters.length / this.registersScanned) * 100).toFixed(2)}%`);
    console.log(`Protocol: Modbus TCP/IP (proper framing and byte ordering applied)`);

    // Show breakdown by function code
    this.displayFunctionCodeSummary();

    if (this.errors.length > 0) {
      console.log(`\nErrors encountered: ${this.errors.length}`);
      this.displayErrorSummary();
    }

    console.log('═'.repeat(100));
  }

  /**
   * Get current progress information
   */
  public getProgress(currentAddress: number, currentFunctionCode: number): ScanProgress {
    return this.calculateProgress(currentAddress, currentFunctionCode);
  }

  /**
   * Get all logged errors
   */
  public getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  /**
   * Get all discovered registers
   */
  public getDiscoveredRegisters(): RegisterInfo[] {
    return [...this.discoveredRegisters];
  }

  /**
   * Calculate current progress metrics
   */
  private calculateProgress(currentAddress: number, currentFunctionCode: number): ScanProgress {
    const now = new Date();
    const elapsedTime = now.getTime() - this.startTime.getTime();
    const percentComplete = (this.registersScanned / this.totalRegistersToScan) * 100;

    // Calculate scan rate (registers per second)
    const scanRate = elapsedTime > 0 ? (this.registersScanned / (elapsedTime / 1000)) : 0;

    // Estimate time remaining based on current scan rate
    const remainingRegisters = this.totalRegistersToScan - this.registersScanned;
    const estimatedTimeRemaining = scanRate > 0 ? (remainingRegisters / scanRate) * 1000 : 0;

    return {
      currentAddress,
      currentFunctionCode,
      totalRegistersToScan: this.totalRegistersToScan,
      registersScanned: this.registersScanned,
      registersFound: this.discoveredRegisters.length,
      percentComplete: Math.min(percentComplete, 100),
      estimatedTimeRemaining,
      elapsedTime,
      scanRate
    };
  }

  /**
   * Display current progress to console
   */
  private displayProgress(progress: ScanProgress): void {
    const progressBar = this.createProgressBar(progress.percentComplete);
    const dataType = this.getDataTypeDisplay(progress.currentFunctionCode);
    const eta = progress.estimatedTimeRemaining > 0 ? this.formatDuration(progress.estimatedTimeRemaining) : 'Unknown';

    // Show enhanced progress with TCP/IP protocol information and current scanning details
    console.log(`\n[TCP/IP SCAN] ${progressBar} ${progress.percentComplete.toFixed(1)}% | FC${progress.currentFunctionCode} ${dataType} @ ${progress.currentAddress} | Found: ${progress.registersFound} | Rate: ${progress.scanRate.toFixed(1)}/s | ETA: ${eta}`);
    
    // Show more detailed current scanning info
    console.log(`Currently scanning: Address ${progress.currentAddress} (Function Code ${progress.currentFunctionCode} - ${dataType})`);
    console.log(`Progress: ${progress.registersScanned.toLocaleString()} / ${progress.totalRegistersToScan.toLocaleString()} registers scanned`);
  }

  /**
   * Create a visual progress bar
   */
  private createProgressBar(percent: number, width: number = 20): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }

  /**
   * Get display name for function code
   */
  private getDataTypeDisplay(functionCode: number): string {
    switch (functionCode) {
      case 1: return 'Coil';
      case 2: return 'Discrete';
      case 3: return 'Holding';
      case 4: return 'Input';
      default: return `FC${functionCode}`;
    }
  }

  /**
   * Format register value for display
   */
  private formatValue(value: number | boolean): string {
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    return value.toString();
  }

  /**
   * Format register value for enhanced display with TCP/IP protocol considerations
   */
  private formatValueForDisplay(value: number | boolean, dataType: string): string {
    if (typeof value === 'boolean') {
      return value ? 'ON (1)' : 'OFF (0)';
    }
    
    if (typeof value === 'number') {
      // For TCP/IP protocol, show both decimal and hex for register values
      if (dataType === 'holding' || dataType === 'input') {
        if (value <= 65535) {
          return `${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`;
        } else {
          return `${value}`;
        }
      } else {
        return value.toString();
      }
    }
    
    return String(value);
  }

  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Display breakdown of discovered registers by function code
   */
  private displayFunctionCodeSummary(): void {
    console.log('\n📊 Register Summary by Function Code:');
    console.log('-'.repeat(50));

    const fcCounts = this.discoveredRegisters.reduce((acc, register) => {
      const fc = register.functionCode;
      acc[fc] = (acc[fc] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    Object.entries(fcCounts).forEach(([fc, count]) => {
      const fcNum = parseInt(fc);
      const fcName = this.getDataTypeDisplay(fcNum);
      console.log(`FC${fcNum} (${fcName}): ${count} registers`);
    });
  }

  /**
   * Display summary of errors encountered during scanning
   */
  private displayErrorSummary(): void {
    console.log('\n📋 Error Summary:');
    console.log('-'.repeat(30));

    // Group errors by type
    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorsByType).forEach(([type, count]) => {
      console.log(`${type.replace('_', ' ').toUpperCase()}: ${count}`);
    });

    // Show recent errors (last 5)
    if (this.errors.length > 0) {
      console.log('\nRecent errors:');
      const recentErrors = this.errors.slice(-5);
      recentErrors.forEach(error => {
        const time = error.timestamp.toLocaleTimeString();
        console.log(`[${time}] ${error.type}: ${error.message}`);
      });
    }
  }
}