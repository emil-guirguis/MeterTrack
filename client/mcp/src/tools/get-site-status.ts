import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface GetSiteStatusArgs {
  site_id?: number;
  include_inactive?: boolean;
}

interface SiteRow {
  id: number;
  name: string;
  last_heartbeat: Date | null;
  is_active: boolean;
  created_at: Date;
  meter_count: number;
  last_reading_timestamp: Date | null;
}

export async function getSiteStatus(args: GetSiteStatusArgs) {
  logger.info('Executing get_site_status tool', { args });

  try {
    // Build query with filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (args.site_id !== undefined) {
      conditions.push(`s.id = $${paramIndex++}`);
      params.push(args.site_id);
    }

    if (!args.include_inactive) {
      conditions.push(`s.is_active = $${paramIndex++}`);
      params.push(true);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        s.id,
        s.name,
        s.last_heartbeat,
        s.is_active,
        s.created_at,
        COUNT(DISTINCT m.id) as meter_count,
        MAX(mr.timestamp) as last_reading_timestamp
      FROM sites s
      LEFT JOIN meters m ON s.id = m.site_id
      LEFT JOIN meter_readings mr ON m.id = mr.meter_id
      ${whereClause}
      GROUP BY s.id, s.name, s.last_heartbeat, s.is_active, s.created_at
      ORDER BY s.name
    `;

    const result = await db.query<SiteRow>(query, params);

    // Calculate connectivity status
    const now = new Date();
    const sites = result.rows.map(row => {
      const minutesSinceHeartbeat = row.last_heartbeat 
        ? Math.floor((now.getTime() - new Date(row.last_heartbeat).getTime()) / 60000)
        : null;

      let connectivity_status: 'online' | 'offline' | 'unknown';
      if (!row.last_heartbeat) {
        connectivity_status = 'unknown';
      } else if (minutesSinceHeartbeat !== null && minutesSinceHeartbeat <= 10) {
        connectivity_status = 'online';
      } else {
        connectivity_status = 'offline';
      }

      return {
        id: row.id,
        name: row.name,
        is_active: row.is_active,
        created_at: row.created_at,
        last_heartbeat: row.last_heartbeat,
        minutes_since_heartbeat: minutesSinceHeartbeat,
        connectivity_status,
        meter_count: parseInt(row.meter_count as any, 10),
        last_reading_timestamp: row.last_reading_timestamp,
      };
    });

    logger.info('get_site_status completed', { count: sites.length });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: sites.length,
            sites,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('get_site_status error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
