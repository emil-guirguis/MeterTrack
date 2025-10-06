import { EventEmitter } from 'events';
import winston from 'winston';
export interface ModbusConfig {
    ip: string;
    port: number;
    slaveId: number;
    timeout: number;
}
export interface MeterReading {
    timestamp: Date;
    voltage: number;
    current: number;
    power: number;
    energy: number;
    frequency: number;
    powerFactor: number;
    quality: 'good' | 'estimated' | 'questionable';
    source: string;
    deviceIP: string;
    meterId: string;
}
export declare class ModbusClient extends EventEmitter {
    private client;
    private config;
    private logger;
    private isConnected;
    private reconnectInterval;
    private fieldMap;
    constructor(config: ModbusConfig, logger: winston.Logger);
    private setupEventHandlers;
    private loadFieldMap;
    connect(): Promise<boolean>;
    private scheduleReconnect;
    readMeterData(): Promise<MeterReading | null>;
    private readAdditionalFieldsFromMap;
    testConnection(): Promise<boolean>;
    disconnect(): void;
    getConnectionStatus(): boolean;
}
