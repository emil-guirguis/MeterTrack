/**
 * Client System API Client
 *
 * Handles communication with the centralized Client System API.
 * Provides methods for authentication, batch uploads, and configuration downloads.
 */
import { MeterReadingEntity, ApiClientConfig, AuthResponse, BatchUploadResponse, ConfigDownloadResponse, HeartbeatResponse } from '../types/entities.js';
export declare class ClientSystemApiClient {
    private client;
    private apiKey;
    private maxRetries;
    constructor(config: ApiClientConfig);
    /**
     * Test connectivity to Client System
     */
    testConnection(): Promise<boolean>;
    /**
     * Authenticate with Client System
     */
    authenticate(): Promise<AuthResponse>;
    /**
     * Upload batch of meter readings with retry logic
     */
    uploadBatch(readings: MeterReadingEntity[], retryCount?: number): Promise<BatchUploadResponse>;
    /**
     * Download configuration from Client System
     */
    downloadConfig(): Promise<ConfigDownloadResponse>;
    /**
     * Send heartbeat to Client System
     */
    sendHeartbeat(): Promise<HeartbeatResponse>;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoff;
    /**
     * Sleep utility
     */
    private sleep;
}
/**
 * Create API client from environment variables
 */
export declare function createApiClientFromEnv(): ClientSystemApiClient;
