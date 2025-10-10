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
    temperature?: number;
    quality: 'good' | 'estimated' | 'questionable';
    source: string;
    deviceIP: string;
    meterId: string;
    slaveId: number;
    kWh?: number;
    kW?: number;
    V?: number;
    A?: number;
    dPF?: number;
    dPFchannel?: number;
    kWpeak?: number;
    kVARh?: number;
    kVAh?: number;
    phaseAVoltage?: number;
    phaseBVoltage?: number;
    phaseCVoltage?: number;
    phaseACurrent?: number;
    phaseBCurrent?: number;
    phaseCCurrent?: number;
    phaseAPower?: number;
    phaseBPower?: number;
    phaseCPower?: number;
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
