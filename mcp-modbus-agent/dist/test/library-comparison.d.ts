/**
 * Development script for comparing modbus-serial and jsmodbus libraries in MCP agent
 * This script helps test both libraries side by side during migration
 */
import { ModbusClientConfig, MeterReading, PerformanceMetrics } from '../types/modbus';
interface LibraryTestResult {
    library: 'modbus-serial' | 'jsmodbus';
    success: boolean;
    reading?: MeterReading;
    error?: string;
    metrics: PerformanceMetrics;
}
export declare class MCPModbusLibraryComparison {
    private config;
    private logger;
    constructor(config: ModbusClientConfig);
    /**
     * Test meter reading using modbus-serial library
     */
    testModbusSerial(): Promise<LibraryTestResult>;
    /**
     * Test meter reading using jsmodbus library
     */
    testJsModbus(): Promise<LibraryTestResult>;
    /**
     * Compare both libraries for meter reading
     */
    compareLibraries(): Promise<{
        modbusSerial: LibraryTestResult;
        jsmodbus: LibraryTestResult;
        analysis: {
            bothSucceeded: boolean;
            dataConsistency: boolean;
            performanceWinner: string;
            recommendation: string;
            differences: string[];
        };
    }>;
    /**
     * Run comprehensive comparison test
     */
    runComprehensiveTest(): Promise<void>;
}
export {};
