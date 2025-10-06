import { MongoClient, Db, Collection } from 'mongodb';
import winston from 'winston';
import { MeterReading } from './modbus-client.js';

export interface DatabaseConfig {
  uri: string;
  databaseName: string;
  collectionName: string;
}

export class DatabaseManager {
  private client: MongoClient;
  private db: Db | null = null;
  private collection: Collection | null = null;
  private config: DatabaseConfig;
  private logger: winston.Logger;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig, logger: winston.Logger) {
    this.config = config;
    this.logger = logger;
    this.client = new MongoClient(config.uri);
  }

  public async connect(): Promise<boolean> {
    try {
      await this.client.connect();
      this.db = this.client.db(this.config.databaseName);
      this.collection = this.db.collection(this.config.collectionName);
      
      this.isConnected = true;
      this.logger.info(`Connected to MongoDB: ${this.config.databaseName}.${this.config.collectionName}`);
      
      // Create indexes for better query performance
      await this.createIndexes();
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect to MongoDB: ${error}`);
      this.isConnected = false;
      return false;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.collection) return;

    try {
      // Create compound index on meterId and timestamp
      await this.collection.createIndex(
        { meterId: 1, timestamp: -1 },
        { background: true }
      );
      
      // Create index on timestamp for time-based queries
      await this.collection.createIndex(
        { timestamp: -1 },
        { background: true }
      );
      
      // Create index on deviceIP for device-based queries
      await this.collection.createIndex(
        { deviceIP: 1 },
        { background: true }
      );
      
      this.logger.info('Database indexes created successfully');
    } catch (error) {
      this.logger.warn(`Failed to create indexes: ${error}`);
    }
  }

  public async insertMeterReading(reading: MeterReading): Promise<boolean> {
    if (!this.isConnected || !this.collection) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.collection.insertOne({
        ...reading,
        _id: undefined, // Let MongoDB generate the ID
        createdAt: new Date()
      });

      this.logger.debug(`Meter reading inserted with ID: ${result.insertedId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to insert meter reading: ${error}`);
      throw error;
    }
  }

  public async insertMeterReadings(readings: MeterReading[]): Promise<number> {
    if (!this.isConnected || !this.collection) {
      throw new Error('Database not connected');
    }

    try {
      const documents = readings.map(reading => ({
        ...reading,
        _id: undefined,
        createdAt: new Date()
      }));

      const result = await this.collection.insertMany(documents);
      
      this.logger.debug(`${result.insertedCount} meter readings inserted`);
      return result.insertedCount;
    } catch (error) {
      this.logger.error(`Failed to insert meter readings: ${error}`);
      throw error;
    }
  }

  public async getLatestReading(meterId: string): Promise<MeterReading | null> {
    if (!this.isConnected || !this.collection) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.collection.findOne(
        { meterId },
        { sort: { timestamp: -1 } }
      );

      if (!result) return null;
      
      return {
        timestamp: result.timestamp,
        voltage: result.voltage,
        current: result.current,
        power: result.power,
        energy: result.energy,
        frequency: result.frequency,
        powerFactor: result.powerFactor,
        temperature: result.temperature,
        meterId: result.meterId,
        deviceIP: result.deviceIp || result.deviceIP,
        slaveId: result.slaveId,
        quality: result.quality || 'good',
        source: result.source || 'modbus'
      } as MeterReading;
    } catch (error) {
      this.logger.error(`Failed to get latest reading: ${error}`);
      throw error;
    }
  }

  public async getReadingsByTimeRange(
    meterId: string,
    startTime: Date,
    endTime: Date,
    limit: number = 1000
  ): Promise<MeterReading[]> {
    if (!this.isConnected || !this.collection) {
      throw new Error('Database not connected');
    }

    try {
      const results = await this.collection
        .find({
          meterId,
          timestamp: {
            $gte: startTime,
            $lte: endTime
          }
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return results.map(doc => ({
        timestamp: doc.timestamp,
        voltage: doc.voltage,
        current: doc.current,
        power: doc.power,
        energy: doc.energy,
        frequency: doc.frequency,
        powerFactor: doc.powerFactor,
        temperature: doc.temperature,
        meterId: doc.meterId,
        deviceIP: doc.deviceIp || doc.deviceIP,
        slaveId: doc.slaveId,
        quality: doc.quality || 'good',
        source: doc.source || 'modbus'
      })) as MeterReading[];
    } catch (error) {
      this.logger.error(`Failed to get readings by time range: ${error}`);
      throw error;
    }
  }

  public async getStatistics(meterId: string, hours: number = 24): Promise<any> {
    if (!this.isConnected || !this.collection) {
      throw new Error('Database not connected');
    }

    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const pipeline = [
        {
          $match: {
            meterId,
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgVoltage: { $avg: '$voltage' },
            avgCurrent: { $avg: '$current' },
            avgPower: { $avg: '$power' },
            totalEnergy: { $max: '$energy' }, // Energy is cumulative
            avgFrequency: { $avg: '$frequency' },
            avgPowerFactor: { $avg: '$powerFactor' },
            minTimestamp: { $min: '$timestamp' },
            maxTimestamp: { $max: '$timestamp' }
          }
        }
      ];

      const results = await this.collection.aggregate(pipeline).toArray();
      return results[0] || null;
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error}`);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.close();
      this.isConnected = false;
      this.db = null;
      this.collection = null;
      this.logger.info('Disconnected from MongoDB');
    } catch (error) {
      this.logger.error(`Error disconnecting from MongoDB: ${error}`);
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Ping the database
      await this.client.db('admin').admin().ping();
      return true;
    } catch (error) {
      this.logger.error(`Database connection test failed: ${error}`);
      return false;
    }
  }
}