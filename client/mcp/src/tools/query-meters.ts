import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface QueryMetersArgs {
  tenant_id?: number;
  meter_id?: string;
  is_active?: boolean;
}

interface MeterRow {
  tenant_id: number;
  meter_id: string;
  meter_name: string;
  bacnet_device_id: number | null;
  bacnet_ip: string | null;
  meter_created_at: Date;
  site_id: number;
  site_name: string;
  site_is_active: boolean;
  last_reading_timestamp: Date | null;
}

export async function queryMeters(args: QueryMetersArgs) {
  logger.info('Executing query_meters tool', { args });

  try {
    // Build query with filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (args.tenant_id !== undefined) {
      conditions.push(`s.id = $${paramIndex++}`);
      params.push(args.tenant_id);
    }

    if (args.meter_id !== undefined) {
      conditions.push(`m.external_id = $${paramIndex++}`);
      params.push(args.meter_id);
    }

    if (args.is_active !== undefined) {
      conditions.push(`s.is_active = $${paramIndex++}`);
      params.push(args.is_active);
    } else {
      // Default to active sites only
      conditions.push(`s.is_active = $${paramIndex++}`);
      params.push(true);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        m.id as meter_id,
        m.external_id as meter_external_id,
        m.name as meter_name,
        m.bacnet_device_id,
        m.bacnet_ip,
        m.created_at as meter_created_at,
        s.id as site_id,
        s.name as site_name,
        s.is_active as site_is_active,
        (
          SELECT MAX(timestamp) 
          FROM meter_reading mr 
          WHERE mr.meter_id = m.id
        ) as last_reading_timestamp
      FROM meter m
      INNER JOIN sites s ON m.site_id = s.id
      ${whereClause}
      ORDER BY s.name, m.name
    `;

    const result = await db.query<MeterRow>(query, params);

    const meters = result.rows.map(row => ({
      meter: {
        id: row.meter_id,
        tenant_id: row.tenant_id,
        name: row.meter_name,
        bacnet_device_id: row.bacnet_device_id,
        bacnet_ip: row.bacnet_ip,
        created_at: row.meter_created_at,
        last_reading_timestamp: row.last_reading_timestamp,
      },
      site: {
        id: row.site_id,
        name: row.site_name,
        is_active: row.site_is_active,
      },
    }));

    logger.info('query_meters completed', { count: meters.length });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: meters.length,
            meters,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('query_meters error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
