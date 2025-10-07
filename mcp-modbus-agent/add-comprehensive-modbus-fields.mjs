#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { MongoClient } from 'mongodb';

// Load environment variables
(() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const agentEnv = path.join(thisDir, '.env');
    dotenvConfig({ path: agentEnv });
  } catch {
    dotenvConfig();
  }
})();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://emil_user:db2424@cluster0.tveleqd.mongodb.net/meterdb';
const COLLECTION_NAME = 'meterreadings';

async function addAllModbusFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('meterdb');
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('=== ADDING COMPREHENSIVE MODBUS FIELDS TO METER READINGS ===');
    
    // First, let's see what we currently have
    const currentCount = await collection.countDocuments();
    console.log(`Current collection stats:`);
    console.log(`- Total documents: ${currentCount}`);
    
    // Sample document to see current fields
    const sampleDoc = await collection.findOne();
    if (sampleDoc) {
        console.log(`- Current fields in sample document: ${Object.keys(sampleDoc).length}`);
        console.log(`- Sample fields: ${Object.keys(sampleDoc).slice(0, 10).join(", ")}...`);
    }
    
    console.log('');
    console.log('🔧 Creating comprehensive test data with ALL Modbus fields...');
    
    // Delete any existing test data to start fresh (optional - comment out to keep existing data)
    // await collection.deleteMany({});
    
    // Generate comprehensive meter readings with all Modbus fields
    const comprehensiveReadings = [];
    const baseTime = new Date();
    
    // Create readings for 5 different meters with all possible Modbus fields
    for (let meterIndex = 0; meterIndex < 5; meterIndex++) {
        for (let timeIndex = 0; timeIndex < 10; timeIndex++) {
            const timestamp = new Date(baseTime.getTime() - (timeIndex * 60000)); // 1 minute apart
            const meterId = `MODBUS-${String(meterIndex + 1).padStart(3, '0')}-2024`;
            const baseIP = `192.168.1.${100 + meterIndex}`;
            
            // Generate realistic electrical values with some variation
            const baseVoltage = 220 + (Math.random() - 0.5) * 20;
            const baseCurrent = 50 + (Math.random() - 0.5) * 40;
            const basePower = baseVoltage * baseCurrent * 0.9; // Approximate power
            const baseEnergy = 1000000 + (meterIndex * 100000) + (timeIndex * 1000);
            
            const reading = {
                // Core identification fields
                meterId: meterId,
                deviceIP: baseIP,
                ip: baseIP,
                port: 502,
                slaveId: meterIndex + 1,
                source: 'modbus-comprehensive-test',
                
                // Original API format fields (maintained for compatibility)
                kVARh: 800 + (meterIndex * 100) + (timeIndex * 10),
                kVAh: 1500 + (meterIndex * 200) + (timeIndex * 15),
                A: baseCurrent,
                kWh: baseEnergy / 1000,
                dPF: 0.85 + (Math.random() * 0.15),
                dPFchannel: (meterIndex % 3) + 1,
                V: baseVoltage,
                kW: basePower / 1000,
                kWpeak: (basePower * 1.2) / 1000,
                
                // Basic Modbus measurements
                voltage: baseVoltage,
                current: baseCurrent,
                power: basePower,
                energy: baseEnergy,
                frequency: 49.8 + (Math.random() * 0.4),
                powerFactor: 0.85 + (Math.random() * 0.15),
                
                // Phase voltage measurements (3-phase system)
                phaseAVoltage: baseVoltage + (Math.random() - 0.5) * 5,
                phaseBVoltage: baseVoltage + (Math.random() - 0.5) * 5,
                phaseCVoltage: baseVoltage + (Math.random() - 0.5) * 5,
                
                // Phase current measurements
                phaseACurrent: baseCurrent / 3 + (Math.random() - 0.5) * 5,
                phaseBCurrent: baseCurrent / 3 + (Math.random() - 0.5) * 5,
                phaseCCurrent: baseCurrent / 3 + (Math.random() - 0.5) * 5,
                
                // Phase power measurements
                phaseAPower: basePower / 3 + (Math.random() - 0.5) * 500,
                phaseBPower: basePower / 3 + (Math.random() - 0.5) * 500,
                phaseCPower: basePower / 3 + (Math.random() - 0.5) * 500,
                
                // Line-to-line voltage measurements
                lineToLineVoltageAB: baseVoltage * 1.732 + (Math.random() - 0.5) * 10,
                lineToLineVoltageBC: baseVoltage * 1.732 + (Math.random() - 0.5) * 10,
                lineToLineVoltageCA: baseVoltage * 1.732 + (Math.random() - 0.5) * 10,
                
                // Power measurements
                totalActivePower: basePower,
                totalReactivePower: basePower * 0.3 + (Math.random() - 0.5) * 200,
                totalApparentPower: basePower * 1.1 + (Math.random() - 0.5) * 300,
                
                // Energy measurements
                totalActiveEnergyWh: baseEnergy,
                totalReactiveEnergyVARh: baseEnergy * 0.3,
                totalApparentEnergyVAh: baseEnergy * 1.1,
                importActiveEnergyWh: baseEnergy * 0.95,
                exportActiveEnergyWh: baseEnergy * 0.05,
                importReactiveEnergyVARh: baseEnergy * 0.25,
                exportReactiveEnergyVARh: baseEnergy * 0.05,
                
                // Frequency measurements
                frequencyHz: 49.8 + (Math.random() * 0.4),
                
                // Temperature and environmental
                temperatureC: 25 + (Math.random() - 0.5) * 20,
                humidity: 45 + (Math.random() * 20),
                
                // Neutral and ground measurements
                neutralCurrent: 0.5 + (Math.random() * 2),
                groundCurrent: 0.1 + (Math.random() * 0.5),
                
                // Power factor per phase
                phaseAPowerFactor: 0.85 + (Math.random() * 0.15),
                phaseBPowerFactor: 0.85 + (Math.random() * 0.15),
                phaseCPowerFactor: 0.85 + (Math.random() * 0.15),
                
                // Total harmonic distortion
                voltageThd: 1.5 + (Math.random() * 4),
                currentThd: 2.5 + (Math.random() * 5),
                voltageThdPhaseA: 1.2 + (Math.random() * 3),
                voltageThdPhaseB: 1.2 + (Math.random() * 3),
                voltageThdPhaseC: 1.2 + (Math.random() * 3),
                currentThdPhaseA: 2.0 + (Math.random() * 4),
                currentThdPhaseB: 2.0 + (Math.random() * 4),
                currentThdPhaseC: 2.0 + (Math.random() * 4),
                
                // Individual harmonic measurements (up to 50th harmonic)
                voltageHarmonic3: 0.5 + (Math.random() * 2),
                voltageHarmonic5: 0.3 + (Math.random() * 1.5),
                voltageHarmonic7: 0.2 + (Math.random() * 1),
                currentHarmonic3: 1.0 + (Math.random() * 3),
                currentHarmonic5: 0.8 + (Math.random() * 2),
                currentHarmonic7: 0.5 + (Math.random() * 1.5),
                
                // Demand measurements
                maxDemandKW: (basePower / 1000) * 1.2,
                maxDemandKVAR: (basePower / 1000) * 0.4,
                maxDemandKVA: (basePower / 1000) * 1.3,
                currentDemandKW: basePower / 1000,
                currentDemandKVAR: (basePower / 1000) * 0.3,
                currentDemandKVA: (basePower / 1000) * 1.05,
                predictedDemandKW: (basePower / 1000) * 1.1,
                
                // Advanced power quality measurements
                voltageUnbalance: 0.5 + (Math.random() * 2),
                currentUnbalance: 0.8 + (Math.random() * 2.5),
                voltageFlicker: 0.1 + (Math.random() * 0.5),
                frequencyDeviation: (Math.random() - 0.5) * 0.2,
                
                // Phase sequence and rotation
                phaseSequence: meterIndex % 2 === 0 ? 'ABC' : 'ACB',
                phaseRotation: meterIndex % 2 === 0 ? 'positive' : 'negative',
                
                // Power direction indicators
                powerDirection: timeIndex % 3 === 0 ? 'import' : 'export',
                reactiveDirection: timeIndex % 4 === 0 ? 'inductive' : 'capacitive',
                
                // Communication and status fields
                communicationStatus: timeIndex % 10 === 0 ? 'error' : 'ok',
                lastCommunication: new Date(timestamp.getTime() - (Math.random() * 10000)),
                dataQuality: timeIndex % 15 === 0 ? 'estimated' : (timeIndex % 8 === 0 ? 'questionable' : 'good'),
                
                // Register-specific Modbus data
                modbusRegister40001: Math.floor(Math.random() * 65536),
                modbusRegister40002: Math.floor(Math.random() * 65536),
                modbusRegister40003: Math.floor(Math.random() * 65536),
                modbusRegister40004: Math.floor(Math.random() * 65536),
                modbusRegister40005: Math.floor(Math.random() * 65536),
                
                // Device information
                deviceModel: `ModbusDevice-${meterIndex + 1}`,
                firmwareVersion: `v${1 + meterIndex}.${timeIndex % 10}.${Math.floor(Math.random() * 10)}`,
                serialNumber: `MB${String(12345 + meterIndex).padStart(8, '0')}`,
                manufacturerCode: 1000 + meterIndex,
                
                // Meter configuration
                currentTransformerRatio: [100, 200, 500, 1000, 1500][meterIndex],
                voltageTransformerRatio: [1, 10, 100][meterIndex % 3],
                pulseConstant: [1000, 3200, 10000][meterIndex % 3],
                
                // Time and synchronization
                deviceTime: timestamp,
                syncStatus: timeIndex % 7 === 0 ? 'unsynchronized' : 'synchronized',
                timeSource: ['internal', 'ntp', 'gps'][meterIndex % 3],
                
                // Alarm and event information
                alarmStatus: timeIndex % 12 === 0 ? 'active' : 'inactive',
                eventCounter: Math.floor(Math.random() * 1000),
                lastEvent: timeIndex % 6 === 0 ? 'voltage_sag' : (timeIndex % 8 === 0 ? 'overcurrent' : 'normal'),
                
                // Standard metadata
                timestamp: timestamp,
                quality: timeIndex % 20 === 0 ? 'questionable' : (timeIndex % 8 === 0 ? 'estimated' : 'good'),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            comprehensiveReadings.push(reading);
        }
    }
    
    console.log(`📝 Inserting ${comprehensiveReadings.length} comprehensive meter readings...`);
    
    // Insert all the comprehensive readings
    const result = await collection.insertMany(comprehensiveReadings);
    console.log(`✅ Successfully inserted ${result.insertedCount} meter readings`);
    
    // Verify the insertion
    const newCount = await collection.countDocuments();
    console.log(`📊 Total documents in collection: ${newCount}`);
    
    // Check a sample document to verify all fields
    const newSample = await collection.findOne({ source: 'modbus-comprehensive-test' });
    if (newSample) {
        const fieldCount = Object.keys(newSample).length;
        console.log('🔍 Sample document analysis:');
        console.log(`- Total fields in new sample: ${fieldCount}`);
        console.log(`- Fields include: ${Object.keys(newSample).slice(0, 20).join(", ")}...`);
    }
    
    // Create indexes for better performance
    console.log('');
    console.log('🔧 Creating performance indexes...');
    
    // Core indexes
    await collection.createIndex({ meterId: 1, timestamp: -1 });
    await collection.createIndex({ deviceIP: 1 });
    await collection.createIndex({ ip: 1 });
    await collection.createIndex({ quality: 1 });
    await collection.createIndex({ timestamp: -1 });
    
    // Phase measurement indexes
    await collection.createIndex({ phaseAVoltage: 1 });
    await collection.createIndex({ phaseACurrent: 1 });
    await collection.createIndex({ phaseAPower: 1 });
    
    // Power quality indexes
    await collection.createIndex({ voltageThd: 1 });
    await collection.createIndex({ currentThd: 1 });
    await collection.createIndex({ powerDirection: 1 });
    
    // Device status indexes
    await collection.createIndex({ communicationStatus: 1 });
    await collection.createIndex({ alarmStatus: 1 });
    
    console.log('✅ Indexes created successfully');
    
    console.log('');
    console.log('=== MODBUS FIELD ADDITION COMPLETE ===');
    console.log('Your meterdb.meterreadings collection now contains comprehensive Modbus data with:');
    if (newSample) {
        console.log(`- ${Object.keys(newSample).length} fields per document`);
    }
    console.log(`- ${newCount} total meter readings`);
    console.log('- Data from 5 different Modbus devices');
    console.log('- Full electrical measurements including phase data');
    console.log('- Power quality measurements (THD, harmonics, unbalance)');
    console.log('- Device status and communication information');
    console.log('- Historical and demand data');
    console.log('');
    console.log('🔄 Restart your backend server to ensure all new fields are accessible via the API.');
    
  } catch (error) {
    console.error('❌ Error adding comprehensive Modbus fields:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addAllModbusFields();