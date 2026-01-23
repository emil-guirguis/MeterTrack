import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface CheckMeterHealthArgs {
  // No required arguments - checks all meters
}

interface MeterHealthIssue {
  meter_id: string;
  element_id: string;
  issue_type: 'failing' | 'stale';
  last_update: string; // ISO timestamp
  status: string; // error message or "stale"
}

interface MeterReadingRow {
  meter_id: string;
  element_id: string;
  status: string | null;
  timestamp: Date | null;
}

/**
 * Check meter health for all meters and elements
 * Identifies failing readings (error status) and stale readings (>1 hour old)
 */
export async function checkMeterHealth(args: CheckMeterHealthArgs) {
  logger.info('Executing check_meter_health tool', { args });

  try {
    const issues: MeterHealthIssue[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Query all meter readings with their latest status
    const query = `
      SELECT DISTINCT
        m.id as meter_id,
        me.name as element_id,
        mr.status,
        mr.timestamp
      FROM meter m
      INNER JOIN meter_elements me ON m.id = me.meter_id
      LEFT JOIN meter_reading mr ON m.id = mr.meter_id 
        AND me.name = mr.element_id
        AND mr.timestamp = (
          SELECT MAX(timestamp) 
          FROM meter_reading mr2 
          WHERE mr2.meter_id = m.id 
          AND mr2.element_id = me.name
        )
      ORDER BY m.id, me.name
    `;

    const result = await db.query<MeterReadingRow>(query, []);

    // Process each meter element
    for (const row of result.rows) {
      const meterId = row.meter_id;
      const elementId = row.element_id;
      const status = row.status;
      const timestamp = row.timestamp;

      // Check for failing reading (error status)
      if (status && status.toLowerCase() === 'error') {
        issues.push({
          meter_id: meterId,
          element_id: elementId,
          issue_type: 'failing',
          last_update: timestamp ? new Date(timestamp).toISOString() : now.toISOString(),
          status: status
        });
      }

      // Check for stale reading (no update in past 1 hour)
      if (!timestamp || new Date(timestamp) < oneHourAgo) {
        issues.push({
          meter_id: meterId,
          element_id: elementId,
          issue_type: 'stale',
          last_update: timestamp ? new Date(timestamp).toISOString() : 'never',
          status: 'stale'
        });
      }
    }

    logger.info('check_meter_health completed', { 
      total_issues: issues.length,
      failing_count: issues.filter(i => i.issue_type === 'failing').length,
      stale_count: issues.filter(i => i.issue_type === 'stale').length
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            issues,
            summary: {
              total_issues: issues.length,
              failing_count: issues.filter(i => i.issue_type === 'failing').length,
              stale_count: issues.filter(i => i.issue_type === 'stale').length
            }
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('check_meter_health error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
