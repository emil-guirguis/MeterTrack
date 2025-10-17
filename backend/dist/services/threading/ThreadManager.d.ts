import { EventEmitter } from 'events';
import { ThreadManagerConfig, WorkerMessage, WorkerResponse, ThreadStatus } from './types.js';
/**
 * ThreadManager handles the lifecycle of MCP worker threads
 * Provides methods to start, stop, and communicate with worker threads
 */
export declare class ThreadManager extends EventEmitter {
    private worker;
    private config;
    private status;
    private messageHandler;
    private messageChannel;
    constructor(config?: Partial<ThreadManagerConfig>);
    /**
     * Start the MCP worker thread
     */
    startWorker(): Promise<boolean>;
    /**
     * Stop the MCP worker thread gracefully
     */
    stopWorker(): Promise<void>;
    /**
     * Get current worker thread status
     */
    getStatus(): ThreadStatus;
    /**
     * Send message to worker thread
     */
    sendMessage(message: WorkerMessage): Promise<WorkerResponse>;
    /**
     * Check if worker is running
     */
    isWorkerRunning(): boolean;
    /**
     * Get worker thread ID
     */
    getWorkerThreadId(): number | null;
    /**
     * Send a fire-and-forget message to worker thread
     */
    sendFireAndForgetMessage(message: WorkerMessage): void;
    /**
     * Get message communication statistics
     */
    getMessageStats(): {
        pendingMessages: number;
        oldestPendingMessage: Date | null;
        averageMessageAge: number;
    };
    /**
     * Cleanup expired messages
     */
    cleanupExpiredMessages(): number;
    /**
     * Setup worker event handlers
     */
    private setupWorkerEventHandlers;
    /**
     * Get the path to the worker script
     */
    private getWorkerScriptPath;
    /**
     * Setup message handler event listeners
     */
    private setupMessageHandlerEvents;
    /**
     * Setup cleanup handlers for graceful shutdown
     */
    private setupCleanupHandlers;
}
//# sourceMappingURL=ThreadManager.d.ts.map