import { EventEmitter } from 'events';
import { MessagePriority } from './types.js';
/**
 * MessageQueue implements priority-based message queuing with backpressure handling
 */
export class MessageQueue extends EventEmitter {
    constructor(config = {}) {
        super();
        this.queues = new Map();
        this.processing = false;
        this.processingInterval = null;
        this.messageIdCounter = 0;
        // Statistics
        this.stats = {
            processed: 0,
            dropped: 0,
            processingTimes: [],
            lastProcessedTime: Date.now()
        };
        // Default configuration
        this.config = {
            maxSize: 1000,
            maxSizePerPriority: {
                [MessagePriority.CRITICAL]: 100,
                [MessagePriority.HIGH]: 200,
                [MessagePriority.NORMAL]: 500,
                [MessagePriority.LOW]: 200
            },
            enableBackpressure: true,
            backpressureThreshold: 0.8, // 80% of max size
            processingDelay: 10, // 10ms between processing cycles
            batchSize: 5,
            enableBatching: false,
            ...config
        };
        // Initialize priority queues
        Object.values(MessagePriority).forEach(priority => {
            if (typeof priority === 'number') {
                this.queues.set(priority, []);
            }
        });
    }
    /**
     * Start message processing
     */
    start() {
        if (this.processing) {
            return;
        }
        this.processing = true;
        this.processingInterval = setInterval(() => {
            this.processMessages();
        }, this.config.processingDelay);
        this.emit('queueStarted');
    }
    /**
     * Stop message processing
     */
    stop() {
        if (!this.processing) {
            return;
        }
        this.processing = false;
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.emit('queueStopped');
    }
    /**
     * Enqueue a message with priority handling
     */
    enqueue(message) {
        const priority = message.priority || MessagePriority.NORMAL;
        const queue = this.queues.get(priority);
        // Check if queue is full
        if (this.isQueueFull(priority)) {
            this.stats.dropped++;
            this.emit('messageDropped', {
                message,
                reason: 'Queue full',
                priority,
                queueSize: queue.length
            });
            return false;
        }
        // Check backpressure
        if (this.config.enableBackpressure && this.isBackpressureActive()) {
            // Drop low priority messages during backpressure
            if (priority === MessagePriority.LOW) {
                this.stats.dropped++;
                this.emit('messageDropped', {
                    message,
                    reason: 'Backpressure active',
                    priority,
                    queueSize: this.getTotalSize()
                });
                return false;
            }
        }
        // Create queued message
        const queuedMessage = {
            id: this.generateMessageId(),
            message,
            priority,
            queuedAt: new Date(),
            attempts: 0,
            maxAttempts: message.maxRetries || 1
        };
        // Insert message in priority order within the queue
        this.insertMessageByPriority(queue, queuedMessage);
        this.emit('messageEnqueued', {
            messageId: queuedMessage.id,
            priority,
            queueSize: queue.length,
            totalSize: this.getTotalSize()
        });
        return true;
    }
    /**
     * Dequeue next message based on priority
     */
    dequeue() {
        // Process in priority order: CRITICAL -> HIGH -> NORMAL -> LOW
        const priorities = [
            MessagePriority.CRITICAL,
            MessagePriority.HIGH,
            MessagePriority.NORMAL,
            MessagePriority.LOW
        ];
        for (const priority of priorities) {
            const queue = this.queues.get(priority);
            if (queue.length > 0) {
                const message = queue.shift();
                this.emit('messageDequeued', {
                    messageId: message.id,
                    priority,
                    waitTime: Date.now() - message.queuedAt.getTime(),
                    queueSize: queue.length
                });
                return message;
            }
        }
        return null;
    }
    /**
     * Dequeue batch of messages for batch processing
     */
    dequeueBatch() {
        if (!this.config.enableBatching) {
            return null;
        }
        const messages = [];
        let batchPriority = MessagePriority.LOW;
        // Collect messages up to batch size, prioritizing higher priority messages
        const priorities = [
            MessagePriority.CRITICAL,
            MessagePriority.HIGH,
            MessagePriority.NORMAL,
            MessagePriority.LOW
        ];
        for (const priority of priorities) {
            const queue = this.queues.get(priority);
            while (queue.length > 0 && messages.length < this.config.batchSize) {
                const message = queue.shift();
                messages.push(message);
                // Set batch priority to highest priority message
                if (priority > batchPriority) {
                    batchPriority = priority;
                }
            }
            if (messages.length >= this.config.batchSize) {
                break;
            }
        }
        if (messages.length === 0) {
            return null;
        }
        const batch = {
            id: this.generateBatchId(),
            messages,
            priority: batchPriority,
            createdAt: new Date()
        };
        this.emit('batchDequeued', {
            batchId: batch.id,
            messageCount: messages.length,
            priority: batchPriority
        });
        return batch;
    }
    /**
     * Peek at next message without removing it
     */
    peek() {
        const priorities = [
            MessagePriority.CRITICAL,
            MessagePriority.HIGH,
            MessagePriority.NORMAL,
            MessagePriority.LOW
        ];
        for (const priority of priorities) {
            const queue = this.queues.get(priority);
            if (queue.length > 0) {
                return queue[0];
            }
        }
        return null;
    }
    /**
     * Get queue statistics
     */
    getStats() {
        const totalSize = this.getTotalSize();
        const sizeByPriority = {};
        // Calculate size by priority
        Object.values(MessagePriority).forEach(priority => {
            if (typeof priority === 'number') {
                sizeByPriority[priority] = this.queues.get(priority)?.length || 0;
            }
        });
        // Calculate average wait time
        const averageProcessingTime = this.stats.processingTimes.length > 0
            ? this.stats.processingTimes.reduce((sum, time) => sum + time, 0) / this.stats.processingTimes.length
            : 0;
        // Calculate oldest message age
        let oldestMessageAge = 0;
        const now = Date.now();
        for (const queue of this.queues.values()) {
            if (queue.length > 0) {
                const oldestInQueue = queue[0].queuedAt.getTime();
                const age = now - oldestInQueue;
                if (age > oldestMessageAge) {
                    oldestMessageAge = age;
                }
            }
        }
        // Calculate throughput
        const timeSinceLastProcessed = Date.now() - this.stats.lastProcessedTime;
        const throughputPerSecond = timeSinceLastProcessed > 0
            ? (this.stats.processed / (timeSinceLastProcessed / 1000))
            : 0;
        return {
            totalSize,
            sizeByPriority,
            processed: this.stats.processed,
            dropped: this.stats.dropped,
            backpressureActive: this.isBackpressureActive(),
            averageWaitTime: averageProcessingTime,
            oldestMessageAge,
            throughputPerSecond
        };
    }
    /**
     * Clear all messages from queue
     */
    clear() {
        let totalCleared = 0;
        for (const queue of this.queues.values()) {
            totalCleared += queue.length;
            queue.length = 0;
        }
        this.emit('queueCleared', { messagesCleared: totalCleared });
        return totalCleared;
    }
    /**
     * Clear messages of specific priority
     */
    clearPriority(priority) {
        const queue = this.queues.get(priority);
        const cleared = queue.length;
        queue.length = 0;
        this.emit('priorityCleared', { priority, messagesCleared: cleared });
        return cleared;
    }
    /**
     * Update queue configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.emit('configUpdated', this.config);
    }
    /**
     * Check if queue is full for specific priority
     */
    isQueueFull(priority) {
        const queue = this.queues.get(priority);
        const maxSize = this.config.maxSizePerPriority[priority];
        return queue.length >= maxSize;
    }
    /**
     * Check if backpressure should be active
     */
    isBackpressureActive() {
        if (!this.config.enableBackpressure) {
            return false;
        }
        const totalSize = this.getTotalSize();
        const threshold = this.config.maxSize * this.config.backpressureThreshold;
        return totalSize >= threshold;
    }
    /**
     * Get total size across all priority queues
     */
    getTotalSize() {
        let total = 0;
        for (const queue of this.queues.values()) {
            total += queue.length;
        }
        return total;
    }
    /**
     * Insert message in priority order within queue
     */
    insertMessageByPriority(queue, message) {
        // For now, just append to end (FIFO within priority)
        // Could be enhanced to sort by timestamp or other criteria
        queue.push(message);
    }
    /**
     * Process messages from queue
     */
    processMessages() {
        if (this.config.enableBatching) {
            const batch = this.dequeueBatch();
            if (batch) {
                this.processBatch(batch);
            }
        }
        else {
            const message = this.dequeue();
            if (message) {
                this.processMessage(message);
            }
        }
    }
    /**
     * Process individual message
     */
    processMessage(queuedMessage) {
        const startTime = Date.now();
        this.emit('messageProcessing', {
            messageId: queuedMessage.id,
            priority: queuedMessage.priority,
            attempts: queuedMessage.attempts + 1
        });
        // Simulate processing (actual processing would be handled by consumer)
        const processingTime = Date.now() - startTime;
        this.stats.processed++;
        this.stats.processingTimes.push(processingTime);
        this.stats.lastProcessedTime = Date.now();
        // Keep only last 100 processing times for average calculation
        if (this.stats.processingTimes.length > 100) {
            this.stats.processingTimes = this.stats.processingTimes.slice(-100);
        }
        this.emit('messageProcessed', {
            messageId: queuedMessage.id,
            priority: queuedMessage.priority,
            processingTime,
            waitTime: startTime - queuedMessage.queuedAt.getTime()
        });
    }
    /**
     * Process batch of messages
     */
    processBatch(batch) {
        const startTime = Date.now();
        this.emit('batchProcessing', {
            batchId: batch.id,
            messageCount: batch.messages.length,
            priority: batch.priority
        });
        // Process all messages in batch
        batch.messages.forEach(message => {
            this.stats.processed++;
        });
        const processingTime = Date.now() - startTime;
        this.stats.lastProcessedTime = Date.now();
        this.emit('batchProcessed', {
            batchId: batch.id,
            messageCount: batch.messages.length,
            priority: batch.priority,
            processingTime
        });
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `qmsg_${++this.messageIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    /**
     * Generate unique batch ID
     */
    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
}
//# sourceMappingURL=MessageQueue.js.map