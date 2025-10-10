import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { DataCollector } from './data-collector.js';
import { createLogger } from './logger.js';
// Load environment variables
// 1) Try loading from backend/.env to reuse shared settings (e.g., MongoDB URI)
// 2) Then load local mcp-modbus-agent/.env to allow overrides if needed
(() => {
    try {
        const thisFile = fileURLToPath(import.meta.url);
        const thisDir = path.dirname(thisFile); // dist folder at runtime
        const agentDir = path.resolve(thisDir, '..');
        const rootDir = path.resolve(agentDir, '..');
        const backendEnv = path.join(rootDir, 'backend', '.env');
        const agentEnv = path.join(agentDir, '.env');
        // Load backend first (no override), then agent (override=true)
        dotenvConfig({ path: backendEnv });
        dotenvConfig({ path: agentEnv, override: true });
    }
    catch {
        // Fallback to default search
        dotenvConfig();
    }
})();
// Configuration
const config = {
    modbus: {
        ip: process.env.MODBUS_IP || '10.10.10.11',
        port: parseInt(process.env.MODBUS_PORT || '502'),
        slaveId: parseInt(process.env.MODBUS_SLAVE_ID || '1'),
        timeout: parseInt(process.env.MODBUS_TIMEOUT || '5000')
    },
    database: {
        host: process.env.POSTGRES_HOST || 'aws-1-us-west-1.pooler.supabase.com',
        port: parseInt(process.env.POSTGRES_PORT || '6543'),
        database: process.env.POSTGRES_DB || 'postgres',
        user: process.env.POSTGRES_USER || 'postgres.hpetwjgsfpscjlnzmzby',
        password: process.env.POSTGRES_PASSWORD || 'your-password-here',
        ssl: process.env.POSTGRES_SSL !== 'false'
    },
    collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || '900000'),
    autoStart: process.env.AUTO_START_COLLECTION === 'true'
};
class ModbusMCPServer {
    server;
    dataCollector;
    logger;
    constructor() {
        this.logger = createLogger();
        this.dataCollector = new DataCollector(config, this.logger);
        this.server = new Server({
            name: process.env.MCP_SERVER_NAME || 'modbus-meter-agent',
            version: process.env.MCP_SERVER_VERSION || '1.0.0',
            capabilities: {
                tools: {}
            }
        });
        this.setupTools();
        this.setupEventHandlers();
    }
    setupTools() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'start_data_collection',
                        description: 'Start collecting data from the Modbus device and storing in MongoDB',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'stop_data_collection',
                        description: 'Stop data collection from the Modbus device',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'get_collection_status',
                        description: 'Get the current status of data collection',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'read_current_meter_data',
                        description: 'Read current meter data from the Modbus device',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'get_latest_reading',
                        description: 'Get the latest meter reading from the database',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'get_meter_statistics',
                        description: 'Get statistical data for the meter over a specified time period',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                hours: {
                                    type: 'number',
                                    description: 'Number of hours to look back for statistics (default: 24)',
                                    default: 24
                                }
                            },
                            required: []
                        }
                    },
                    {
                        name: 'test_connections',
                        description: 'Test connections to both Modbus device and MongoDB',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    }
                ]
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
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
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                this.logger.error(`Tool execution error for ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ]
                };
            }
        });
    }
    async handleStartDataCollection() {
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
            // Test MongoDB connection
            const dbStatus = await this.dataCollector.databaseManager.testConnection();
            // Test Modbus connection
            const modbusStatus = await this.dataCollector.modbusClient.testConnection();
            const results = {
                mongodb: dbStatus ? 'Connected' : 'Failed',
                modbus: modbusStatus ? 'Connected' : 'Failed',
                timestamp: new Date().toISOString()
            };
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
    setupEventHandlers() {
        // Graceful shutdown
        process.on('SIGINT', async () => {
            this.logger.info('Received SIGINT, shutting down gracefully...');
            await this.shutdown();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            this.logger.info('Received SIGTERM, shutting down gracefully...');
            await this.shutdown();
            process.exit(0);
        });
    }
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info(`🚀 Modbus MCP Server started successfully`);
        this.logger.info(`📊 Configuration: Modbus IP: ${config.modbus.ip}, PostgreSQL: ${config.database.host}:${config.database.port}/${config.database.database}`);
        this.logger.info(`⏱️  Collection Interval: ${config.collectionInterval}ms (${config.collectionInterval / 60000} minutes)`);
        this.logger.info(`🔧 Auto-start Collection: ${config.autoStart}`);
        this.logger.info(`📡 Server ready for MCP client connections via stdio`);
        // Auto-start data collection if configured
        if (config.autoStart) {
            this.logger.info('🔄 Auto-starting data collection...');
            await this.dataCollector.start();
        }
        // In development mode, add periodic status logging
        if (process.env.NODE_ENV === 'development') {
            setInterval(() => {
                this.logger.info(`💓 MCP Server heartbeat - ${new Date().toISOString()}`);
            }, 30000); // Every 30 seconds
        }
    }
    async shutdown() {
        this.logger.info('Shutting down MCP server...');
        await this.dataCollector.shutdown();
        this.logger.info('MCP server shutdown complete');
    }
}
// Start the server
async function main() {
    const server = new ModbusMCPServer();
    await server.start();
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    });
}
