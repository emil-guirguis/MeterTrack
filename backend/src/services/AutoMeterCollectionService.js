/**
 * Automated Meter Collection Service
 * Automatically collects meter data at regular intervals and saves to database
 */

const db = require('../config/database');
const MeterReading = require('../models/MeterReading');
const Meter = require('../models/Meter');

class AutoMeterCollectionService {
    constructor() {
    // emilmosbus
    //     this.isCollecting = false;
    //     this.collectionInterval = null;
    //     this.config = null;
    //     this.lastCollectionTime = null;
    //     this.collectionStats = {
    //         totalAttempts: 0,
    //         successfulReads: 0,
    //         failedReads: 0,
    //         lastError: null
    //     };
        
    //     // Threading system reference (required for threaded collection)
    //     this.threadingService = null;
    // }

    // /**
    //  * Initialize auto meter collection service (threaded mode only)
    //  */
    // async initialize(config = null, threadingService = null) {
    //     try {
    //         this.config = config || this.getDefaultConfig();
    //         this.threadingService = threadingService;
            
    //         if (!this.threadingService) {
    //             throw new Error('Threading service is required for auto meter collection');
    //         }
            
    //         console.log('✅ Auto meter collection service initialized successfully (threaded mode)');
    //         console.log(`📊 Collection interval: ${this.config.collection.interval}ms (${this.config.collection.interval / 1000}s)`);
            
    //         return { success: true };
    //     } catch (error) {
    //         console.error('❌ Failed to initialize auto meter collection service:', error.message);
    //         return { success: false, error: error.message };
    //     }
    // }

    // /**
    //  * Get default configuration
    //  */
    // getDefaultConfig() {
    //     return {
    //         collection: {
    //             enabled: true, // Always enabled
    //             interval: 30000, // Fixed 30 seconds
    //             batchSize: parseInt(process.env.METER_COLLECTION_BATCH_SIZE) || 10,
    //             timeout: parseInt(process.env.METER_COLLECTION_TIMEOUT) || 10000, // 10 seconds per meter
    //             retryAttempts: parseInt(process.env.METER_COLLECTION_RETRIES) || 2
    //         },
    //         meters: {
    //             // Default meter configuration - can be overridden per meter
    //             defaultIP: process.env.DEFAULT_METER_IP || '10.10.10.11',
    //             defaultPort: parseInt(process.env.DEFAULT_METER_PORT) || 502,
    //             defaultSlaveId: parseInt(process.env.DEFAULT_METER_SLAVE_ID) || 1,
    //             // Register mapping for energy meters
    //             registers: {
    //                 voltage: { address: 5, count: 1, scale: 200, unit: 'V' },
    //                 current: { address: 6, count: 1, scale: 100, unit: 'A' },
    //                 power: { address: 7, count: 1, scale: 1, unit: 'W' },
    //                 energy: { address: 8, count: 1, scale: 1, unit: 'Wh' },
    //                 frequency: { address: 0, count: 1, scale: 10, unit: 'Hz' },
    //                 powerFactor: { address: 9, count: 1, scale: 1000, unit: 'pf' },
                    
    //                 // Phase measurements
    //                 phaseAVoltage: { address: 12, count: 1, scale: 10, unit: 'V' },
    //                 phaseBVoltage: { address: 14, count: 1, scale: 10, unit: 'V' },
    //                 phaseCVoltage: { address: 16, count: 1, scale: 10, unit: 'V' },
                    
    //                 phaseACurrent: { address: 18, count: 1, scale: 100, unit: 'A' },
    //                 phaseBCurrent: { address: 20, count: 1, scale: 100, unit: 'A' },
    //                 phaseCCurrent: { address: 22, count: 1, scale: 100, unit: 'A' },
                    
    //                 // Total energy measurements
    //                 totalActiveEnergyWh: { address: 40, count: 2, scale: 1, unit: 'Wh' },
    //                 totalReactiveEnergyVARh: { address: 42, count: 2, scale: 1, unit: 'VARh' },
    //                 totalApparentEnergyVAh: { address: 44, count: 2, scale: 1, unit: 'VAh' }
    //             }
    //         },
    //         database: {
    //             batchInsert: process.env.BATCH_INSERT_ENABLED !== 'false',
    //             maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE) || 100
    //         },
    //         logging: {
    //             logSuccessfulReads: process.env.LOG_SUCCESSFUL_READS === 'true',
    //             logFailedReads: process.env.LOG_FAILED_READS !== 'false',
    //             logInterval: parseInt(process.env.LOG_STATS_INTERVAL) || 300000 // 5 minutes
    //         }
    //     };
    }

    /**
     * Start automatic meter data collection
     */
    // emilmodbus startCollection() {
    //     if (this.isCollecting) {
    //         console.log('⚠️ Auto meter collection is already running');
    //         return { success: false, message: 'Collection already running' };
    //     }

    //     if (!this.config.collection.enabled) {
    //         console.log('📊 Auto meter collection is disabled in configuration');
    //         return { success: false, message: 'Collection disabled in config' };
    //     }

    //     this.isCollecting = true;
    //     this.lastCollectionTime = new Date();
        
    //     // Start the collection interval
    //     this.collectionInterval = setInterval(async () => {
    //         await this.performCollection();
    //     }, this.config.collection.interval);

    //     // Start stats logging interval
    //     if (this.config.logging.logInterval > 0) {
    //         this.statsInterval = setInterval(() => {
    //             this.logCollectionStats();
    //         }, this.config.logging.logInterval);
    //     }

    //     console.log(`🔄 Started auto meter collection (interval: ${this.config.collection.interval}ms)`);
    //     console.log(`📊 Will collect data from meters every ${this.config.collection.interval / 1000} seconds`);
        
    //     // Perform initial collection
    //     setTimeout(() => this.performCollection(), 5000); // Start after 5 seconds
        
    //     return { success: true, message: 'Collection started successfully' };
    // }

    /**
     * Stop automatic meter data collection
     */
    stopCollection() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        
        this.isCollecting = false;
        console.log('🔄 Stopped auto meter collection');
        
        return { success: true, message: 'Collection stopped successfully' };
    }

    /**
     * Perform meter data collection
     */
    // emilmodbus async performCollection() {
    //     const startTime = Date.now();
    //     console.log('🔄 Starting meter data collection cycle...');
        
    //     try {
    //         // Get all active meters that should be collected
    //         const meters = await this.getActiveMeters();
            
    //         if (meters.length === 0) {
    //             console.log('📊 No active meters found for collection');
    //             return;
    //         }

    //         console.log(`📊 Found ${meters.length} active meters for collection`);
            
    //         let successCount = 0;
    //         let failureCount = 0;
    //         const readings = [];
            
    //         // Process meters in batches to avoid overwhelming the system
    //         const batchSize = this.config.collection.batchSize;
            
    //         for (let i = 0; i < meters.length; i += batchSize) {
    //             const batch = meters.slice(i, i + batchSize);
                
    //             // Process batch concurrently but with timeout
    //             const batchPromises = batch.map(meter => 
    //                 this.collectMeterData(meter).catch(error => {
    //                     console.error(`❌ Failed to collect data from meter ${meter.meterid}:`, error.message);
    //                     return null;
    //                 })
    //             );
                
    //             const batchResults = await Promise.all(batchPromises);
                
    //             // Process results
    //             for (const result of batchResults) {
    //                 if (result && result.success) {
    //                     readings.push(result.reading);
    //                     successCount++;
                        
    //                     if (this.config.logging.logSuccessfulReads) {
    //                         console.log(`✅ Collected data from meter ${result.reading.meterid}`);
    //                     }
    //                 } else {
    //                     failureCount++;
    //                 }
    //             }
                
    //             // Small delay between batches to prevent overwhelming the network
    //             if (i + batchSize < meters.length) {
    //                 await this.delay(500);
    //             }
    //         }
            
    //         // Save all readings to database
    //         if (readings.length > 0) {
    //             await this.saveReadings(readings);
    //         }
            
    //         // Update statistics
    //         this.collectionStats.totalAttempts += meters.length;
    //         this.collectionStats.successfulReads += successCount;
    //         this.collectionStats.failedReads += failureCount;
    //         this.lastCollectionTime = new Date();
            
    //         const duration = Date.now() - startTime;
    //         console.log(`🔄 Collection cycle completed: ${successCount}/${meters.length} successful (${duration}ms)`);
            
    //     } catch (error) {
    //         console.error('❌ Error during meter collection cycle:', error.message);
    //         this.collectionStats.lastError = error.message;
    //     }
    // }

    /**
     * Collect data from a single meter using threaded MCP system
     */
    // emilmodbus async collectMeterData(meter) {
    //     try {
    //         if (!this.threadingService) {
    //             throw new Error('Threading service not available');
    //         }

    //         // Get meter connection details
    //         const meterConfig = this.getMeterConfig(meter);
            
    //         console.log(`📊 Collecting data from meter ${meter.meterid} at ${meterConfig.ip}:${meterConfig.port}`);
            
    //         // Send message to worker thread to collect meter data
    //         const message = {
    //             type: 'collectMeterData',
    //             payload: {
    //                 meter: {
    //                     meterid: meter.meterid,
    //                     name: meter.name,
    //                     type: meter.type
    //                 },
    //                 config: meterConfig,
    //                 registers: this.config.meters.registers
    //             },
    //             priority: 'normal',
    //             timeout: this.config.collection.timeout
    //         };
            
    //         const result = await this.threadingService.sendMessage(message);
            
    //         if (!result.success) {
    //             throw new Error(result.error || 'Failed to collect meter data via threading system');
    //         }
            
    //         // Display collected data in console
    //         console.log(`📈 Data collected from meter ${meter.meterid}:`, JSON.stringify(result.data, null, 2));
            
    //         // Create meter reading record from threaded result
    //         const reading = await this.createMeterReading(meter, result.data, meterConfig);
            
    //         // Display the reading that will be saved
    //         console.log(`💾 Meter reading prepared for ${meter.meterid}:`, {
    //             meterid: reading.meterid,
    //             reading_value: reading.reading_value,
    //             voltage: reading.voltage,
    //             current: reading.current,
    //             power: reading.power,
    //             energy: reading.energy,
    //             frequency: reading.frequency,
    //             power_factor: reading.power_factor,
    //             timestamp: reading.timestamp
    //         });
            
    //         return {
    //             success: true,
    //             reading,
    //             meter: meter.meterid
    //         };
            
    //     } catch (error) {
    //         if (this.config.logging.logFailedReads) {
    //             console.error(`❌ Failed to collect data from meter ${meter.meterid}:`, error.message);
    //         }
            
    //         return {
    //             success: false,
    //             error: error.message,
    //             meter: meter.meterid
    //         };
    //     }
    // }

    /**
     * Get meter configuration (IP, port, etc.)
     * Uses default values since database doesn't have Modbus connection details
     */
    getMeterConfig(meter) {
        // Use default configuration for all meters
        // In the future, this could be enhanced to support per-meter configuration
        
        return {
            ip: this.config.meters.defaultIP,
            port: this.config.meters.defaultPort,
            slaveId: this.config.meters.defaultSlaveId
        };
    }

    /**
     * Create a meter reading record from collected data
     */
    // emilmodbus async createMeterReading(meter, data, meterConfig) {
    //     const timestamp = new Date();
        
    //     // Extract key values from the collected data
    //     const voltage = data.voltage || data.phaseAVoltage || 0;
    //     const current = data.current || data.phaseACurrent || 0;
    //     const power = data.power || 0;
    //     const energy = data.energy || data.totalActiveEnergyWh || 0;
    //     const frequency = data.frequency || 0;
    //     const powerFactor = data.powerFactor || 0;
        
    //     // Create reading record with all available data (matching database schema)
    //     const reading = {
    //         meterid: meter.meterid,
    //         timestamp: timestamp, // Database uses 'timestamp' not 'reading_date'
    //         reading_value: energy, // Primary reading value for logging
    //         unit_of_measurement: 'Wh',
    //         data_quality: 'good',
    //         source: 'modbus_auto_collection',
    //         quality: 'good', // Database has both 'data_quality' and 'quality'
    //         device_ip: meterConfig.ip,
    //         deviceip: meterConfig.ip, // Database has both 'device_ip' and 'deviceip'
    //         port: meterConfig.port,
    //         slave_id: meterConfig.slaveId,
    //         slaveid: meterConfig.slaveId, // Database has both 'slave_id' and 'slaveid'
            
    //         // Store all collected values
    //         voltage: voltage,
    //         current: current,
    //         power: power,
    //         energy: energy,
    //         frequency: frequency,
    //         power_factor: powerFactor,
    //         powerfactor: powerFactor, // Database has both versions
            
    //         // Phase measurements if available
    //         phase_a_voltage: data.phaseAVoltage || null,
    //         phase_b_voltage: data.phaseBVoltage || null,
    //         phase_c_voltage: data.phaseCVoltage || null,
    //         phase_a_current: data.phaseACurrent || null,
    //         phase_b_current: data.phaseBCurrent || null,
    //         phase_c_current: data.phaseCCurrent || null,
            
    //         // Energy measurements
    //         total_active_energy_wh: data.totalActiveEnergyWh || null,
    //         total_reactive_energy_varh: data.totalReactiveEnergyVARh || null,
    //         total_apparent_energy_vah: data.totalApparentEnergyVAh || null,
            
    //         // Shorthand columns for UI compatibility
    //         v: voltage,
    //         a: current,
    //         kw: power / 1000, // Convert W to kW
    //         kwh: energy / 1000, // Convert Wh to kWh
            
    //         // Metadata
    //         status: 'active'
    //     };
        
    //     return reading;
    // }

    /**
     * Save readings to database
     */
    // emilmodbus async saveReadings(readings) {
    //     try {
    //         console.log(`💾 Saving ${readings.length} meter readings to database...`);
            
    //         if (this.config.database.batchInsert && readings.length > 1) {
    //             // Use batch insert for better performance
    //             await this.batchInsertReadings(readings);
    //         } else {
    //             // Insert readings individually using direct database query
    //             for (const reading of readings) {
    //                 await this.insertSingleReading(reading);
    //             }
    //         }
            
    //         console.log(`✅ Successfully saved ${readings.length} meter readings to database`);
            
    //         // Log each saved reading
    //         readings.forEach(reading => {
    //             console.log(`💾 ✅ Saved reading for meter ${reading.meterid}: ${reading.reading_value} ${reading.unit_of_measurement} at ${reading.timestamp}`);
    //         });
            
    //     } catch (error) {
    //         console.error('❌ Failed to save meter readings:', error.message);
    //         throw error;
    //     }
    // }

    /**
     * Batch insert readings for better performance
     */
    async batchInsertReadings(readings) {
        if (readings.length === 0) return;
        
        // Build batch insert query
        const columns = Object.keys(readings[0]);
        const placeholders = readings.map((_, index) => {
            const start = index * columns.length;
            return `(${columns.map((_, colIndex) => `$${start + colIndex + 1}`).join(', ')})`;
        }).join(', ');
        
        const values = readings.flatMap(reading => columns.map(col => reading[col]));
        
        const query = `
            INSERT INTO meterreadings (${columns.join(', ')})
            VALUES ${placeholders}
        `;
        
        console.log(`💾 Executing batch insert for ${readings.length} readings...`);
        await db.query(query, values);
        console.log(`✅ Batch insert completed successfully`);
    }

    /**
     * Insert a single reading using direct database query
     */
    async insertSingleReading(reading) {
        // Map our reading object to the correct database column names
        const query = `
            INSERT INTO meterreadings (
                meterid, timestamp, deviceip, slaveid, source, quality,
                voltage, current, power, energy, frequency, powerfactor,
                device_ip, port, slave_id, power_factor,
                phase_a_voltage, phase_b_voltage, phase_c_voltage,
                phase_a_current, phase_b_current, phase_c_current,
                total_active_energy_wh, total_reactive_energy_varh, total_apparent_energy_vah,
                v, a, kw, kwh, data_quality, unit_of_measurement, status, createdat
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
            )
            RETURNING id
        `;

        const values = [
            reading.meterid,
            reading.timestamp || new Date(),
            reading.device_ip,
            reading.slave_id,
            reading.source || 'modbus_auto_collection',
            reading.quality || 'good',
            reading.voltage,
            reading.current,
            reading.power,
            reading.energy,
            reading.frequency,
            reading.power_factor,
            reading.device_ip,
            reading.port,
            reading.slave_id,
            reading.power_factor,
            reading.phase_a_voltage,
            reading.phase_b_voltage,
            reading.phase_c_voltage,
            reading.phase_a_current,
            reading.phase_b_current,
            reading.phase_c_current,
            reading.total_active_energy_wh,
            reading.total_reactive_energy_varh,
            reading.total_apparent_energy_vah,
            reading.v,
            reading.a,
            reading.kw,
            reading.kwh,
            reading.data_quality || 'good',
            reading.unit_of_measurement || 'Wh',
            reading.status || 'active',
            new Date()
        ];

        const result = await db.query(query, values);
        console.log(`💾 ✅ Inserted reading for meter ${reading.meterid} with ID: ${result.rows[0].id}`);
        return result.rows[0];
    }

    /**
     * Get active meters for collection
     */
    async getActiveMeters() {
        const query = `
            SELECT 
                id, meterid, name, type, status,
                location_building, location_floor, location_room,
                last_reading_date, installation_date
            FROM meters 
            WHERE status = 'active'
            ORDER BY meterid
        `;

        try {
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching active meters:', error);
            return [];
        }
    }

    /**
     * Log collection statistics
     */
    logCollectionStats() {
        const stats = this.getCollectionStats();
        const successRate = stats.totalAttempts > 0 
            ? ((stats.successfulReads / stats.totalAttempts) * 100).toFixed(1)
            : 0;
            
        console.log(`📊 Collection Stats: ${stats.successfulReads}/${stats.totalAttempts} successful (${successRate}%), Last: ${stats.lastCollectionTime}`);
        
        if (stats.lastError) {
            console.log(`❌ Last Error: ${stats.lastError}`);
        }
    }

    /**
     * Get collection statistics
     */
    getCollectionStats() {
        return {
            isCollecting: this.isCollecting,
            interval: this.config?.collection?.interval || 0,
            lastCollectionTime: this.lastCollectionTime,
            totalAttempts: this.collectionStats.totalAttempts,
            successfulReads: this.collectionStats.successfulReads,
            failedReads: this.collectionStats.failedReads,
            successRate: this.collectionStats.totalAttempts > 0 
                ? (this.collectionStats.successfulReads / this.collectionStats.totalAttempts * 100).toFixed(1)
                : 0,
            lastError: this.collectionStats.lastError
        };
    }

    /**
     * Update collection interval
     */
    updateInterval(newInterval) {
        if (newInterval < 5000) {
            throw new Error('Collection interval must be at least 5 seconds');
        }
        
        const wasCollecting = this.isCollecting;
        
        if (wasCollecting) {
            this.stopCollection();
        }
        
        this.config.collection.interval = newInterval;
        
        if (wasCollecting) {
            this.startCollection();
        }
        
        console.log(`🔄 Collection interval updated to ${newInterval}ms (${newInterval / 1000}s)`);
        
        return { success: true, newInterval };
    }



    /**
     * Utility methods
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get service health status
     */
    async getHealthStatus() {
        const stats = this.getCollectionStats();
        
        return {
            isHealthy: true,
            isCollecting: this.isCollecting,
            config: {
                enabled: this.config?.collection?.enabled || false,
                interval: this.config?.collection?.interval || 0,
                batchSize: this.config?.collection?.batchSize || 0
            },
            threadingService: {
                available: !!this.threadingService,
                status: this.threadingService ? 'connected' : 'not_available'
            },
            statistics: stats,
            lastCheck: new Date().toISOString()
        };
    }

    /**
     * Stop service and cleanup
     */
    async stop() {
        this.stopCollection();
        console.log('🔄 Auto meter collection service stopped');
    }
}

// Create singleton instance
const autoMeterCollectionService = new AutoMeterCollectionService();

module.exports = autoMeterCollectionService;