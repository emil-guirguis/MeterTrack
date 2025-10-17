import { EventEmitter } from 'events';
/**
 * Message priority levels
 */
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority[MessagePriority["LOW"] = 0] = "LOW";
    MessagePriority[MessagePriority["NORMAL"] = 1] = "NORMAL";
    MessagePriority[MessagePriority["HIGH"] = 2] = "HIGH";
    MessagePriority[MessagePriority["CRITICAL"] = 3] = "CRITICAL";
})(MessagePriority || (MessagePriority = {}));
/**
 * MessageHandler manages bidirectional communication between main thread and worker
 * Handles message serialization, deserialization, and correlation with advanced features
 */
export class MessageHandler extends EventEmitter {
    constructor(messageTimeout = 10000) {
        super();
        this.pendingMessages = new Map();
        this.messageIdCounter = 0;
        this.defaultTimeout = messageTimeout;
        this.messageStats = {
            sent: 0,
            received: 0,
            timeouts: 0,
            retries: 0,
            responseTimes: [],
            messagesByPriority: {
                [MessagePriority.LOW]: 0,
                [MessagePriority.NORMAL]: 0,
                [MessagePriority.HIGH]: 0,
                [MessagePriority.CRITICAL]: 0
            }
        };
    }
    /**
     * Send a message and wait for response with enhanced features
     */
    async sendMessage(message, postMessage) {
        const requestId = this.generateMessageId();
        const correlationId = message.correlationId || this.generateCorrelationId();
        const priority = message.priority || MessagePriority.NORMAL;
        const timeout = message.timeout || this.defaultTimeout;
        const maxRetries = message.maxRetries || 0;
        const enhancedMessage = {
            ...message,
            requestId,
            correlationId,
            priority,
            timeout,
            retryCount: message.retryCount || 0,
            maxRetries
        };
        return this.sendMessageWithRetry(enhancedMessage, postMessage, 0);
    }
    /**
     * Send message with retry logic
     */
    async sendMessageWithRetry(message, postMessage, currentRetry) {
        return new Promise((resolve, reject) => {
            const requestId = message.requestId;
            const queuedAt = new Date();
            // Store pending message
            const pendingMessage = {
                message,
                resolve: (response) => {
                    const enhancedResponse = response;
                    const responseTime = Date.now() - queuedAt.getTime();
                    // Add timing information
                    enhancedResponse.processingTime = responseTime;
                    enhancedResponse.queueTime = pendingMessage.sentAt
                        ? pendingMessage.sentAt.getTime() - queuedAt.getTime()
                        : 0;
                    // Update statistics
                    this.messageStats.received++;
                    this.messageStats.responseTimes.push(responseTime);
                    // Keep only last 100 response times for average calculation
                    if (this.messageStats.responseTimes.length > 100) {
                        this.messageStats.responseTimes = this.messageStats.responseTimes.slice(-100);
                    }
                    resolve(enhancedResponse);
                },
                reject,
                timestamp: queuedAt,
                priority: message.priority,
                correlationId: message.correlationId,
                timeout: message.timeout,
                retryCount: currentRetry,
                maxRetries: message.maxRetries,
                queuedAt,
                sentAt: undefined
            };
            this.pendingMessages.set(requestId, pendingMessage);
            // Set timeout for message
            const timeoutId = setTimeout(() => {
                if (this.pendingMessages.has(requestId)) {
                    this.pendingMessages.delete(requestId);
                    this.messageStats.timeouts++;
                    // Attempt retry if retries are available
                    if (currentRetry < message.maxRetries) {
                        this.messageStats.retries++;
                        this.emit('messageRetry', {
                            requestId,
                            correlationId: message.correlationId,
                            attempt: currentRetry + 1,
                            maxRetries: message.maxRetries
                        });
                        // Retry with exponential backoff
                        const retryDelay = Math.min(1000 * Math.pow(2, currentRetry), 10000);
                        setTimeout(() => {
                            this.sendMessageWithRetry(message, postMessage, currentRetry + 1)
                                .then(resolve)
                                .catch(reject);
                        }, retryDelay);
                    }
                    else {
                        reject(new Error(`Message timeout after ${message.timeout}ms (${currentRetry + 1} attempts)`));
                    }
                }
            }, message.timeout);
            // Override reject to clear timeout
            const originalReject = pendingMessage.reject;
            pendingMessage.reject = (error) => {
                clearTimeout(timeoutId);
                originalReject(error);
            };
            // Send message
            try {
                const serializedMessage = this.serializeMessage(message);
                pendingMessage.sentAt = new Date();
                postMessage(serializedMessage);
                // Update statistics
                this.messageStats.sent++;
                this.messageStats.messagesByPriority[message.priority]++;
                this.emit('messageSent', {
                    requestId,
                    correlationId: message.correlationId,
                    priority: message.priority,
                    type: message.type
                });
            }
            catch (error) {
                this.pendingMessages.delete(requestId);
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    /**
     * Handle incoming message from worker with enhanced correlation
     */
    handleIncomingMessage(data) {
        try {
            const response = this.deserializeMessage(data);
            const { requestId, correlationId } = response;
            if (requestId && this.pendingMessages.has(requestId)) {
                // This is a response to a pending request
                const pendingMessage = this.pendingMessages.get(requestId);
                this.pendingMessages.delete(requestId);
                // Add correlation ID to response if available
                if (correlationId) {
                    response.correlationId = correlationId;
                }
                this.emit('messageReceived', {
                    requestId,
                    correlationId,
                    type: response.type,
                    processingTime: response.processingTime
                });
                if (response.type === 'error') {
                    pendingMessage.reject(new Error(response.error || 'Unknown worker error'));
                }
                else {
                    pendingMessage.resolve(response);
                }
            }
            else {
                // This is an unsolicited message (like health updates, events)
                this.emit('unsolicitedMessage', response);
            }
        }
        catch (error) {
            this.emit('messageError', error);
        }
    }
    /**
     * Send a fire-and-forget message (no response expected)
     */
    sendFireAndForgetMessage(message, postMessage) {
        const requestId = this.generateMessageId();
        const correlationId = message.correlationId || this.generateCorrelationId();
        const priority = message.priority || MessagePriority.NORMAL;
        const messageWithId = {
            ...message,
            requestId,
            correlationId,
            priority
        };
        const serializedMessage = this.serializeMessage(messageWithId);
        try {
            postMessage(serializedMessage);
            // Update statistics
            this.messageStats.sent++;
            this.messageStats.messagesByPriority[priority]++;
            this.emit('fireAndForgetSent', {
                requestId,
                correlationId,
                priority,
                type: message.type
            });
        }
        catch (error) {
            this.emit('messageError', error);
        }
    }
    /**
     * Send message with specific correlation ID for request tracking
     */
    async sendCorrelatedMessage(message, correlationId, postMessage, timeout) {
        const enhancedMessage = {
            ...message,
            correlationId,
            timeout: timeout || this.defaultTimeout
        };
        return this.sendMessage(enhancedMessage, postMessage);
    }
    /**
     * Send high priority message (processed first)
     */
    async sendHighPriorityMessage(message, postMessage, timeout) {
        const enhancedMessage = {
            ...message,
            priority: MessagePriority.HIGH,
            timeout: timeout || this.defaultTimeout
        };
        return this.sendMessage(enhancedMessage, postMessage);
    }
    /**
     * Send critical message with maximum priority and retries
     */
    async sendCriticalMessage(message, postMessage, maxRetries = 3) {
        const enhancedMessage = {
            ...message,
            priority: MessagePriority.CRITICAL,
            timeout: this.defaultTimeout * 2, // Double timeout for critical messages
            maxRetries
        };
        return this.sendMessage(enhancedMessage, postMessage);
    }
    /**
     * Clear all pending messages (typically called on worker shutdown)
     */
    clearPendingMessages(reason = 'Worker stopped') {
        for (const [id, pendingMessage] of this.pendingMessages) {
            pendingMessage.reject(new Error(reason));
        }
        this.pendingMessages.clear();
    }
    /**
     * Get count of pending messages
     */
    getPendingMessageCount() {
        return this.pendingMessages.size;
    }
    /**
     * Get comprehensive message statistics
     */
    getMessageStats() {
        const pendingCount = this.pendingMessages.size;
        let oldestPendingAge = 0;
        if (pendingCount > 0) {
            const now = Date.now();
            const oldestMessage = Array.from(this.pendingMessages.values())
                .reduce((oldest, current) => current.queuedAt < oldest.queuedAt ? current : oldest);
            oldestPendingAge = now - oldestMessage.queuedAt.getTime();
        }
        const averageResponseTime = this.messageStats.responseTimes.length > 0
            ? this.messageStats.responseTimes.reduce((sum, time) => sum + time, 0) / this.messageStats.responseTimes.length
            : 0;
        return {
            totalSent: this.messageStats.sent,
            totalReceived: this.messageStats.received,
            totalTimeouts: this.messageStats.timeouts,
            totalRetries: this.messageStats.retries,
            averageResponseTime,
            pendingCount,
            oldestPendingAge,
            messagesByPriority: { ...this.messageStats.messagesByPriority }
        };
    }
    /**
     * Get pending message statistics (legacy method for compatibility)
     */
    getPendingMessageStats() {
        const count = this.pendingMessages.size;
        if (count === 0) {
            return { count: 0, oldestTimestamp: null, averageAge: 0 };
        }
        const now = new Date();
        let totalAge = 0;
        let oldestTimestamp = null;
        for (const pendingMessage of this.pendingMessages.values()) {
            const age = now.getTime() - pendingMessage.queuedAt.getTime();
            totalAge += age;
            if (!oldestTimestamp || pendingMessage.queuedAt < oldestTimestamp) {
                oldestTimestamp = pendingMessage.queuedAt;
            }
        }
        return {
            count,
            oldestTimestamp,
            averageAge: totalAge / count
        };
    }
    /**
     * Get messages by correlation ID
     */
    getMessagesByCorrelationId(correlationId) {
        return Array.from(this.pendingMessages.values())
            .filter(msg => msg.correlationId === correlationId);
    }
    /**
     * Cancel message by request ID
     */
    cancelMessage(requestId, reason = 'Cancelled') {
        const pendingMessage = this.pendingMessages.get(requestId);
        if (pendingMessage) {
            this.pendingMessages.delete(requestId);
            pendingMessage.reject(new Error(reason));
            this.emit('messageCancelled', {
                requestId,
                correlationId: pendingMessage.correlationId,
                reason
            });
            return true;
        }
        return false;
    }
    /**
     * Cancel all messages with specific correlation ID
     */
    cancelCorrelatedMessages(correlationId, reason = 'Cancelled') {
        let cancelledCount = 0;
        for (const [requestId, pendingMessage] of this.pendingMessages) {
            if (pendingMessage.correlationId === correlationId) {
                this.pendingMessages.delete(requestId);
                pendingMessage.reject(new Error(reason));
                cancelledCount++;
            }
        }
        if (cancelledCount > 0) {
            this.emit('correlatedMessagesCancelled', {
                correlationId,
                count: cancelledCount,
                reason
            });
        }
        return cancelledCount;
    }
    /**
     * Reset message statistics
     */
    resetStats() {
        this.messageStats = {
            sent: 0,
            received: 0,
            timeouts: 0,
            retries: 0,
            responseTimes: [],
            messagesByPriority: {
                [MessagePriority.LOW]: 0,
                [MessagePriority.NORMAL]: 0,
                [MessagePriority.HIGH]: 0,
                [MessagePriority.CRITICAL]: 0
            }
        };
        this.emit('statsReset');
    }
    /**
     * Serialize message for transmission
     */
    serializeMessage(message) {
        try {
            return JSON.stringify({
                ...message,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            throw new Error(`Failed to serialize message: ${error}`);
        }
    }
    /**
     * Deserialize message from transmission
     */
    deserializeMessage(data) {
        try {
            if (typeof data === 'string') {
                return JSON.parse(data);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Failed to deserialize message: ${error}`);
        }
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${++this.messageIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    /**
     * Generate unique correlation ID for request tracking
     */
    generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Cleanup expired messages with enhanced logic
     */
    cleanupExpiredMessages() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [requestId, pendingMessage] of this.pendingMessages) {
            const age = now.getTime() - pendingMessage.queuedAt.getTime();
            if (age > pendingMessage.timeout) {
                this.pendingMessages.delete(requestId);
                pendingMessage.reject(new Error('Message expired'));
                cleanedCount++;
                this.emit('messageExpired', {
                    requestId,
                    correlationId: pendingMessage.correlationId,
                    age,
                    timeout: pendingMessage.timeout
                });
            }
        }
        if (cleanedCount > 0) {
            this.messageStats.timeouts += cleanedCount;
        }
        return cleanedCount;
    }
    /**
     * Set default timeout for messages
     */
    setDefaultTimeout(timeout) {
        this.defaultTimeout = timeout;
        this.emit('defaultTimeoutChanged', timeout);
    }
    /**
     * Get default timeout
     */
    getDefaultTimeout() {
        return this.defaultTimeout;
    }
}
//# sourceMappingURL=MessageHandler.js.map