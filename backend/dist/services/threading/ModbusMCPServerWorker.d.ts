import winston from 'winston';
interface DataCollectorConfig {
    modbus: {
        ip: string;
        port: number;
        slaveId: number;
        timeout: number;
    };
    collectionInterval: number;
    autoStart: boolean;
}
/**
 * ModbusMCPServerWorker - Adapted MCP server for worker thread execution
 * This class wraps the existing MCP server functionality to work in a worker thread
 * without using StdioServerTransport (which is for standalone processes)
 */
export declare class ModbusMCPServerWorker {
    private logger;
    private config;
    private isRunning;
    private dataCollector;
    private availableTools;
    constructor(config?: Partial<DataCollectorConfig>, logger?: winston.Logger);
    /**
     * Start the MCP server in worker thread
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server
     */
    shutdown(): Promise<void>;
    /**
     * Get server status
     */
    getStatus(): Promise<any>;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<DataCollectorConfig>): Promise<void>;
    /**
     * Handle data requests from main thread
     */
    handleDataRequest(request: any): Promise<any>;
    /**
     * Handle MCP tool calls (similar to the original MCP server)
     */
    handleMCPToolCall(toolName: string, args: any): Promise<any>;
    /**
     * Get list of available tools
     */
    getAvailableTools(): string[];
    /**
     * Test connections to external systems
     */
    private testConnections;
    /**
     * Initialize available tools (equivalent to MCP server tools)
     */
    private initializeAvailableTools;
    /**
     * MCP Tool Handlers (adapted from original MCP server)
     */
    private handleStartDataCollection;
    private handleStopDataCollection;
    private handleGetCollectionStatus;
    private handleReadCurrentMeterData;
    private handleGetLatestReading;
    private handleGetMeterStatistics;
    private handleTestConnections;
    /**
     * Initialize data collector (placeholder)
     */
    private initializeDataCollector;
}
export {};
//# sourceMappingURL=ModbusMCPServerWorker.d.ts.map