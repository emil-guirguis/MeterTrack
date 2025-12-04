/**
 * Client System API Client
 *
 * Handles communication with the centralized Client System API.
 * Provides methods for authentication, batch uploads, and configuration downloads.
 */
import axios from 'axios';
export class ClientSystemApiClient {
    client;
    apiKey;
    maxRetries;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.maxRetries = config.maxRetries || 5;
        this.client = axios.create({
            baseURL: config.apiUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
            },
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                const enhancedError = new Error('Client System unreachable');
                enhancedError.code = error.code;
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        });
    }
    /**
     * Test connectivity to Client System
     */
    async testConnection() {
        try {
            const response = await this.client.get('/health', {
                timeout: 5000,
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Authenticate with Client System
     */
    async authenticate() {
        try {
            const response = await this.client.post('/sync/auth', {});
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    return {
                        success: false,
                        message: 'Invalid API key',
                    };
                }
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    throw new Error('Client System unreachable');
                }
            }
            throw error;
        }
    }
    /**
     * Upload batch of meter readings with retry logic
     */
    async uploadBatch(readings, retryCount = 0) {
        // Transform readings to API format
        const request = {
            readings: readings.map((r) => ({
                meter_id: r.meter_id,
                timestamp: r.timestamp.toISOString(),
                data_point: r.data_point,
                value: r.value,
                unit: r.unit,
            })),
        };
        try {
            const response = await this.client.post('/sync/readings/batch', request);
            return response.data;
        }
        catch (error) {
            // Handle retryable errors
            if (this.isRetryableError(error) && retryCount < this.maxRetries) {
                const delay = this.calculateBackoff(retryCount);
                await this.sleep(delay);
                return this.uploadBatch(readings, retryCount + 1);
            }
            // Handle non-retryable errors
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    return {
                        success: false,
                        recordsProcessed: 0,
                        message: error.response.data?.message || 'Invalid data format',
                    };
                }
                if (error.response?.status === 401) {
                    return {
                        success: false,
                        recordsProcessed: 0,
                        message: 'Authentication failed',
                    };
                }
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    throw new Error('Client System unreachable');
                }
            }
            throw error;
        }
    }
    /**
     * Download configuration from Client System
     */
    async downloadConfig() {
        try {
            const response = await this.client.get('/sync/config');
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Authentication failed');
                }
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    throw new Error('Client System unreachable');
                }
            }
            throw error;
        }
    }
    /**
     * Send heartbeat to Client System
     */
    async sendHeartbeat() {
        try {
            const response = await this.client.post('/sync/heartbeat', {
                timestamp: new Date().toISOString(),
            });
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    throw new Error('Client System unreachable');
                }
            }
            throw error;
        }
    }
    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        if (axios.isAxiosError(error)) {
            // Network errors are retryable
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                return false; // These should be handled as offline
            }
            // 5xx server errors are retryable
            if (error.response && error.response.status >= 500) {
                return true;
            }
            // 429 rate limit is retryable
            if (error.response?.status === 429) {
                return true;
            }
        }
        return false;
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoff(retryCount) {
        const baseDelay = 2000; // 2 seconds
        return Math.min(baseDelay * Math.pow(2, retryCount), 60000); // Max 60 seconds
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
/**
 * Create API client from environment variables
 */
export function createApiClientFromEnv() {
    const config = {
        apiUrl: process.env.CLIENT_API_URL || 'http://localhost:3001/api',
        apiKey: process.env.CLIENT_API_KEY || '',
        timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
        maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
    };
    return new ClientSystemApiClient(config);
}
//# sourceMappingURL=api-client.js.map