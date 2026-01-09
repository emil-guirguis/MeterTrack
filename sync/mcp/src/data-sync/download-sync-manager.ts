/**
 * Download Sync Manager
 * 
 * Handles downloading meter configurations and tenant data from remote database to local database.
 * Implements comparison logic, upsert operations, and change tracking.
 */

import { Pool } from 'pg';
import winston from 'winston';
import { ErrorHandler } from '../helpers/error-handler';

export interface MeterConfiguration {
  meter_id: number;
  tenant_id: number;
  device_id: number;
  ip: string;
  element: string;
  port: number;
  active: boolean;
}

export interface Tenant {
  tenant_id: number;
  name: string;
  url?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  active: boolean;
}

export interface MeterSyncResult {
  success: boolean;
  newMeters: number;
  updatedMeters: number;
  totalMeters: number;
  error?: string;
  duration: number;
  newMeterIds: number[];
  updatedMeterIds: number[];
}

export interface TenantSyncResult {
  success: boolean;
  newTenants: number;
  updatedTenants: number;
  totalTenants: number;
  error?: string;
  duration: number;
  newTenantIds: number[];
  updatedTenantIds: number[];
  tenantChanges: Array<{
    tenant_id: number;
    changedFields: string[];
  }>;
}

export interface DownloadSyncManagerConfig {
  localPool: Pool;
  remotePool: Pool;
  maxQueryRetries?: number;
  logger?: winston.Logger;
}

export class DownloadSyncManager {
  private localPool: Pool;
  private remotePool: Pool;
  private maxQueryRetries: number;
  private logger: winston.Logger;
  private errorHandler: ErrorHandler;

  constructor(config: DownloadSyncManagerConfig) {
    this.localPool = config.localPool;
    this.remotePool = config.remotePool;
    this.maxQueryRetries = config.maxQueryRetries || 3;
    this.logger = config.logger || this.createDefaultLogger();
    this.errorHandler = new ErrorHandler(this.logger);
  }

  async getTenantId(): Promise<any[]> {
    this.logger.info('Getting tenant ID');
    const result = await this.localPool.query('SELECT tenant_id from tenant t');
    return result.rows;
  } 


  /**
   * Execute meter configuration sync
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5
   */
  async syncMeterConfigurations(tenantId: number): Promise < MeterSyncResult > {
      const startTime = Date.now();

      try {
        // Query all meter configurations from remote database
        const remoteMeters = await this.queryRemoteMeters(tenantId);
        this.logger.info(`Retrieved ${remoteMeters.length} meter configurations from remote database`);

        // Query all meter configurations from local database
        const localMeters = await this.queryLocalMeters();
        this.logger.info(`Found ${localMeters.length} meter configurations in local database`);

        // Compare and sync meters
        const { newMeterIds, updatedMeterIds } = await this.syncMeters(remoteMeters, localMeters);

        const duration = Date.now() - startTime;

        // Log results
        if(newMeterIds.length > 0) {
      this.logger.info(`Added ${newMeterIds.length} new meters: ${newMeterIds.join(', ')}`);
    }
    if (updatedMeterIds.length > 0) {
      this.logger.info(`Updated ${updatedMeterIds.length} meters: ${updatedMeterIds.join(', ')}`);
    }
    if (newMeterIds.length === 0 && updatedMeterIds.length === 0) {
      this.logger.info('Meter configurations are up to date');
    }

    return {
      success: true,
      newMeters: newMeterIds.length,
      updatedMeters: updatedMeterIds.length,
      totalMeters: remoteMeters.length,
      duration,
      newMeterIds,
      updatedMeterIds,
    };
  } catch(error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Handle download error with operation isolation (Requirement 9.5)
    this.errorHandler.handleDownloadError(err, {
      operation: 'syncMeterConfigurations',
      details: { duration: Date.now() - startTime },
    });

    return {
      success: false,
      newMeters: 0,
      updatedMeters: 0,
      totalMeters: 0,
      error: err.message,
      duration: Date.now() - startTime,
      newMeterIds: [],
      updatedMeterIds: [],
    };
  }
}

  /**
   * Query all meter configurations from remote database
   * Requirements: 8.1, 8.2, 6.2
   */
  private async queryRemoteMeters(tenantId: number): Promise < MeterConfiguration[] > {
  // Use error handler with retry logic (Requirement 6.2)
  return this.errorHandler.handleQueryError(
    async () => {
      const result = await this.remotePool.query(
        `SELECT meter_id, device_id, ip, port, active, me.element 
           FROM meter m
              JOIN meter_element me on (me.meter_id = m.meter_id)
           WHERE m.tenant_id = $1`,
        [
          tenantId,
        ]
      );

      return result.rows;
    },
    {
      operation: 'queryRemoteMeters',
      details: { table: 'meter', database: 'remote' },
    }
  );
}

  /**
   * Query all meter configurations from local database
   * Requirement: 6.2
   */
  private async queryLocalMeters(): Promise < MeterConfiguration[] > {
  // Use error handler with retry logic (Requirement 6.2)
  return this.errorHandler.handleQueryError(
    async () => {
      const result = await this.localPool.query(
        `SELECT *
           FROM meter
           ORDER BY id`
      );

      return result.rows;
    },
    {
      operation: 'queryLocalMeters',
      details: { table: 'meter', database: 'local' },
    }
  );
}

  /**
   * Sync meters: compare remote with local and insert/update as needed
   * Requirements: 8.3, 8.4, 8.5, 9.1, 9.2
   */
  private async syncMeters(
  remoteMeters: MeterConfiguration[],
  localMeters: MeterConfiguration[]
): Promise < { newMeterIds: number[]; updatedMeterIds: number[] } > {
  const newMeterIds: number[] = [];
  const updatedMeterIds: number[] = [];

  // Create a map of local meters by ID for quick lookup
  const localMeterMap = new Map<number, MeterConfiguration>();
  for(const meter of localMeters) {
    localMeterMap.set(meter.meter_id, meter);
  }

    // Process each remote meter
    for(const remoteMeter of remoteMeters) {
    const localMeter = localMeterMap.get(remoteMeter.meter_id);

    if (!localMeter) {
      // Meter doesn't exist locally - insert it
      await this.insertMeter(remoteMeter);
      newMeterIds.push(remoteMeter.meter_id);
      this.logger.info(`New meter added: ${remoteMeter.meter_id}`);
    } else if (this.meterHasChanged(remoteMeter, localMeter)) {
      // Meter exists but has been updated - update it
      await this.updateMeter(remoteMeter);
      updatedMeterIds.push(remoteMeter.meter_id);

      // Log which fields changed
      const changedFields = this.getChangedMeterFields(remoteMeter, localMeter);
      this.logger.info(`Meter updated: ${remoteMeter.meter_id} - fields changed: ${changedFields.join(', ')}`);
    }
  }

    return { newMeterIds, updatedMeterIds };
}

  /**
   * Check if meter configuration has changed
   * Requirements: 8.3
   */
  private meterHasChanged(remoteMeter: MeterConfiguration, localMeter: MeterConfiguration): boolean {
  // Compare all relevant fields
  return (
    remoteMeter.device_id !== localMeter.device_id ||
    remoteMeter.ip !== localMeter.ip ||
    remoteMeter.port !== localMeter.port ||
    remoteMeter.active !== localMeter.active ||
    remoteMeter.element !== localMeter.element
  );
}

  /**
   * Get list of changed fields for logging
   * Requirements: 9.3
   */
  private getChangedMeterFields(remoteMeter: MeterConfiguration, localMeter: MeterConfiguration): string[] {
  const changedFields: string[] = [];

  if (remoteMeter.device_id !== localMeter.device_id) changedFields.push('device_id');
  if (remoteMeter.ip !== localMeter.ip) changedFields.push('ip');
  if (remoteMeter.port !== localMeter.port) changedFields.push('port');
  if (remoteMeter.active !== localMeter.active) changedFields.push('active');

  return changedFields;
}

  /**
   * Insert new meter into local database
   * Requirements: 8.4
   */
  private async insertMeter(meter: MeterConfiguration): Promise < void> {
  try {
    await this.localPool.query(
      `INSERT INTO meter (
          meter_id, name, device_id, ip, port,  active, element
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        meter.meter_id,
        meter.device_id,
        meter.ip,
        meter.port,
        meter.active,
      ]
    );
  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Failed to insert meter ${meter.meter_id}:`, errorMessage);
    throw error;
  }
}

  /**
   * Update existing meter in local database
   * Requirements: 8.5
   */
  private async updateMeter(meter: MeterConfiguration): Promise < void> {
  try {
    await this.localPool.query(
      `UPDATE meter
         SET device_id = $1,
             ip = $2,
             port = $3,
             active = $4,
             element = $5
         WHERE meter_id = $6`,
      [
        meter.device_id,
        meter.ip,
        meter.port,
        meter.active,
        meter.element,
        meter.meter_id
        ]
    );
  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Failed to update meter ${meter.meter_id}:`, errorMessage);
    throw error;
  }
}

  /**
   * Get local meter count
   */
  async getLocalMeterCount(): Promise < number > {
  try {
    const result = await this.localPool.query('SELECT COUNT(*) as count FROM meter');
    return parseInt(result.rows[0].count, 10);
  } catch(error) {
    this.logger.error('Failed to get local meter count:', error);
    return 0;
  }
}

  /**
   * Execute tenant data sync
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5
   */
  async syncTenantData(): Promise < TenantSyncResult > {
  const startTime = Date.now();

  try {
    // Query all tenant records from remote database
    const remoteTenants = await this.queryRemoteTenants();
    this.logger.info(`Retrieved ${remoteTenants.length} tenant records from remote database`);

    // Query all tenant records from local database
    const localTenants = await this.queryLocalTenants();
    this.logger.info(`Found ${localTenants.length} tenant records in local database`);

    // Compare and sync tenants
    const { newTenantIds, updatedTenantIds, tenantChanges } = await this.syncTenants(remoteTenants, localTenants);

    const duration = Date.now() - startTime;

    // Log results
    if(newTenantIds.length > 0) {
  this.logger.info(`Added ${newTenantIds.length} new tenants: ${newTenantIds.join(', ')}`);
}
if (updatedTenantIds.length > 0) {
  this.logger.info(`Updated ${updatedTenantIds.length} tenants: ${updatedTenantIds.join(', ')}`);
  // Log detailed changes for each updated tenant
  for (const change of tenantChanges) {
    this.logger.info(`Tenant ${change.tenant_id} - fields changed: ${change.changedFields.join(', ')}`);
  }
}
if (newTenantIds.length === 0 && updatedTenantIds.length === 0) {
  this.logger.info('Tenant data is up to date');
}

return {
  success: true,
  newTenants: newTenantIds.length,
  updatedTenants: updatedTenantIds.length,
  totalTenants: remoteTenants.length,
  duration,
  newTenantIds,
  updatedTenantIds,
  tenantChanges,
};
    } catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));

  // Handle download error with operation isolation (Requirement 11.5)
  this.errorHandler.handleDownloadError(err, {
    operation: 'syncTenantData',
    details: { duration: Date.now() - startTime },
  });

  return {
    success: false,
    newTenants: 0,
    updatedTenants: 0,
    totalTenants: 0,
    error: err.message,
    duration: Date.now() - startTime,
    newTenantIds: [],
    updatedTenantIds: [],
    tenantChanges: [],
  };
}
  }

  /**
   * Query all tenant records from remote database
   * Requirements: 10.1, 10.2, 6.2
   */
  private async queryRemoteTenants(): Promise < Tenant[] > {
  // Use error handler with retry logic (Requirement 6.2)
  return this.errorHandler.handleQueryError(
    async () => {
      const result = await this.remotePool.query(
        `SELECT tenant_id, name, url, street, street2, city, state, zip, country, active
           FROM tenant`
      );

      return result.rows;
    },
    {
      operation: 'queryRemoteTenants',
      details: { table: 'tenant', database: 'remote' },
    }
  );
}

  /**
   * Query all tenant records from local database
   * Requirement: 6.2
   */
  private async queryLocalTenants(): Promise < Tenant[] > {
  // Use error handler with retry logic (Requirement 6.2)
  return this.errorHandler.handleQueryError(
    async () => {
      const result = await this.localPool.query(
        `SELECT tenant_id, name, url, street, street2, city, state, zip, country, active
           FROM tenant`
      );

      return result.rows;
    },
    {
      operation: 'queryLocalTenants',
      details: { table: 'tenant', database: 'local' },
    }
  );
}

  /**
   * Sync tenants: compare remote with local and insert/update as needed
   * Requirements: 10.3, 10.4, 10.5, 11.1, 11.2, 11.3
   */
  private async syncTenants(
  remoteTenants: Tenant[],
  localTenants: Tenant[]
): Promise < {
  newTenantIds: number[];
  updatedTenantIds: number[];
  tenantChanges: Array<{ tenant_id: number; changedFields: string[] }>;
} > {
  const newTenantIds: number[] = [];
  const updatedTenantIds: number[] = [];
  const tenantChanges: Array<{ tenant_id: number; changedFields: string[] }> =[];

// Create a map of local tenants by ID for quick lookup
const localTenantMap = new Map<number, Tenant>();
for (const tenant of localTenants) {
  localTenantMap.set(tenant.tenant_id, tenant);
}

// Process each remote tenant
for (const remoteTenant of remoteTenants) {
  const localTenant = localTenantMap.get(remoteTenant.tenant_id);

  if (!localTenant) {
    // Tenant doesn't exist locally - insert it
    await this.insertTenant(remoteTenant);
    newTenantIds.push(remoteTenant.tenant_id);
    this.logger.info(`New tenant added: ${remoteTenant.tenant_id} - ${remoteTenant.name}`);
  } else if (this.tenantHasChanged(remoteTenant, localTenant)) {
    // Tenant exists but has been updated - update it
    await this.updateTenant(remoteTenant);
    updatedTenantIds.push(remoteTenant.tenant_id);

    // Track which fields changed
    const changedFields = this.getChangedTenantFields(remoteTenant, localTenant);
    tenantChanges.push({
      tenant_id: remoteTenant.tenant_id,
      changedFields,
    });
  }
}

return { newTenantIds, updatedTenantIds, tenantChanges };
  }

  /**
   * Check if tenant data has changed
   * Requirements: 10.3
   */
  private tenantHasChanged(remoteTenant: Tenant, localTenant: Tenant): boolean {
  // Compare all relevant fields
  return (
    remoteTenant.name !== localTenant.name ||
    remoteTenant.url !== localTenant.url ||
    remoteTenant.street !== localTenant.street ||
    remoteTenant.street2 !== localTenant.street2 ||
    remoteTenant.city !== localTenant.city ||
    remoteTenant.state !== localTenant.state ||
    remoteTenant.zip !== localTenant.zip ||
    remoteTenant.country !== localTenant.country ||
    remoteTenant.active !== localTenant.active
  );
}

  /**
   * Get list of changed fields for logging
   * Requirements: 11.3
   */
  private getChangedTenantFields(remoteTenant: Tenant, localTenant: Tenant): string[] {
  const changedFields: string[] = [];

  if (remoteTenant.name !== localTenant.name) changedFields.push('name');
  if (remoteTenant.url !== localTenant.url) changedFields.push('url');
  if (remoteTenant.street !== localTenant.street) changedFields.push('street');
  if (remoteTenant.street2 !== localTenant.street2) changedFields.push('street2');
  if (remoteTenant.city !== localTenant.city) changedFields.push('city');
  if (remoteTenant.state !== localTenant.state) changedFields.push('state');
  if (remoteTenant.zip !== localTenant.zip) changedFields.push('zip');
  if (remoteTenant.country !== localTenant.country) changedFields.push('country');
  if (remoteTenant.active !== localTenant.active) changedFields.push('active');

  return changedFields;
}

  /**
   * Insert new tenant into local database
   * Requirements: 10.4
   */
  private async insertTenant(tenant: Tenant): Promise < void> {
  try {
    await this.localPool.query(
      `INSERT INTO tenant (
          id, name, url, street, street2, city, state, zip, country, active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tenant.tenant_id,
        tenant.name,
        tenant.url,
        tenant.street,
        tenant.street2,
        tenant.city,
        tenant.state,
        tenant.zip,
        tenant.country,
        tenant.active,
      ]
    );
  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Failed to insert tenant ${tenant.tenant_id}:`, errorMessage);
    throw error;
  }
}

  /**
   * Update existing tenant in local database
   * Requirements: 10.5
   */
  private async updateTenant(tenant: Tenant): Promise < void> {
  try {
    await this.localPool.query(
      `UPDATE tenant
         SET name = $2,
             url = $3,
             street = $4,
             street2 = $5,
             city = $6,
             state = $7,
             zip = $8,
             country = $9,
             active = $10,
             updated_at = $11,
             meter_reading_batch_count = $12
         WHERE tenant_id = $1`,
      [
        tenant.tenant_id,
        tenant.name,
        tenant.url,
        tenant.street,
        tenant.street2,
        tenant.city,
        tenant.state,
        tenant.zip,
        tenant.country,
        tenant.active,
      ]
    );
  } catch(error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Failed to update tenant ${tenant.tenant_id}:`, errorMessage);
    throw error;
  }
}

  /**
   * Get local tenant count
   */
  async getLocalTenantCount(): Promise < number > {
  try {
    const result = await this.localPool.query('SELECT COUNT(*) as count FROM tenant');
    return parseInt(result.rows[0].count, 10);
  } catch(error) {
    this.logger.error('Failed to get local tenant count:', error);
    return 0;
  }
}

  /**
   * Get remote meter count
   */
  async getRemoteMeterCount(): Promise < number > {
  try {
    const result = await this.remotePool.query('SELECT COUNT(*) as count FROM meter');
    return parseInt(result.rows[0].count, 10);
  } catch(error) {
    this.logger.error('Failed to get remote meter count:', error);
    return 0;
  }
}

  /**
   * Get remote tenant count
   */
  async getRemoteTenantCount(): Promise < number > {
  try {
    const result = await this.remotePool.query('SELECT COUNT(*) as count FROM tenant');
    return parseInt(result.rows[0].count, 10);
  } catch(error) {
    this.logger.error('Failed to get remote tenant count:', error);
    return 0;
  }
}

  /**
   * Create default logger
   */
  private createDefaultLogger(): winston.Logger {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });
}
}
