import { EventEmitter } from 'events';
import { EnhancedWorkerMessage, MessagePriority } from './types.js';
/**
 * Queue configuration
 */
export interface MessageQueueConfig {
    maxSize: number;
    maxSizePerPriority: Record<MessagePriority, number>;
    enableBackpressure: boolean;
    backpressureThreshold: number;
    processingDelay: number;
    batchSize: number;
    enableBatching: boolean;
}
/**
 * Queued message with metadata
 */
export interface QueuedMessage {
    id: string;
    message: EnhancedWorkerMessage;
    priority: MessagePriority;
    queuedAt: Date;
    attempts: number;
    maxAttempts: number;
    nextAttemptAt?: Date;
}
/**
 * Queue statistics
 */
export interface QueueStats {
    totalSize: number;
    sizeByPriority: Record<MessagePriority, number>;
    processed: number;
    dropped: number;
    backpressureActive: boolean;
    averageWaitTime: number;
    oldestMessageAge: number;
    throughputPerSecond: number;
}
/**
 * Batch of messages for processing
 */
export interface MessageBatch {
    id: string;
    messages: QueuedMessage[];
    priority: MessagePriority;
    createdAt: Date;
}
/**
 * MessageQueue implements priority-based message queuing with backpressure handling
 */
export declare class MessageQueue extends EventEmitter {
    private config;
    private queues;
    private processing;
    private processingInterval;
    private messageIdCounter;
    private stats;
    constructor(config?: Partial<MessageQueueConfig>);
    /**
     * Start message processing
     */
    start(): void;
    /**
     * Stop message processing
     */
    stop(): void;
    /**
     * Enqueue a message with priority handling
     */
    enqueue(message: EnhancedWorkerMessage): boolean;
    /**
     * Dequeue next message based on priority
     */
    dequeue(): QueuedMessage | null;
    /**
     * Dequeue batch of messages for batch processing
     */
    dequeueBatch(): MessageBatch | null;
    /**
     * Peek at next message without removing it
     */
    peek(): QueuedMessage | null;
    /**
     * Get queue statistics
     */
    getStats(): QueueStats;
    /**
     * Clear all messages from queue
     */
    clear(): number;
    /**
     * Clear messages of specific priority
     */
    clearPriority(priority: MessagePriority): number;
    /**
     * Update queue configuration
     */
    updateConfig(newConfig: Partial<MessageQueueConfig>): void;
    /**
     * Check if queue is full for specific priority
     */
    private isQueueFull;
    /**
     * Check if backpressure should be active
     */
    private isBackpressureActive;
    /**
     * Get total size across all priority queues
     */
    private getTotalSize;
    /**
     * Insert message in priority order within queue
     */
    private insertMessageByPriority;
    /**
     * Process messages from queue
     */
    private processMessages;
    /**
     * Process individual message
     */
    private processMessage;
    /**
     * Process batch of messages
     */
    private processBatch;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
    /**
     * Generate unique batch ID
     */
    private generateBatchId;
}
//# sourceMappingURL=MessageQueue.d.ts.map