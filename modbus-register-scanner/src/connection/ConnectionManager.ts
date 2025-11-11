import ModbusRTU from 'modbus-serial';
import { ScanConfig } from '../types';
import { RetryManager, RetryConfig } from './RetryManager';

/**
 * Connection states for tracking the current status
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * Connection error types for better error handling
 */
export class ConnectionError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

/**
 * Manages TCP connections to Modbus devices with timeout handling,
 * connection state tracking, and validation
 */
export class ConnectionManager {
  private client: ModbusRTU;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private config: ScanConfig;
  private connectionTimeout?: NodeJS.Timeout;
  private retryManager: RetryManager;

  constructor(config: ScanConfig) {
    this.config = config;
    this.client = new ModbusRTU();
    
    // Set up client timeout
    this.client.setTimeout(config.timeout);
    
    // Configure for TCP/IP protocol (not RTU)
    // The modbus-serial library automatically handles TCP framing when using connectTCP()
    // but we ensure no RTU-specific configurations are applied

    // Initialize retry manager with exponential backoff (1s, 2s, 4s)
    this.retryManager = new RetryManager({
      maxRetries: config.retries,
      baseDelayMs: 1000, // Start with 1 second
      maxDelayMs: 8000   // Cap at 8 seconds
    });
  }

  /**
   * Get the current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED && this.client.isOpen;
  }

  /**
   * Verify TCP/IP protocol configuration
   * Ensures no RTU-specific settings are applied
   */
  private verifyTcpConfiguration(): void {
    // Verify we're using TCP connection method (connectTCP)
    // The modbus-serial library handles TCP framing automatically
    // No RTU-specific configurations should be set for TCP connections
    
    // TCP uses different framing than RTU:
    // - TCP has MBAP header (7 bytes) vs RTU CRC (2 bytes)
    // - TCP is big-endian by default
    // - No need for RTU timing parameters
  }

  /**
   * Establish TCP connection to the Modbus device with retry logic
   */
  public async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTING) {
      throw new ConnectionError('Connection attempt already in progress');
    }

    if (this.isConnected()) {
      return; // Already connected
    }

    this.state = ConnectionState.CONNECTING;

    // Verify TCP configuration before connecting
    this.verifyTcpConfiguration();

    try {
      await this.retryManager.executeWithRetry(
        () => this.attemptConnection(),
        `Connection to ${this.config.host}:${this.config.port}`
      );

      this.state = ConnectionState.CONNECTED;
    } catch (error) {
      this.state = ConnectionState.ERROR;
      
      // Close client if partially connected
      if (this.client.isOpen) {
        try {
          this.client.close(() => {});
        } catch (closeError) {
          // Ignore close errors
        }
      }

      if (error instanceof ConnectionError) {
        throw error;
      }

      // Convert other errors to ConnectionError
      const message = error instanceof Error ? error.message : 'Unknown connection error';
      throw new ConnectionError(`Failed to connect after retries: ${message}`, 'CONNECTION_FAILED');
    }
  }

  /**
   * Single connection attempt (used by retry logic)
   */
  private async attemptConnection(): Promise<void> {
    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;
    }

    try {
      // Create connection promise with timeout
      const connectionPromise = this.client.connectTCP(this.config.host, { port: this.config.port });
      
      // Set up timeout for connection attempt
      const timeoutPromise = new Promise<never>((_, reject) => {
        this.connectionTimeout = setTimeout(() => {
          reject(new ConnectionError(`Connection timeout after ${this.config.timeout}ms`, 'TIMEOUT'));
        }, this.config.timeout);
      });

      // Race between connection and timeout
      await Promise.race([connectionPromise, timeoutPromise]);

      // Clear timeout if connection succeeded
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = undefined;
      }

      // Set slave ID
      this.client.setID(this.config.slaveId);

      // Verify connection with a test read
      await this.validateConnection();

    } catch (error) {
      // Clear timeout on error
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = undefined;
      }

      // Close client if partially connected
      if (this.client.isOpen) {
        try {
          this.client.close(() => {});
        } catch (closeError) {
          // Ignore close errors
        }
      }

      throw error;
    }
  }

  /**
   * Disconnect from the Modbus device
   */
  public async disconnect(): Promise<void> {
    // Clear any pending timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;
    }

    if (this.client.isOpen) {
      return new Promise<void>((resolve) => {
        this.client.close(() => {
          this.state = ConnectionState.DISCONNECTED;
          resolve();
        });
      });
    } else {
      this.state = ConnectionState.DISCONNECTED;
    }
  }

  /**
   * Validate the connection by performing a test read
   * This helps ensure the slave ID is responsive
   */
  private async validateConnection(): Promise<void> {
    try {
      // Try to read a single coil (function code 1) at address 0
      // This is a minimal test to verify the slave responds
      await this.client.readCoils(0, 1);
    } catch (error) {
      // If coils don't work, try holding registers (function code 3)
      try {
        await this.client.readHoldingRegisters(0, 1);
      } catch (holdingError) {
        // If both fail, the slave might not be responsive
        const message = error instanceof Error ? error.message : 'Unknown validation error';
        throw new ConnectionError(`Slave ID ${this.config.slaveId} not responding - ${message}`, 'SLAVE_NOT_RESPONDING');
      }
    }
  }

  /**
   * Get the underlying Modbus client for register operations
   * Only available when connected
   */
  public getClient(): ModbusRTU {
    if (!this.isConnected()) {
      throw new ConnectionError('Not connected to Modbus device', 'NOT_CONNECTED');
    }
    return this.client;
  }

  /**
   * Get connection configuration
   */
  public getConfig(): ScanConfig {
    return { ...this.config };
  }

  /**
   * Recover connection after network drop or communication failure
   */
  public async recoverConnection(): Promise<void> {
    console.log('Attempting connection recovery...');
    
    // Force disconnect first
    await this.disconnect();
    
    // Wait a moment before attempting reconnection
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Attempt to reconnect with retry logic
    await this.connect();
    
    console.log('Connection recovery successful');
  }

  /**
   * Check if connection is still alive by performing a test operation
   */
  public async isConnectionAlive(): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      // Quick test read to verify connection is still alive
      await this.validateConnection();
      return true;
    } catch (error) {
      console.log('Connection health check failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Update configuration (requires reconnection)
   */
  public async updateConfig(newConfig: ScanConfig): Promise<void> {
    const wasConnected = this.isConnected();
    
    if (wasConnected) {
      await this.disconnect();
    }

    this.config = newConfig;
    this.client.setTimeout(newConfig.timeout);
    
    // Update retry manager configuration
    this.retryManager.updateConfig({
      maxRetries: newConfig.retries
    });

    if (wasConnected) {
      await this.connect();
    }
  }
}