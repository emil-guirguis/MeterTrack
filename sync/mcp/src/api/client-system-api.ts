/**
 * Client System API Client
 * 
 * Handles communication with the centralized Client System API.
 * Provides methods for authentication, batch uploads, and configuration downloads.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  MeterReadingEntity,
  ApiClientConfig,
  AuthResponse,
  BatchUploadRequest,
  BatchUploadResponse,
  ConfigDownloadResponse,
} from '../types/entities.js';

export class ClientSystemApiClient {
  private client: AxiosInstance;
  private apiKey: string;
  private maxRetries: number;

  constructor(config: ApiClientConfig) {
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
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          const enhancedError = new Error('Client System unreachable');
          (enhancedError as any).code = error.code;
          (enhancedError as any).originalError = error;
          throw enhancedError;
        }
        throw error;
      }
    );
  }

  /**
   * Set or update the API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client.defaults.headers['X-API-Key'] = apiKey;
    console.log(`🔑 [ClientSystemApiClient] API key updated: ${apiKey.substring(0, 8)}...`);
  }

  /**
   * Test connectivity to Client System
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.client.defaults.baseURL}/health`;
      console.log(`🔍 [ClientSystemApiClient] Testing connection to: ${url}`);
      console.log(`🔍 [ClientSystemApiClient] Full URL: ${url}`);
      console.log(`🔍 [ClientSystemApiClient] API Key: ${this.apiKey ? '***' : 'NOT SET'}`);
      
      // Use the health endpoint which is designed for connectivity testing
      const response = await this.client.get('/health', {
        timeout: 5000,
      });
      console.log(`✅ [ClientSystemApiClient] Connection successful - Status: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      const axiosError = error as any;
      console.error(`❌ [ClientSystemApiClient] Connection failed:`, {
        message: error instanceof Error ? error.message : String(error),
        code: axiosError?.code,
        status: axiosError?.response?.status,
        statusText: axiosError?.response?.statusText,
        baseURL: this.client.defaults.baseURL,
        endpoint: '/health',
        fullURL: `${this.client.defaults.baseURL}/health`,
        responseData: axiosError?.response?.data,
      });
      return false;
    }
  }

  /**
   * Authenticate with Client System
   */
  async authenticate(): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/sync/auth', {});
      return response.data;
    } catch (error) {
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
  async uploadBatch(
    readings: MeterReadingEntity[],
    retryCount: number = 0
  ): Promise<BatchUploadResponse> {
    // Transform readings to API format
    const request: BatchUploadRequest = {
      readings: readings.map((r) => ({
        meter_id: r.meter_id,
        timestamp: r.timestamp.toISOString(),
        data_point: r.data_point,
        value: r.value,
        unit: r.unit,
      })),
    };

    try {
      const response = await this.client.post<BatchUploadResponse>(
        '/sync/readings/batch',
        request
      );
      return response.data;
    } catch (error) {
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
  async downloadConfig(): Promise<ConfigDownloadResponse> {
    try {
      const response = await this.client.get<ConfigDownloadResponse>('/sync/config');
      return response.data;
    } catch (error) {
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
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
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
  private calculateBackoff(retryCount: number): number {
    const baseDelay = 2000; // 2 seconds
    return Math.min(baseDelay * Math.pow(2, retryCount), 60000); // Max 60 seconds
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create API client from environment variables
 */
export function createApiClientFromEnv(): ClientSystemApiClient {
  const config: ApiClientConfig = {
    apiUrl: process.env.CLIENT_API_URL || 'http://localhost:3001/api',
    apiKey: process.env.CLIENT_API_KEY || '',
    timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
  };

  return new ClientSystemApiClient(config);
}
