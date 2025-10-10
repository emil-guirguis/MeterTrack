import { Pool } from 'pg';
export class PostgresDatabaseManager {
    pool;
    config;
    logger;
    isConnected = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            max: config.max || 20,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
        });
        // Handle pool events
        this.pool.on('connect', (client) => {
            this.logger.debug('New client connected to PostgreSQL');
        });
        this.pool.on('error', (err, client) => {
            this.logger.error('Unexpected error on idle client', err);
        });
    }
    async connect() {
        try {
            // Test the connection
            const client = await this.pool.connect();
            client.release();
            this.isConnected = true;
            this.logger.info(`Connected to PostgreSQL: ${this.config.database}`);
            // Create table if it doesn't exist
            await this.createTable();
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to connect to PostgreSQL: ${error}`);
            this.isConnected = false;
            return false;
        }
    }
    async createTable() {
        const client = await this.pool.connect();
        try {
            const createTableQuery = `
        CREATE TABLE IF NOT EXISTS meter_readings_realtime (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          meterid VARCHAR(100) NOT NULL,
          deviceip VARCHAR(45),
          slaveid INTEGER,
          source VARCHAR(100) DEFAULT 'modbus',
          quality VARCHAR(20) DEFAULT 'good' CHECK (quality IN ('good','estimated','questionable')),

          -- Core electrical measurements
          voltage DECIMAL(18,3),
          current DECIMAL(18,3),
          power DECIMAL(18,3),
          energy DECIMAL(18,3),
          frequency DECIMAL(7,3),
          powerfactor DECIMAL(5,4) CHECK (powerfactor >= 0 AND powerfactor <= 1),
          temperature DECIMAL(7,2),

          -- Legacy/calculated fields
          kwh DECIMAL(18,3),
          kw DECIMAL(18,3),
          v DECIMAL(18,3),
          a DECIMAL(18,3),
          dpf DECIMAL(5,4) CHECK (dpf >= 0 AND dpf <= 1),
          dpfchannel INTEGER,
          kwpeak DECIMAL(18,3),

          -- Additional legacy fields
          kvarh DECIMAL(18,3),
          kvah DECIMAL(18,3),

          -- Per-phase measurements
          phaseavoltage DECIMAL(18,3),
          phasebvoltage DECIMAL(18,3),
          phasecvoltage DECIMAL(18,3),
          phaseacurrent DECIMAL(18,3),
          phasebcurrent DECIMAL(18,3),
          phaseccurrent DECIMAL(18,3),
          phaseapower DECIMAL(18,3),
          phasebpower DECIMAL(18,3),
          phasecpower DECIMAL(18,3),

          createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_meter_readings_realtime_meterid_timestamp
        ON meter_readings_realtime(meterid, timestamp DESC);

        CREATE INDEX IF NOT EXISTS idx_meter_readings_realtime_timestamp
        ON meter_readings_realtime(timestamp DESC);

        CREATE INDEX IF NOT EXISTS idx_meter_readings_realtime_deviceip
        ON meter_readings_realtime(deviceip);
      `;
            await client.query(createTableQuery);
            this.logger.info('Meter readings realtime table created/verified');
        }
        catch (error) {
            this.logger.error(`Failed to create table: ${error}`);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async insertMeterReading(reading) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        const client = await this.pool.connect();
        try {
            const query = `
        INSERT INTO meter_readings_realtime (
          timestamp, meterid, deviceip, slaveid, source, quality,
          voltage, current, power, energy, frequency, powerfactor, temperature,
          kwh, kw, v, a, dpf, dpfchannel, kwpeak,
          kvarh, kvah,
          phaseavoltage, phasebvoltage, phasecvoltage,
          phaseacurrent, phasebcurrent, phaseccurrent,
          phaseapower, phasebpower, phasecpower
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20,
          $21, $22,
          $23, $24, $25,
          $26, $27, $28,
          $29, $30, $31
        )
      `;
            const values = [
                reading.timestamp,
                reading.meterId,
                reading.deviceIP,
                reading.slaveId,
                reading.source || 'modbus',
                reading.quality || 'good',
                reading.voltage,
                reading.current,
                reading.power,
                reading.energy,
                reading.frequency,
                reading.powerFactor,
                reading.temperature,
                reading.kWh,
                reading.kW,
                reading.V,
                reading.A,
                reading.dPF,
                reading.dPFchannel,
                reading.kWpeak,
                reading.kVARh,
                reading.kVAh,
                reading.phaseAVoltage,
                reading.phaseBVoltage,
                reading.phaseCVoltage,
                reading.phaseACurrent,
                reading.phaseBCurrent,
                reading.phaseCCurrent,
                reading.phaseAPower,
                reading.phaseBPower,
                reading.phaseCPower
            ];
            await client.query(query, values);
            this.logger.debug(`Meter reading inserted for meter: ${reading.meterId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to insert meter reading: ${error}`);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async insertMeterReadings(readings) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        const client = await this.pool.connect();
        try {
            const values = readings.map(reading => [
                reading.timestamp,
                reading.meterId,
                reading.deviceIP,
                reading.slaveId,
                reading.source || 'modbus',
                reading.quality || 'good',
                reading.voltage,
                reading.current,
                reading.power,
                reading.energy,
                reading.frequency,
                reading.powerFactor,
                reading.temperature,
                reading.kWh,
                reading.kW,
                reading.V,
                reading.A,
                reading.dPF,
                reading.dPFchannel,
                reading.kWpeak,
                reading.kVARh,
                reading.kVAh,
                reading.phaseAVoltage,
                reading.phaseBVoltage,
                reading.phaseCVoltage,
                reading.phaseACurrent,
                reading.phaseBCurrent,
                reading.phaseCCurrent,
                reading.phaseAPower,
                reading.phaseBPower,
                reading.phaseCPower
            ]);
            // Use a batch insert approach
            let insertedCount = 0;
            for (const valueSet of values) {
                try {
                    const query = `
            INSERT INTO meter_readings_realtime (
              timestamp, meterid, deviceip, slaveid, source, quality,
              voltage, current, power, energy, frequency, powerfactor, temperature,
              kwh, kw, v, a, dpf, dpfchannel, kwpeak,
              kvarh, kvah,
              phaseavoltage, phasebvoltage, phasecvoltage,
              phaseacurrent, phasebcurrent, phaseccurrent,
              phaseapower, phasebpower, phasecpower
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19, $20,
              $21, $22,
              $23, $24, $25,
              $26, $27, $28,
              $29, $30, $31
            )
          `;
                    await client.query(query, valueSet);
                    insertedCount++;
                }
                catch (error) {
                    this.logger.error(`Failed to insert reading for meter ${valueSet[1]}: ${error}`);
                }
            }
            this.logger.debug(`${insertedCount} meter readings inserted`);
            return insertedCount;
        }
        catch (error) {
            this.logger.error(`Failed to insert meter readings: ${error}`);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getLatestReading(meterId) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT * FROM meter_readings_realtime
        WHERE meterid = $1
        ORDER BY timestamp DESC
        LIMIT 1
      `;
            const result = await client.query(query, [meterId]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                timestamp: row.timestamp,
                voltage: row.voltage,
                current: row.current,
                power: row.power,
                energy: row.energy,
                frequency: row.frequency,
                powerFactor: row.powerfactor,
                temperature: row.temperature,
                meterId: row.meterid,
                deviceIP: row.deviceip,
                slaveId: row.slaveid,
                quality: row.quality,
                source: row.source,
                kWh: row.kwh,
                kW: row.kw,
                V: row.v,
                A: row.a,
                dPF: row.dpf,
                dPFchannel: row.dpfchannel,
                kWpeak: row.kwpeak,
                kVARh: row.kvarh,
                kVAh: row.kvah,
                phaseAVoltage: row.phaseavoltage,
                phaseBVoltage: row.phasebvoltage,
                phaseCVoltage: row.phasecvoltage,
                phaseACurrent: row.phaseacurrent,
                phaseBCurrent: row.phasebcurrent,
                phaseCCurrent: row.phaseccurrent,
                phaseAPower: row.phaseapower,
                phaseBPower: row.phasebpower,
                phaseCPower: row.phasecpower
            };
        }
        catch (error) {
            this.logger.error(`Failed to get latest reading: ${error}`);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getReadingsByTimeRange(meterId, startTime, endTime, limit = 1000) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT * FROM meter_readings_realtime
        WHERE meterid = $1 AND timestamp >= $2 AND timestamp <= $3
        ORDER BY timestamp DESC
        LIMIT $4
      `;
            const result = await client.query(query, [meterId, startTime, endTime, limit]);
            return result.rows.map((row) => ({
                timestamp: row.timestamp,
                voltage: row.voltage,
                current: row.current,
                power: row.power,
                energy: row.energy,
                frequency: row.frequency,
                powerFactor: row.powerfactor,
                temperature: row.temperature,
                meterId: row.meterid,
                deviceIP: row.deviceip,
                slaveId: row.slaveid,
                quality: row.quality,
                source: row.source,
                kWh: row.kwh,
                kW: row.kw,
                V: row.v,
                A: row.a,
                dPF: row.dpf,
                dPFchannel: row.dpfchannel,
                kWpeak: row.kwpeak,
                kVARh: row.kvarh,
                kVAh: row.kvah,
                phaseAVoltage: row.phaseavoltage,
                phaseBVoltage: row.phasebvoltage,
                phaseCVoltage: row.phasecvoltage,
                phaseACurrent: row.phaseacurrent,
                phaseBCurrent: row.phasebcurrent,
                phaseCCurrent: row.phaseccurrent,
                phaseAPower: row.phaseapower,
                phaseBPower: row.phasebpower,
                phaseCPower: row.phasecpower
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get readings by time range: ${error}`);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getStatistics(meterId, hours = 24) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        const client = await this.pool.connect();
        try {
            const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            const query = `
        SELECT
          COUNT(*) as count,
          AVG(voltage) as avgVoltage,
          AVG(current) as avgCurrent,
          AVG(power) as avgPower,
          MAX(energy) as totalEnergy,
          AVG(frequency) as avgFrequency,
          AVG(powerfactor) as avgPowerFactor,
          MIN(timestamp) as minTimestamp,
          MAX(timestamp) as maxTimestamp
        FROM meter_readings_realtime
        WHERE meterid = $1 AND timestamp >= $2
      `;
            const result = await client.query(query, [meterId, startTime]);
            return result.rows[0] || null;
        }
        catch (error) {
            this.logger.error(`Failed to get statistics: ${error}`);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async disconnect() {
        try {
            await this.pool.end();
            this.isConnected = false;
            this.logger.info('Disconnected from PostgreSQL');
        }
        catch (error) {
            this.logger.error(`Error disconnecting from PostgreSQL: ${error}`);
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
    async testConnection() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            return true;
        }
        catch (error) {
            this.logger.error(`Database connection test failed: ${error}`);
            return false;
        }
    }
}
