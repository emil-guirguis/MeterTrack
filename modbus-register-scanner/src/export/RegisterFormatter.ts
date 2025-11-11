import { RegisterInfo } from '../types';
import { RegisterNameMapper } from '../utils/RegisterNameMapper';

/**
 * Formatted register data for export purposes
 */
export interface FormattedRegisterData {
  address: number;
  functionCode: number;
  functionCodeName: string;
  dataType: string;
  value: string;
  accessible: boolean;
  accessibilityStatus: string;
  timestamp: string;
  error?: string;
  errorCode?: number;
  description?: string;
  registerName?: string;
  unit?: string;
}

/**
 * Utility class for formatting register metadata for different export formats
 */
export class RegisterFormatter {
  private static registerNameMapper = new RegisterNameMapper();

  /**
   * Map of function codes to their human-readable names
   */
  private static readonly FUNCTION_CODE_NAMES: Record<number, string> = {
    1: 'Read Coils',
    2: 'Read Discrete Inputs', 
    3: 'Read Holding Registers',
    4: 'Read Input Registers'
  };

  /**
   * Map of data types to their descriptions
   */
  private static readonly DATA_TYPE_DESCRIPTIONS: Record<string, string> = {
    'coil': 'Digital Output (Read/Write)',
    'discrete': 'Digital Input (Read Only)',
    'holding': 'Analog Output/Configuration (Read/Write)',
    'input': 'Analog Input (Read Only)'
  };

  /**
   * Format register information for CSV export
   * @param register The register to format
   * @returns Formatted data suitable for CSV export
   */
  static formatForCsv(register: RegisterInfo): FormattedRegisterData {
    const registerInfo = this.registerNameMapper.getRegisterInfo(register.address, register.functionCode);
    
    return {
      address: register.address,
      functionCode: register.functionCode,
      functionCodeName: this.getFunctionCodeName(register.functionCode),
      dataType: register.dataType,
      value: this.formatValue(register.value, register.dataType),
      accessible: register.accessible,
      accessibilityStatus: register.accessible ? 'Accessible' : 'Not Accessible',
      timestamp: register.timestamp.toISOString(),
      error: register.error?.message || '',
      errorCode: register.error?.code,
      description: register.error?.description || this.getDataTypeDescription(register.dataType),
      registerName: registerInfo?.name || 'Unknown',
      unit: registerInfo?.unit || ''
    };
  }

  /**
   * Format register information for JSON export
   * @param register The register to format
   * @returns Formatted data suitable for JSON export
   */
  static formatForJson(register: RegisterInfo): any {
    const registerInfo = this.registerNameMapper.getRegisterInfo(register.address, register.functionCode);
    
    const formatted: any = {
      address: register.address,
      functionCode: {
        code: register.functionCode,
        name: this.getFunctionCodeName(register.functionCode)
      },
      dataType: {
        type: register.dataType,
        description: this.getDataTypeDescription(register.dataType)
      },
      value: {
        raw: register.value,
        formatted: this.formatValue(register.value, register.dataType),
        dataType: typeof register.value
      },
      accessibility: {
        accessible: register.accessible,
        status: register.accessible ? 'accessible' : 'not_accessible'
      },
      timestamp: register.timestamp.toISOString(),
      registerInfo: {
        name: registerInfo?.name || 'Unknown',
        description: registerInfo?.description || 'No description available',
        unit: registerInfo?.unit || ''
      },
      metadata: {
        readOnly: this.isReadOnly(register.dataType),
        bitSize: this.getBitSize(register.dataType),
        category: this.getRegisterCategory(register.dataType)
      }
    };

    if (register.error) {
      formatted.error = {
        code: register.error.code,
        message: register.error.message,
        description: register.error.description,
        type: this.getErrorType(register.error.code)
      };
    }

    return formatted;
  }

  /**
   * Get human-readable function code name
   */
  private static getFunctionCodeName(functionCode: number): string {
    return this.FUNCTION_CODE_NAMES[functionCode] || `Unknown Function Code ${functionCode}`;
  }

  /**
   * Get data type description
   */
  private static getDataTypeDescription(dataType: string): string {
    return this.DATA_TYPE_DESCRIPTIONS[dataType] || `Unknown data type: ${dataType}`;
  }

  /**
   * Format register value based on data type
   */
  private static formatValue(value: number | boolean, dataType: string): string {
    if (typeof value === 'boolean') {
      return dataType === 'coil' || dataType === 'discrete' ? 
        (value ? 'ON (1)' : 'OFF (0)') : 
        value.toString();
    }
    
    if (typeof value === 'number') {
      // Format based on data type
      switch (dataType) {
        case 'holding':
        case 'input':
          // Show both decimal and hex for register values
          return `${value} (0x${value.toString(16).toUpperCase().padStart(4, '0')})`;
        default:
          return value.toString();
      }
    }
    
    return String(value);
  }

  /**
   * Determine if register type is read-only
   */
  private static isReadOnly(dataType: string): boolean {
    return dataType === 'discrete' || dataType === 'input';
  }

  /**
   * Get bit size for register type
   */
  private static getBitSize(dataType: string): number {
    switch (dataType) {
      case 'coil':
      case 'discrete':
        return 1; // Single bit
      case 'holding':
      case 'input':
        return 16; // 16-bit register
      default:
        return 0;
    }
  }

  /**
   * Get register category
   */
  private static getRegisterCategory(dataType: string): string {
    switch (dataType) {
      case 'coil':
      case 'discrete':
        return 'digital';
      case 'holding':
      case 'input':
        return 'analog';
      default:
        return 'unknown';
    }
  }

  /**
   * Get error type based on Modbus exception code
   */
  private static getErrorType(errorCode?: number): string {
    if (!errorCode) return 'unknown';
    
    const errorTypes: Record<number, string> = {
      1: 'illegal_function',
      2: 'illegal_data_address',
      3: 'illegal_data_value',
      4: 'slave_device_failure',
      5: 'acknowledge',
      6: 'slave_device_busy',
      8: 'memory_parity_error',
      10: 'gateway_path_unavailable',
      11: 'gateway_target_device_failed'
    };
    
    return errorTypes[errorCode] || 'unknown_exception';
  }

  /**
   * Create summary statistics for a collection of registers
   */
  static createSummary(registers: RegisterInfo[]): any {
    const summary = {
      total: registers.length,
      accessible: registers.filter(r => r.accessible).length,
      byFunctionCode: {} as Record<number, number>,
      byDataType: {} as Record<string, number>,
      errors: {} as Record<string, number>
    };

    registers.forEach(register => {
      // Count by function code
      summary.byFunctionCode[register.functionCode] = 
        (summary.byFunctionCode[register.functionCode] || 0) + 1;
      
      // Count by data type
      summary.byDataType[register.dataType] = 
        (summary.byDataType[register.dataType] || 0) + 1;
      
      // Count errors
      if (register.error) {
        const errorType = register.error.message;
        summary.errors[errorType] = (summary.errors[errorType] || 0) + 1;
      }
    });

    return summary;
  }
}