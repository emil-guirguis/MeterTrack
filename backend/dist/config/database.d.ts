export = db;
declare const db: PostgresDB;
declare class PostgresDB {
    pool: Pool | null;
    isConnected: boolean;
    /**
     * Initialize PostgreSQL connection pool
     */
    connect(): Promise<Pool>;
    /**
     * Get a client from the connection pool
     */
    getClient(): Promise<import("pg").PoolClient>;
    /**
     * Execute a query with parameters
     */
    query(text: any, params?: any[]): Promise<import("pg").QueryArrayResult<any[]>>;
    /**
     * Execute a transaction
     */
    transaction(callback: any): Promise<any>;
    /**
     * Close all connections
     */
    disconnect(): Promise<void>;
    /**
     * Get connection status
     */
    getStatus(): {
        connected: boolean;
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
    /**
     * Health check for the database
     */
    healthCheck(): Promise<{
        status: string;
        connected: boolean;
        timestamp: string;
        response_time: string;
        error?: undefined;
    } | {
        status: string;
        connected: boolean;
        error: any;
        timestamp: string;
        response_time?: undefined;
    }>;
}
import { Pool } from "pg";
//# sourceMappingURL=database.d.ts.map