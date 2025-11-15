/**
 * Client System API Client
 *
 * Handles communication with the centralized Client System API.
 * Provides methods for authentication, batch uploads, and configuration downloads.
 */
import { MeterReading } from '../database/postgres.js';
export interface ApiClientConfig {
    apiUrl: string;
    apiKey: string;
    timeout?: number;
    maxRetries?: number;
}
export interface AuthResponse {
    success: boolean;
    siteId?: string;
    message?: string;
}
export interface BatchUploadRequest {
    readings: Array<{
        meter_external_id: string;
        timestamp: string;
        data_point: string;
        value: number;
        unit?: string;
    }>;
}
export interface BatchUploadResponse {
    success: boolean;
    recordsProcessed: number;
    message?: string;
}
export interface ConfigDownloadResponse {
    meters: Array<{
        external_id: string;
        name: string;
        bacnet_device_id?: number;
        bacnet_ip?: string;
        config?: any;
    }>;
}
export interface HeartbeatResponse {
    success: boolean;
    timestamp: string;
}
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
    uploadBatch(readings: MeterReading[], retryCount?: number): Promise<BatchUploadResponse>;
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
