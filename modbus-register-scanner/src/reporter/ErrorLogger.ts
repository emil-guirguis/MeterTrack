import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Detailed error information for comprehensive logging
 */
export interface DetailedErrorInfo {
  timestamp: Date;
  type: 'connection' | 'timeout' | 'modbus_exception' | 'network' | 'protocol' | 'validation' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: {
    address?: number;
    functionCode?: number;
    errorCode?: number;
    retryAttempt?: number;
    host?: string;
    port?: number;
    slaveId?: number;
    stackTrace?: string;
    rawData?: string;
    [key: string]: any; // Allow additional properties
  };
  context?: {
    operation?: string;
    phase?: string;
    batchSize?: number;
    totalRetries?: number;
  };
}

/**
 * Error statistics for reporting
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByAddress: Record<number, number>;
  errorsByFunctionCode: Record<number, number>;
  mostCommonError: {
    type: string;
    count: number;
    message: string;
  };
  errorRate: number; // errors per minute
  firstError?: DetailedErrorInfo;
  lastError?: DetailedErrorInfo;
}

/**
 * Comprehensive error logging and reporting system
 */
export class ErrorLogger {
  private errors: DetailedErrorInfo[] = [];
  private logFilePath?: string;
  private startTime: Date;
  private enableFileLogging: boolean;

  constructor(enableFileLogging: boolean = true, logDirectory?: string) {
    this.enableFileLogging = enableFileLogging;
    this.startTime = new Date();
    
    if (enableFileLogging) {
      this.setupLogFile(logDirectory);
    }
  }

  /**
   * Log a connection-related error
   */
  public logConnectionError(
    message: string,
    host: string,
    port: number,
    retryAttempt?: number,
    stackTrace?: string
  ): void {
    const error: DetailedErrorInfo = {
      timestamp: new Date(),
      type: 'connection',
      severity: 'high',
      message,
      details: {
        host,
        port,
        retryAttempt,
        stackTrace
      },
      context: {
        operation: 'connection_establishment',
        phase: 'initial_connection'
      }
    };

    this.logError(error);
  }

  /**
   * Log a timeout error
   */
  public logTimeoutError(
    message: string,
    address: number,
    functionCode: number,
    timeout: number,
    retryAttempt?: number
  ): void {
    const error: DetailedErrorInfo = {
      timestamp: new Date(),
      type: 'timeout',
      severity: 'medium',
      message,
      details: {
        address,
        functionCode,
        retryAttempt
      },
      context: {
        operation: 'register_read',
        phase: 'data_request'
      }
    };

    this.logError(error);
  }

  /**
   * Log a Modbus exception error
   */
  public logModbusException(
    message: string,
    address: number,
    functionCode: number,
    errorCode: number,
    rawData?: string
  ): void {
    const severity = this.getModbusExceptionSeverity(errorCode);
    const error: DetailedErrorInfo = {
      timestamp: new Date(),
      type: 'modbus_exception',
      severity,
      message: `${message} (Exception Code: ${errorCode})`,
      details: {
        address,
        functionCode,
        errorCode,
        rawData
      },
      context: {
        operation: 'register_read',
        phase: 'response_processing'
      }
    };

    this.logError(error);
  }

  /**
   * Log a network-related error
   */
  public logNetworkError(
    message: string,
    host: string,
    port: number,
    stackTrace?: string
  ): void {
    const error: DetailedErrorInfo = {
      timestamp: new Date(),
      type: 'network',
      severity: 'high',
      message,
      details: {
        host,
        port,
        stackTrace
      },
      context: {
        operation: 'network_communication',
        phase: 'data_transmission'
      }
    };

    this.logError(error);
  }

  /**
   * Log a protocol-related error
   */
  public logProtocolError(
    message: string,
    address?: number,
    functionCode?: number,
    rawData?: string
  ): void {
    const error: DetailedErrorInfo = {
      timestamp: new Date(),
      type: 'protocol',
      severity: 'medium',
      message,
      details: {
        address,
        functionCode,
        rawData
      },
      context: {
        operation: 'protocol_parsing',
        phase: 'data_validation'
      }
    };

    this.logError(error);
  }

  /**
   * Log a validation error
   */
  public logValidationError(
    message: string,
    details?: Record<string, any>
  ): void {
    const error: DetailedErrorInfo = {
      timestamp: new Date(),
      type: 'validation',
      severity: 'low',
      message,
      details: details || {},
      context: {
        operation: 'data_validation',
        phase: 'input_validation'
      }
    };

    this.logError(error);
  }

  /**
   * Log a generic error
   */
  public logGenericError(
    message: string,
    type: DetailedErrorInfo['type'] = 'unknown',
    severity: DetailedErrorInfo['severity'] = 'medium',
    details?: DetailedErrorInfo['details']
  ): void {
    const error: DetailedErrorInfo = {
      timestamp: new Date(),
      type,
      severity,
      message,
      details: details || {},
      context: {
        operation: 'unknown',
        phase: 'unknown'
      }
    };

    this.logError(error);
  }

  /**
   * Get comprehensive error statistics
   */
  public getErrorStatistics(): ErrorStatistics {
    const totalErrors = this.errors.length;
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByAddress: Record<number, number> = {};
    const errorsByFunctionCode: Record<number, number> = {};

    this.errors.forEach(error => {
      // Count by type
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      
      // Count by severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      // Count by address
      if (error.details.address !== undefined) {
        errorsByAddress[error.details.address] = (errorsByAddress[error.details.address] || 0) + 1;
      }
      
      // Count by function code
      if (error.details.functionCode !== undefined) {
        errorsByFunctionCode[error.details.functionCode] = (errorsByFunctionCode[error.details.functionCode] || 0) + 1;
      }
    });

    // Find most common error
    const mostCommonErrorType = Object.entries(errorsByType)
      .sort(([,a], [,b]) => b - a)[0];
    
    const mostCommonError = mostCommonErrorType ? {
      type: mostCommonErrorType[0],
      count: mostCommonErrorType[1],
      message: this.errors.find(e => e.type === mostCommonErrorType[0])?.message || ''
    } : {
      type: 'none',
      count: 0,
      message: ''
    };

    // Calculate error rate (errors per minute)
    const elapsedMinutes = (Date.now() - this.startTime.getTime()) / (1000 * 60);
    const errorRate = elapsedMinutes > 0 ? totalErrors / elapsedMinutes : 0;

    return {
      totalErrors,
      errorsByType,
      errorsBySeverity,
      errorsByAddress,
      errorsByFunctionCode,
      mostCommonError,
      errorRate,
      firstError: this.errors[0],
      lastError: this.errors[this.errors.length - 1]
    };
  }

  /**
   * Generate a comprehensive error report
   */
  public generateErrorReport(): string {
    const stats = this.getErrorStatistics();
    const report: string[] = [];

    report.push('MODBUS SCANNER ERROR REPORT');
    report.push('='.repeat(50));
    report.push(`Generated: ${new Date().toLocaleString()}`);
    report.push(`Total Errors: ${stats.totalErrors}`);
    report.push(`Error Rate: ${stats.errorRate.toFixed(2)} errors/minute`);
    report.push('');

    // Error breakdown by type
    report.push('ERRORS BY TYPE:');
    report.push('-'.repeat(20));
    Object.entries(stats.errorsByType)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = ((count / stats.totalErrors) * 100).toFixed(1);
        report.push(`${type.toUpperCase().padEnd(15)} ${count.toString().padStart(5)} (${percentage}%)`);
      });
    report.push('');

    // Error breakdown by severity
    report.push('ERRORS BY SEVERITY:');
    report.push('-'.repeat(20));
    Object.entries(stats.errorsBySeverity)
      .sort(([,a], [,b]) => b - a)
      .forEach(([severity, count]) => {
        const percentage = ((count / stats.totalErrors) * 100).toFixed(1);
        report.push(`${severity.toUpperCase().padEnd(15)} ${count.toString().padStart(5)} (${percentage}%)`);
      });
    report.push('');

    // Most problematic addresses
    const topAddresses = Object.entries(stats.errorsByAddress)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    if (topAddresses.length > 0) {
      report.push('TOP PROBLEMATIC ADDRESSES:');
      report.push('-'.repeat(30));
      topAddresses.forEach(([address, count]) => {
        report.push(`Address ${address.padStart(5)}: ${count} errors`);
      });
      report.push('');
    }

    // Recent errors
    const recentErrors = this.errors.slice(-10);
    if (recentErrors.length > 0) {
      report.push('RECENT ERRORS (Last 10):');
      report.push('-'.repeat(30));
      recentErrors.forEach(error => {
        const time = error.timestamp.toLocaleTimeString();
        const addressInfo = error.details.address !== undefined ? ` @${error.details.address}` : '';
        report.push(`[${time}] ${error.type.toUpperCase()}${addressInfo}: ${error.message}`);
      });
    }

    return report.join('\n');
  }

  /**
   * Get all logged errors
   */
  public getErrors(): DetailedErrorInfo[] {
    return [...this.errors];
  }

  /**
   * Clear all logged errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Export errors to JSON file
   */
  public exportErrorsToJson(filePath: string): void {
    const data = {
      exportTime: new Date().toISOString(),
      statistics: this.getErrorStatistics(),
      errors: this.errors
    };
    
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Internal method to log an error
   */
  private logError(error: DetailedErrorInfo): void {
    this.errors.push(error);
    
    if (this.enableFileLogging && this.logFilePath) {
      this.writeToLogFile(error);
    }
  }

  /**
   * Setup log file for persistent logging
   */
  private setupLogFile(logDirectory?: string): void {
    const logDir = logDirectory || join(process.cwd(), 'logs');
    
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFilePath = join(logDir, `modbus-scanner-${timestamp}.log`);
    
    // Write header
    const header = `Modbus Scanner Error Log - Started: ${new Date().toISOString()}\n${'='.repeat(80)}\n`;
    writeFileSync(this.logFilePath, header);
  }

  /**
   * Write error to log file
   */
  private writeToLogFile(error: DetailedErrorInfo): void {
    if (!this.logFilePath) return;
    
    const logEntry = [
      `[${error.timestamp.toISOString()}] ${error.severity.toUpperCase()} ${error.type.toUpperCase()}`,
      `Message: ${error.message}`,
      `Details: ${JSON.stringify(error.details)}`,
      `Context: ${JSON.stringify(error.context)}`,
      '-'.repeat(80)
    ].join('\n') + '\n';
    
    try {
      appendFileSync(this.logFilePath, logEntry);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  /**
   * Determine severity level for Modbus exception codes
   */
  private getModbusExceptionSeverity(errorCode: number): DetailedErrorInfo['severity'] {
    switch (errorCode) {
      case 1: // Illegal Function
      case 2: // Illegal Data Address
        return 'low'; // Expected for scanning unknown registers
      case 3: // Illegal Data Value
      case 4: // Slave Device Failure
        return 'medium';
      case 5: // Acknowledge
      case 6: // Slave Device Busy
        return 'medium';
      case 8: // Memory Parity Error
      case 10: // Gateway Path Unavailable
      case 11: // Gateway Target Device Failed to Respond
        return 'high';
      default:
        return 'medium';
    }
  }
}