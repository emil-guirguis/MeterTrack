/**
 * Development script for comparing modbus-serial and jsmodbus libraries
 * This script helps test both libraries side by side during migration
 */
import { ModbusConnectionConfig } from '../types/modbus';
interface ComparisonResult {
    library: 'modbus-serial' | 'jsmodbus';
    success: boolean;
    data?: number[];
    error?: string;
    responseTime: number;
}
export declare class ModbusLibraryComparison {
    private config;
    constructor(config: ModbusConnectionConfig);
    /**
     * Test connection using modbus-serial library
     */
    testModbusSerial(): Promise<ComparisonResult>;
    /**
     * Test connection using jsmodbus library
     */
    testJsModbus(): Promise<ComparisonResult>;
    /**
     * Compare both libraries side by side
     */
    compareLibraries(): Promise<{
        modbusSerial: ComparisonResult;
        jsmodbus: ComparisonResult;
        comparison: {
            bothSucceeded: boolean;
            dataMatches: boolean;
            performanceDiff: number;
            recommendation: string;
        };
    }>;
    /**
     * Run comprehensive test suite
     */
    runComprehensiveTest(): Promise<void>;
}
export {};
//# sourceMappingURL=modbus-library-comparison.d.ts.map