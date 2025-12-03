import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface QueryReadingsArgs {
  meter_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

interface ReadingRow {
  tenant_id: number;
  timestamp: Date;
  data_point: string;
  value: number;
  unit: string | null;
  reading_created_at: Date;
  meter_id: number;
  meter_external_id: string;
  meter_name: string;
  site_id: number;
  site_name: string;
}

export async function queryReadings(args: QueryReadingsArgs) {
  logger.info('Executing query_readings tool', { args });

  try {
    // Build query with filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (args.meter_id !== undefined) {
      conditions.push(`m.id = $${paramIndex++}`);
      params.push(args.meter_id);
    }


    if (args.end_date !== undefined) {
      conditions.push(`mr.timestamp <= $${paramIndex++}`);
      params.push(args.end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = args.limit || 1000;

    const query = `
      SELECT 
        mr.id as reading_id,
        mr.timestamp,
        mr.data_point,
        mr.value,
        mr.unit,
        mr.created_at as reading_created_at,
        m.id as meter_id,
        m.external_id as meter_external_id,
        m.name as meter_name,
        s.id as site_id,
        s.name as site_name
      FROM meter_reading mr
      INNER JOIN meters m ON mr.meter_id = m.id
      INNER JOIN sites s ON m.site_id = s.id
      ${whereClause}
      ORDER BY mr.timestamp DESC
      LIMIT $${paramIndex}
    `;

    params.push(limit);

    const result = await db.query<ReadingRow>(query, params);

    const readings = result.rows.map(row => ({
      reading: {
        timestamp: row.timestamp,
        data_point: row.data_point,
        value: row.value,
        unit: row.unit,
        created_at: row.reading_created_at,
      },
      meter: {
        id: row.meter_id,
        external_id: row.meter_external_id,
        name: row.meter_name,
      },
      site: {
        id: row.site_id,
        name: row.site_name,
      },
    }));

    logger.info('query_readings completed', { count: readings.length });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: readings.length,
            limit,
            readings,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('query_readings error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
