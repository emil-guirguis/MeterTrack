import { EventEmitter } from 'events';
import { WorkerMessage, WorkerResponse, PendingMessage } from './types.js';
/**
 * Message priority levels
 */
export declare enum MessagePriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}
/**
 * Enhanced message with priority and correlation
 */
export interface EnhancedWorkerMessage extends WorkerMessage {
    priority?: MessagePriority;
    correlationId?: string;
    timeout?: number;
    retryCount?: number;
    maxRetries?: number;
}
/**
 * Enhanced response with timing information
 */
export interface EnhancedWorkerResponse extends WorkerResponse {
    correlationId?: string;
    processingTime?: number;
    queueTime?: number;
}
/**
 * Enhanced pending message with additional metadata
 */
export interface EnhancedPendingMessage extends PendingMessage {
    priority: MessagePriority;
    correlationId?: string;
    timeout: number;
    retryCount: number;
    maxRetries: number;
    queuedAt: Date;
    sentAt?: Date;
}
/**
 * Message statistics
 */
export interface MessageStats {
    totalSent: number;
    totalReceived: number;
    totalTimeouts: number;
    totalRetries: number;
    averageResponseTime: number;
    pendingCount: number;
    oldestPendingAge: number;
    messagesByPriority: Record<MessagePriority, number>;
}
/**
 * MessageHandler manages bidirectional communication between main thread and worker
 * Handles message serialization, deserialization, and correlation with advanced features
 */
export declare class MessageHandler extends EventEmitter {
    private pendingMessages;
    private messageIdCounter;
    private defaultTimeout;
    private messageStats;
    constructor(messageTimeout?: number);
    /**
     * Send a message and wait for response with enhanced features
     */
    sendMessage(message: EnhancedWorkerMessage, postMessage: (msg: any) => void): Promise<EnhancedWorkerResponse>;
    /**
     * Send message with retry logic
     */
    private sendMessageWithRetry;
    /**
     * Handle incoming message from worker with enhanced correlation
     */
    handleIncomingMessage(data: any): void;
    /**
     * Send a fire-and-forget message (no response expected)
     */
    sendFireAndForgetMessage(message: EnhancedWorkerMessage, postMessage: (msg: any) => void): void;
    /**
     * Send message with specific correlation ID for request tracking
     */
    sendCorrelatedMessage(message: WorkerMessage, correlationId: string, postMessage: (msg: any) => void, timeout?: number): Promise<EnhancedWorkerResponse>;
    /**
     * Send high priority message (processed first)
     */
    sendHighPriorityMessage(message: WorkerMessage, postMessage: (msg: any) => void, timeout?: number): Promise<EnhancedWorkerResponse>;
    /**
     * Send critical message with maximum priority and retries
     */
    sendCriticalMessage(message: WorkerMessage, postMessage: (msg: any) => void, maxRetries?: number): Promise<EnhancedWorkerResponse>;
    /**
     * Clear all pending messages (typically called on worker shutdown)
     */
    clearPendingMessages(reason?: string): void;
    /**
     * Get count of pending messages
     */
    getPendingMessageCount(): number;
    /**
     * Get comprehensive message statistics
     */
    getMessageStats(): MessageStats;
    /**
     * Get pending message statistics (legacy method for compatibility)
     */
    getPendingMessageStats(): {
        count: number;
        oldestTimestamp: Date | null;
        averageAge: number;
    };
    /**
     * Get messages by correlation ID
     */
    getMessagesByCorrelationId(correlationId: string): EnhancedPendingMessage[];
    /**
     * Cancel message by request ID
     */
    cancelMessage(requestId: string, reason?: string): boolean;
    /**
     * Cancel all messages with specific correlation ID
     */
    cancelCorrelatedMessages(correlationId: string, reason?: string): number;
    /**
     * Reset message statistics
     */
    resetStats(): void;
    /**
     * Serialize message for transmission
     */
    private serializeMessage;
    /**
     * Deserialize message from transmission
     */
    private deserializeMessage;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
    /**
     * Generate unique correlation ID for request tracking
     */
    private generateCorrelationId;
    /**
     * Cleanup expired messages with enhanced logic
     */
    cleanupExpiredMessages(): number;
    /**
     * Set default timeout for messages
     */
    setDefaultTimeout(timeout: number): void;
    /**
     * Get default timeout
     */
    getDefaultTimeout(): number;
}
//# sourceMappingURL=MessageHandler.d.ts.map