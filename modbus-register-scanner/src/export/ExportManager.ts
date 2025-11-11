import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { RegisterInfo, ScanResults } from '../types';
import { RegisterFormatter } from './RegisterFormatter';

/**
 * Export formats supported by the ExportManager
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json'
}

/**
 * Options for exporting scan results
 */
export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  filename?: string;
  includeTimestamp?: boolean;
}

/**
 * Manages exporting of discovered register data to various formats
 */
export class ExportManager {
  /**
   * Export scan results to the specified format
   * @param results The scan results to export
   * @param options Export configuration options
   * @returns Promise resolving to the output file path
   */
  async exportResults(results: ScanResults, options: ExportOptions): Promise<string> {
    const filename = this.generateFilename(options);
    const outputPath = options.outputPath || process.cwd();
    const fullPath = path.join(outputPath, filename);

    // Ensure output directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    switch (options.format) {
      case ExportFormat.CSV:
        await this.exportToCsv(results, fullPath);
        break;
      case ExportFormat.JSON:
        await this.exportToJson(results, fullPath);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    return fullPath;
  }

  /**
   * Export results to CSV format with proper headers and comma separation
   */
  private async exportToCsv(results: ScanResults, filePath: string): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'address', title: 'Register Address' },
        { id: 'functionCode', title: 'Function Code' },
        { id: 'functionCodeName', title: 'Function Code Name' },
        { id: 'registerName', title: 'Register Name' },
        { id: 'dataType', title: 'Data Type' },
        { id: 'value', title: 'Sample Value' },
        { id: 'unit', title: 'Unit' },
        { id: 'accessible', title: 'Accessible' },
        { id: 'accessibilityStatus', title: 'Accessibility Status' },
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'error', title: 'Error Message' },
        { id: 'errorCode', title: 'Error Code' },
        { id: 'description', title: 'Description' }
      ]
    });

    // Transform register data for CSV export using RegisterFormatter
    const csvData = results.registers.map(register => RegisterFormatter.formatForCsv(register));

    await csvWriter.writeRecords(csvData);
  }

  /**
   * Export results to JSON format with structured register objects
   */
  private async exportToJson(results: ScanResults, filePath: string): Promise<void> {
    // Create structured JSON output with enhanced metadata
    const jsonOutput = {
      scanInfo: {
        config: {
          host: results.config.host,
          port: results.config.port,
          slaveId: results.config.slaveId,
          timeout: results.config.timeout,
          retries: results.config.retries,
          batchSize: results.config.batchSize
        },
        startTime: results.startTime.toISOString(),
        endTime: results.endTime.toISOString(),
        duration: results.endTime.getTime() - results.startTime.getTime(),
        totalRegisters: results.totalRegisters,
        accessibleRegisters: results.accessibleRegisters,
        successRate: results.totalRegisters > 0 ? 
          (results.accessibleRegisters / results.totalRegisters * 100).toFixed(2) + '%' : '0%',
        summary: RegisterFormatter.createSummary(results.registers)
      },
      registers: results.registers.map(register => RegisterFormatter.formatForJson(register)),
      errors: results.errors
    };

    const jsonString = JSON.stringify(jsonOutput, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
  }

  /**
   * Generate timestamped filename for export files
   */
  private generateFilename(options: ExportOptions): string {
    const baseFilename = options.filename || 'modbus-scan-results';
    const extension = options.format;
    
    if (options.includeTimestamp !== false) {
      const now = new Date();
      const timestamp = now.toISOString()
        .split('.')[0] // Remove milliseconds and Z suffix
        .replace(/[:.]/g, '-')
        .replace('T', '_');
      
      return `${baseFilename}_${timestamp}.${extension}`;
    }
    
    return `${baseFilename}.${extension}`;
  }



  /**
   * Get available export formats
   */
  static getAvailableFormats(): ExportFormat[] {
    return Object.values(ExportFormat);
  }

  /**
   * Validate export options
   */
  static validateOptions(options: ExportOptions): void {
    if (!Object.values(ExportFormat).includes(options.format)) {
      throw new Error(`Invalid export format: ${options.format}. Available formats: ${Object.values(ExportFormat).join(', ')}`);
    }

    if (options.outputPath && !path.isAbsolute(options.outputPath) && !options.outputPath.startsWith('.')) {
      // Allow relative paths starting with ./ or ../
      if (!options.outputPath.match(/^\.\.?\//)) {
        throw new Error('Output path must be absolute or start with ./ or ../');
      }
    }
  }
}