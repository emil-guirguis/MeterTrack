/**
 * MCP Worker Thread Entry Point
 * This file runs in the worker thread and handles communication with the main thread
 */
declare class MCPWorkerThread {
    private logger;
    private mcpServer;
    private messagePort;
    private isShuttingDown;
    constructor();
    /**
     * Setup message handling from main thread
     */
    private setupMessageHandling;
    /**
     * Handle messages from main thread
     */
    private handleMessage;
    /**
     * Handle start command
     */
    private handleStart;
    /**
     * Handle stop command
     */
    private handleStop;
    /**
     * Handle status request
     */
    private handleStatus;
    /**
     * Handle configuration update
     */
    private handleConfig;
    /**
     * Handle data request
     */
    private handleDataRequest;
    /**
     * Handle ping (health check)
     */
    private handlePing;
    /**
     * Handle garbage collection request
     */
    private handleGarbageCollection;
    /**
     * Handle resource cleanup request
     */
    private handleResourceCleanup;
    /**
     * Send response to main thread
     */
    private sendResponse;
    /**
     * Send unsolicited message to main thread (like health updates)
     */
    private sendUnsolicitedMessage;
    /**
     * Serialize message for transmission
     */
    private serializeMessage;
    /**
     * Deserialize message from transmission
     */
    private deserializeMessage;
    /**
     * Setup error handling for the worker thread
     */
    private setupErrorHandling;
}
declare const worker: MCPWorkerThread;
export default worker;
//# sourceMappingURL=mcp-worker.d.ts.map