import ModbusRTU from 'modbus-serial';
import { EventEmitter } from 'events';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

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

export class ModbusClient extends EventEmitter {
  private client: ModbusRTU;
  private config: ModbusConfig;
  private logger: winston.Logger;
  private isConnected: boolean = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private fieldMap: Array<{
    name: string;
    source?: 'holding' | 'input';
    type: 'u16' | 'u32' | 'float32';
    address: number;
    scale?: number;
    wordOrder?: 'HI_LO' | 'LO_HI';
    floatEndian?: 'BE' | 'LE';
  }> | null = null;

  constructor(config: ModbusConfig, logger: winston.Logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.client = new ModbusRTU();
    this.setupEventHandlers();
    this.loadFieldMap();
  }

  private setupEventHandlers(): void {
    this.client.on('error', (error) => {
      this.logger.error('Modbus client error:', error);
      this.isConnected = false;
      this.emit('error', error);
      this.scheduleReconnect();
    });
  }

  private loadFieldMap(): void {
    try {
      const mapPath = process.env.MODBUS_MAP_FILE;
      if (!mapPath) return;
      const resolved = path.isAbsolute(mapPath) ? mapPath : path.join(process.cwd(), mapPath);
      if (!fs.existsSync(resolved)) {
        this.logger.warn(`Modbus map file not found at ${resolved}`);
        return;
      }
      const raw = fs.readFileSync(resolved, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.fields)) {
        this.fieldMap = parsed.fields as any;
        const count = this.fieldMap ? this.fieldMap.length : 0;
        this.logger.info(`Loaded Modbus field map with ${count} fields from ${resolved}`);
      } else {
        this.logger.warn('Modbus map file missing "fields" array');
      }
    } catch (e) {
      this.logger.error('Failed to load Modbus field map', { error: e instanceof Error ? e.message : String(e) });
      this.fieldMap = null;
    }
  }

  public async connect(): Promise<boolean> {
    try {
      await this.client.connectTCP(this.config.ip, { port: this.config.port });
      this.client.setID(this.config.slaveId);
      this.client.setTimeout(this.config.timeout);
      
      this.isConnected = true;
      this.logger.info(`Connected to Modbus device at ${this.config.ip}:${this.config.port}`);
      this.emit('connected');
      
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect to Modbus device: ${error}`);
      this.isConnected = false;
      this.emit('error', error);
      this.scheduleReconnect();
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectInterval) return;
    
    this.reconnectInterval = setInterval(async () => {
      this.logger.info('Attempting to reconnect to Modbus device...');
      await this.connect();
    }, 10000); // Retry every 10 seconds
  }

  public async readMeterData(): Promise<MeterReading | null> {
    if (!this.isConnected) {
      throw new Error('Modbus client not connected');
    }

    try {
      // Define register addresses for energy meter
      // These addresses are typical for many energy meters but may need adjustment
      const registers = {
        voltage: { address: 0, scale: 10 },      // Voltage (V)
        current: { address: 2, scale: 100 },     // Current (A)
        power: { address: 4, scale: 1 },         // Power (W)
        energy: { address: 6, count: 2 },        // Energy (Wh) - 32-bit
        frequency: { address: 8, scale: 10 },    // Frequency (Hz)
        powerFactor: { address: 10, scale: 1000 } // Power Factor
      };

      // Read voltage
      const voltageResult = await this.client.readHoldingRegisters(
        registers.voltage.address, 1
      );
      const voltage = voltageResult.data[0] / registers.voltage.scale;

      // Read current
      const currentResult = await this.client.readHoldingRegisters(
        registers.current.address, 1
      );
      const current = currentResult.data[0] / registers.current.scale;

      // Read power
      const powerResult = await this.client.readHoldingRegisters(
        registers.power.address, 1
      );
      const power = powerResult.data[0] / registers.power.scale;

      // Read energy (32-bit value)
      const energyResult = await this.client.readHoldingRegisters(
        registers.energy.address, 2
      );
      const energy = (energyResult.data[0] << 16) + energyResult.data[1];

      // Read frequency
      const frequencyResult = await this.client.readHoldingRegisters(
        registers.frequency.address, 1
      );
      const frequency = frequencyResult.data[0] / registers.frequency.scale;

      // Read power factor
      const powerFactorResult = await this.client.readHoldingRegisters(
        registers.powerFactor.address, 1
      );
      const powerFactor = powerFactorResult.data[0] / registers.powerFactor.scale;

      const reading: MeterReading = {
        timestamp: new Date(),
        voltage,
        current,
        power,
        energy,
        frequency,
        powerFactor,
        quality: 'good',
        source: 'modbus',
        deviceIP: this.config.ip,
        meterId: `${this.config.ip}_${this.config.slaveId}`
      };

      this.logger.debug('Meter reading collected:', reading);
      // If a field map is provided, read additional fields and merge
      if (this.fieldMap && this.fieldMap.length) {
        try {
          const extras = await this.readAdditionalFieldsFromMap();
          Object.assign(reading as any, extras);
          this.logger.debug('Additional mapped fields collected', { keys: Object.keys(extras) });
        } catch (e) {
          this.logger.warn('Failed to collect additional mapped fields', { error: e instanceof Error ? e.message : String(e) });
        }
      }
      this.emit('data', reading);
      
      return reading;
    } catch (error) {
      this.logger.error('Failed to read meter data:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private async readAdditionalFieldsFromMap(): Promise<Record<string, number>> {
    const out: Record<string, number> = {};
    const fields = this.fieldMap || [];
    for (const f of fields) {
      try {
        const src = f.source || 'holding';
        const count = f.type === 'u16' ? 1 : 2;
        const res = src === 'input'
          ? await this.client.readInputRegisters(f.address, count)
          : await this.client.readHoldingRegisters(f.address, count);
        let val: number;
        if (f.type === 'u16') {
          val = res.data[0];
        } else if (f.type === 'u32') {
          const hi = res.data[0];
          const lo = res.data[1];
          const first = (f.wordOrder || 'HI_LO') === 'HI_LO' ? hi : lo;
          const second = (f.wordOrder || 'HI_LO') === 'HI_LO' ? lo : hi;
          val = (first << 16) + second;
        } else { // float32
          const hi = res.data[0];
          const lo = res.data[1];
          const wordOrder = f.wordOrder || 'HI_LO';
          const be = (f.floatEndian || 'BE') === 'BE';
          const w1 = wordOrder === 'HI_LO' ? hi : lo;
          const w2 = wordOrder === 'HI_LO' ? lo : hi;
          const buf = Buffer.alloc(4);
          if (be) {
            buf.writeUInt16BE(w1, 0); buf.writeUInt16BE(w2, 2);
            val = buf.readFloatBE(0);
          } else {
            buf.writeUInt16LE(w1, 0); buf.writeUInt16LE(w2, 2);
            val = buf.readFloatLE(0);
          }
        }
        const scale = f.scale ?? 1;
        out[f.name] = val / scale;
      } catch (e) {
        this.logger.warn('Field read failed', { field: f.name, address: f.address, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return out;
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Try to read a single register to test connection
      await this.client.readHoldingRegisters(0, 1);
      return true;
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      return false;
    }
  }

  public disconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.client) {
      this.client.close();
      this.isConnected = false;
      this.logger.info('Disconnected from Modbus device');
      this.emit('disconnected');
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}