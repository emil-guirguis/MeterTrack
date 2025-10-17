import winston from 'winston';
/**
 * ModbusMCPServerWorker - Adapted MCP server for worker thread execution
 * This class wraps the existing MCP server functionality to work in a worker thread
 * without using StdioServerTransport (which is for standalone processes)
 */
export class ModbusMCPServerWorker {
    constructor(config, logger) {
        this.isRunning = false;
        this.dataCollector = null;
        this.availableTools = [];
        this.logger = logger || this.createDefaultLogger();
        // Load environment variables in worker context
        this.loadEnvironmentVariables();
        // Initialize configuration
        this.config = this.initializeConfig(config);
        this.logger.info('ModbusMCPServerWorker initialized', {
            modbusIp: this.config.modbus.ip,
            // databaseUri: this.maskSensitiveInfo(this.config.database.uri),
            collectionInterval: this.config.collectionInterval
        });
    }
    /**
     * Start the MCP server in worker thread
     */
    async start() {
        if (this.isRunning) {
            this.logger.warn('MCP Server already running in worker thread');
            return;
        }
        try {
            this.logger.info('Starting MCP Server in worker thread...');
            // Initialize available tools (equivalent to MCP server tools)
            this.initializeAvailableTools();
            // Initialize data collector
            await this.initializeDataCollector();
            // Start data collection if auto-start is enabled
            if (this.config.autoStart && this.dataCollector) {
                this.logger.info('Auto-starting data collection...');
                await this.dataCollector.start();
            }
            this.isRunning = true;
            this.logger.info('MCP Server started successfully in worker thread');
        }
        catch (error) {
            this.logger.error('Failed to start MCP Server in worker thread:', error);
            throw error;
        }
    }
    /**
     * Stop the MCP server
     */
    async shutdown() {
        if (!this.isRunning) {
            return;
        }
        try {
            this.logger.info('Shutting down MCP Server in worker thread...');
            if (this.dataCollector) {
                await this.dataCollector.shutdown();
                this.dataCollector = null;
            }
            // Clear available tools
            this.availableTools = [];
            this.isRunning = false;
            this.logger.info('MCP Server shutdown complete in worker thread');
        }
        catch (error) {
            this.logger.error('Error during MCP Server shutdown:', error);
            throw error;
        }
    }
    /**
     * Get server status
     */
    async getStatus() {
        return {
            isRunning: this.isRunning,
            config: {
                modbus: {
                    ip: this.config.modbus.ip,
                    port: this.config.modbus.port,
                    slaveId: this.config.modbus.slaveId
                },
                collectionInterval: this.config.collectionInterval,
                autoStart: this.config.autoStart
            },
            dataCollector: this.dataCollector ? await this.dataCollector.getStatus() : null,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
    /**
     * Update configuration
     */
    async updateConfig(newConfig) {
        this.logger.info('Updating MCP Server configuration...');
        // Merge new configuration
        this.config = {
            ...this.config,
            ...newConfig,
            modbus: { ...this.config.modbus, ...newConfig.modbus },
            // database: { ...this.config.database, ...newConfig.database }
        };
        // If server is running, restart with new configuration
        if (this.isRunning) {
            await this.shutdown();
            await this.start();
        }
        this.logger.info('Configuration updated successfully');
    }
    /**
     * Handle data requests from main thread
     */
    async handleDataRequest(request) {
        if (!this.dataCollector) {
            throw new Error('Data collector not initialized');
        }
        const { action, params } = request;
        switch (action) {
            case 'start_collection':
                return await this.dataCollector.start();
            case 'stop_collection':
                this.dataCollector.stop();
                return { success: true, message: 'Data collection stopped' };
            case 'get_status':
                return await this.dataCollector.getStatus();
            case 'read_current_data':
                return await this.dataCollector.collectData();
            case 'get_latest_reading':
                return await this.dataCollector.getLatestReading();
            case 'get_statistics':
                return await this.dataCollector.getStatistics(params?.hours || 24);
            case 'test_connections':
                return await this.testConnections();
            default:
                throw new Error(`Unknown data request action: ${action}`);
        }
    }
    /**
     * Handle MCP tool calls (similar to the original MCP server)
     */
    async handleMCPToolCall(toolName, args) {
        if (!this.availableTools.includes(toolName)) {
            throw new Error(`Unknown tool: ${toolName}`);
        }
        try {
            switch (toolName) {
                case 'start_data_collection':
                    return await this.handleStartDataCollection();
                case 'stop_data_collection':
                    return await this.handleStopDataCollection();
                case 'get_collection_status':
                    return await this.handleGetCollectionStatus();
                case 'read_current_meter_data':
                    return await this.handleReadCurrentMeterData();
                case 'get_latest_reading':
                    return await this.handleGetLatestReading();
                case 'get_meter_statistics':
                    return await this.handleGetMeterStatistics(args);
                case 'test_connections':
                    return await this.handleTestConnections();
                default:
                    throw new Error(`Unknown tool: ${toolName}`);
            }
        }
        catch (error) {
            this.logger.error(`Tool execution error for ${toolName}:`, error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ]
            };
        }
    }
    /**
     * Get list of available tools
     */
    getAvailableTools() {
        return [...this.availableTools];
    }
    /**
     * Test connections to external systems
     */
    async testConnections() {
        try {
            const results = {
                // mongodb: false,
                modbus: false,
                timestamp: new Date().toISOString()
            };
            // Test database connection
            // if (this.dataCollector?.databaseManager) {
            //   results.mongodb = await this.dataCollector.databaseManager.testConnection();
            // }
            // Test Modbus connection
            if (this.dataCollector?.modbusClient) {
                results.modbus = await this.dataCollector.modbusClient.testConnection();
            }
            return results;
        }
        catch (error) {
            this.logger.error('Connection test failed:', error);
            throw error;
        }
    }
    /**
     * Initialize available tools (equivalent to MCP server tools)
     */
    initializeAvailableTools() {
        this.availableTools = [
            'start_data_collection',
            'stop_data_collection',
            'get_collection_status',
            'read_current_meter_data',
            'get_latest_reading',
            'get_meter_statistics',
            'test_connections'
        ];
        this.logger.info('Initialized MCP tools in worker thread', {
            toolCount: this.availableTools.length,
            tools: this.availableTools
        });
    }
    /**
     * MCP Tool Handlers (adapted from original MCP server)
     */
    async handleStartDataCollection() {
        if (!this.dataCollector) {
            throw new Error('Data collector not initialized');
        }
        const success = await this.dataCollector.start();
        const message = success
            ? 'Data collection started successfully'
            : 'Failed to start data collection';
        this.logger.info(message);
        return {
            content: [
                {
                    type: 'text',
                    text: message
                }
            ]
        };
    }
    async handleStopDataCollection() {
        if (!this.dataCollector) {
            throw new Error('Data collector not initialized');
        }
        this.dataCollector.stop();
        const message = 'Data collection stopped';
        this.logger.info(message);
        return {
            content: [
                {
                    type: 'text',
                    text: message
                }
            ]
        };
    }
    async handleGetCollectionStatus() {
        if (!this.dataCollector) {
            throw new Error('Data collector not initialized');
        }
        const status = await this.dataCollector.getStatus();
        return {
            content: [
                {
                    type: 'text',
                    text: `Data Collection Status:\n${JSON.stringify(status, null, 2)}`
                }
            ]
        };
    }
    async handleReadCurrentMeterData() {
        if (!this.dataCollector) {
            throw new Error('Data collector not initialized');
        }
        try {
            const reading = await this.dataCollector.collectData();
            if (reading) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Current Meter Reading:\n${JSON.stringify(reading, null, 2)}`
                        }
                    ]
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Failed to read current meter data'
                        }
                    ]
                };
            }
        }
        catch (error) {
            throw new Error(`Failed to read meter data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetLatestReading() {
        if (!this.dataCollector) {
            throw new Error('Data collector not initialized');
        }
        try {
            const reading = await this.dataCollector.getLatestReading();
            if (reading) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Latest Reading from Database:\n${JSON.stringify(reading, null, 2)}`
                        }
                    ]
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No readings found in database'
                        }
                    ]
                };
            }
        }
        catch (error) {
            throw new Error(`Failed to get latest reading: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetMeterStatistics(args) {
        if (!this.dataCollector) {
            throw new Error('Data collector not initialized');
        }
        try {
            const hours = args?.hours || 24;
            const statistics = await this.dataCollector.getStatistics(hours);
            if (statistics) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Meter Statistics (${hours} hours):\n${JSON.stringify(statistics, null, 2)}`
                        }
                    ]
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No statistics available for the last ${hours} hours`
                        }
                    ]
                };
            }
        }
        catch (error) {
            throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleTestConnections() {
        try {
            const results = await this.testConnections();
            return {
                content: [
                    {
                        type: 'text',
                        text: `Connection Test Results:\n${JSON.stringify(results, null, 2)}`
                    }
                ]
            };
        }
        catch (error) {
            throw new Error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Initialize data collector (placeholder)
     */
    async initializeDataCollector() {
        // This is a placeholder - in the actual implementation, we would:
        // 1. Import the DataCollector class from the MCP agent
        // 2. Create an instance with the configuration
        // 3. Initialize the database and Modbus connections
        this.logger.info('Initializing data collector (placeholder implementation)');
        // For now, create a mock data collector
        // TODO: Replace with actual DataCollector import from mcp-modbus-agent
        this.dataCollector = {
            start: async () => {
                this.logger.info('Mock data collector started');
                return true;
            },
            stop: () => {
                this.logger.info('Mock data collector stopped');
            },
            shutdown: async () => {
                this.logger.info('Mock data collector shutdown');
            },
            getStatus: async () => ({
                isRunning: true,
                errorCount: 0,
                lastCollection: new Date().toISOString(),
                collectionInterval: this.config.collectionInterval,
                autoStart: this.config.autoStart
            }),
            collectData: async () => ({
                timestamp: new Date().toISOString(),
                meterId: 'worker-thread-meter',
                voltage: 230.5 + Math.random() * 10,
                current: 10.2 + Math.random() * 2,
                power: 2351.1 + Math.random() * 100,
                kWh: 1234.5 + Math.random() * 50,
                frequency: 50.0,
                powerFactor: 0.95
            }),
            getLatestReading: async () => ({
                timestamp: new Date().toISOString(),
                meterId: 'worker-thread-meter',
                kWh: 1234.5 + Math.random() * 50,
                totalEnergy: 1234.5
            }),
            getStatistics: async (hours) => ({
                period: `${hours} hours`,
                totalReadings: Math.floor(hours * 4), // Assuming 15-minute intervals
                averagePower: 2300 + Math.random() * 200,
                maxPower: 2500 + Math.random() * 100,
                minPower: 2100 + Math.random() * 100,
                totalEnergy: 1234.5 + Math.random() * 50,
                startTime: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
                endTime: new Date().toISOString()
            },
                modbusClient)
        };
        {
            testConnection: async () => {
                this.logger.info('Testing mock Modbus connection');
                // Simulate connection test
                return Math.random() > 0.2; // 80% success rate for testing
            };
        }
    }
    ;
}
loadEnvironmentVariables();
void {
    try: {}, catch(error) {
        this.logger.warn('Failed to load environment variables:', error);
    }
};
initializeConfig(config ?  : Partial);
DataCollectorConfig;
{
    const defaultConfig = {
        modbus: {
            ip: process.env.MODBUS_IP || '10.10.10.11',
            port: parseInt(process.env.MODBUS_PORT || '502'),
            slaveId: parseInt(process.env.MODBUS_SLAVE_ID || '1'),
            timeout: parseInt(process.env.MODBUS_TIMEOUT || '5000')
        },
        // database: {
        //   uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb',
        //   databaseName: 'meterdb',
        //   collectionName: process.env.MONGODB_COLLECTION || 'meterreadings'
        // },
        collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || '900000'),
        autoStart: process.env.AUTO_START_COLLECTION === 'true'
    };
    return {
        ...defaultConfig,
        ...config,
        modbus: { ...defaultConfig.modbus, ...config?.modbus },
        // database: { ...defaultConfig.database, ...config?.database }
    };
}
createDefaultLogger();
winston.Logger;
{
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [MCP-WORKER] ${level.toUpperCase()}: ${message}`;
        })),
        transports: [
            new winston.transports.Console()
        ]
    });
}
maskSensitiveInfo(uri, string);
string;
{
    return uri.replace(/\/\/[^@]+@/, '//***@');
}
//# sourceMappingURL=ModbusMCPServerWorker.js.map