import ModbusRTU from 'modbus-serial';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
export class ModbusClient extends EventEmitter {
    client;
    config;
    logger;
    isConnected = false;
    reconnectInterval = null;
    fieldMap = null;
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger;
        this.client = new ModbusRTU();
        this.setupEventHandlers();
        this.loadFieldMap();
    }
    setupEventHandlers() {
        this.client.on('error', (error) => {
            this.logger.error('Modbus client error:', error);
            this.isConnected = false;
            this.emit('error', error);
            this.scheduleReconnect();
        });
    }
    loadFieldMap() {
        try {
            const mapPath = process.env.MODBUS_MAP_FILE;
            if (!mapPath)
                return;
            const resolved = path.isAbsolute(mapPath) ? mapPath : path.join(process.cwd(), mapPath);
            if (!fs.existsSync(resolved)) {
                this.logger.warn(`Modbus map file not found at ${resolved}`);
                return;
            }
            const raw = fs.readFileSync(resolved, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.fields)) {
                this.fieldMap = parsed.fields;
                const count = this.fieldMap ? this.fieldMap.length : 0;
                this.logger.info(`Loaded Modbus field map with ${count} fields from ${resolved}`);
            }
            else {
                this.logger.warn('Modbus map file missing "fields" array');
            }
        }
        catch (e) {
            this.logger.error('Failed to load Modbus field map', { error: e instanceof Error ? e.message : String(e) });
            this.fieldMap = null;
        }
    }
    async connect() {
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
        }
        catch (error) {
            this.logger.error(`Failed to connect to Modbus device: ${error}`);
            this.isConnected = false;
            this.emit('error', error);
            this.scheduleReconnect();
            return false;
        }
    }
    scheduleReconnect() {
        if (this.reconnectInterval)
            return;
        this.reconnectInterval = setInterval(async () => {
            this.logger.info('Attempting to reconnect to Modbus device...');
            await this.connect();
        }, 10000); // Retry every 10 seconds
    }
    async readMeterData() {
        if (!this.isConnected) {
            throw new Error('Modbus client not connected');
        }
        try {
            // REAL METER REGISTER MAPPING - Based on actual device at 10.10.10.11:502
            // Slave ID: 1
            // Verified register addresses from live meter data
            const registers = {
                voltage: { address: 5, scale: 200 }, // Voltage (V) - Register 5, scale by 200
                current: { address: 6, scale: 100 }, // Current (A) - Register 6, scale by 100  
                power: { address: 7, scale: 1 }, // Power (W) - Register 7, direct watts
                energy: { address: 8, count: 2 }, // Energy estimate from power
                frequency: { address: 0, scale: 10 }, // Frequency estimate (Register 0 = 54 = 5.4?)
                powerFactor: { address: 9, scale: 1000 } // Power Factor estimate
            };
            // Read all data in one call for efficiency (registers 0-19)
            const allData = await this.client.readHoldingRegisters(0, 20);
            // Extract real values using discovered mapping
            const voltage = allData.data[5] / registers.voltage.scale; // Register 5 / 200
            const current = allData.data[6] / registers.current.scale; // Register 6 / 100
            const power = allData.data[7] / registers.power.scale; // Register 7 direct
            // Calculate derived values
            const apparentPower = voltage * current;
            const powerFactor = apparentPower > 0 ? Math.min(power / apparentPower, 1.0) : 0;
            // Estimate frequency (Register 0 might be frequency * 10)
            const frequency = allData.data[0] > 50 && allData.data[0] < 70 ?
                allData.data[0] / 10 : 60; // Default to 60Hz if unclear
            // Estimate energy accumulation (we don't have a real energy register yet)
            const energy = power * 0.001; // Convert to kWh estimate
            const reading = {
                timestamp: new Date(),
                voltage,
                current,
                power,
                energy,
                frequency,
                powerFactor,
                quality: 'good',
                source: 'modbus-real',
                deviceIP: this.config.ip,
                meterId: `${this.config.ip}:${this.config.port}:${this.config.slaveId}`,
                slaveId: this.config.slaveId
            };
            this.logger.info('Real meter data read successfully', {
                voltage: `${voltage.toFixed(2)}V`,
                current: `${current.toFixed(2)}A`,
                power: `${power}W`,
                powerFactor: powerFactor.toFixed(3),
                rawRegisters: allData.data.slice(0, 10)
            });
            // If a field map is provided, read additional fields and merge
            if (this.fieldMap && this.fieldMap.length) {
                try {
                    const extras = await this.readAdditionalFieldsFromMap();
                    Object.assign(reading, extras);
                    this.logger.debug('Additional mapped fields collected', { keys: Object.keys(extras) });
                }
                catch (e) {
                    this.logger.warn('Failed to collect additional mapped fields', { error: e instanceof Error ? e.message : String(e) });
                }
            }
            this.emit('data', reading);
            return reading;
        }
        catch (error) {
            this.logger.error('Failed to read meter data:', error);
            this.emit('error', error);
            throw error;
        }
    }
    async readAdditionalFieldsFromMap() {
        const out = {};
        const fields = this.fieldMap || [];
        for (const f of fields) {
            try {
                const src = f.source || 'holding';
                const count = f.type === 'u16' ? 1 : 2;
                const res = src === 'input'
                    ? await this.client.readInputRegisters(f.address, count)
                    : await this.client.readHoldingRegisters(f.address, count);
                let val;
                if (f.type === 'u16') {
                    val = res.data[0];
                }
                else if (f.type === 'u32') {
                    const hi = res.data[0];
                    const lo = res.data[1];
                    const first = (f.wordOrder || 'HI_LO') === 'HI_LO' ? hi : lo;
                    const second = (f.wordOrder || 'HI_LO') === 'HI_LO' ? lo : hi;
                    val = (first << 16) + second;
                }
                else { // float32
                    const hi = res.data[0];
                    const lo = res.data[1];
                    const wordOrder = f.wordOrder || 'HI_LO';
                    const be = (f.floatEndian || 'BE') === 'BE';
                    const w1 = wordOrder === 'HI_LO' ? hi : lo;
                    const w2 = wordOrder === 'HI_LO' ? lo : hi;
                    const buf = Buffer.alloc(4);
                    if (be) {
                        buf.writeUInt16BE(w1, 0);
                        buf.writeUInt16BE(w2, 2);
                        val = buf.readFloatBE(0);
                    }
                    else {
                        buf.writeUInt16LE(w1, 0);
                        buf.writeUInt16LE(w2, 2);
                        val = buf.readFloatLE(0);
                    }
                }
                const scale = f.scale ?? 1;
                out[f.name] = val / scale;
            }
            catch (e) {
                this.logger.warn('Field read failed', { field: f.name, address: f.address, error: e instanceof Error ? e.message : String(e) });
            }
        }
        return out;
    }
    async testConnection() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            // Try to read a single register to test connection
            await this.client.readHoldingRegisters(0, 1);
            return true;
        }
        catch (error) {
            this.logger.error('Connection test failed:', error);
            return false;
        }
    }
    disconnect() {
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
    getConnectionStatus() {
        return this.isConnected;
    }
}
