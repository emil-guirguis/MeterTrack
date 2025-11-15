import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface GenerateReportArgs {
  report_type: 'summary' | 'detailed' | 'comparison';
  site_ids?: number[];
  start_date: string;
  end_date: string;
  data_point?: string;
}

interface SummaryRow {
  site_id: number;
  site_name: string;
  meter_count: number;
  reading_count: number;
  data_point: string;
  min_value: number;
  max_value: number;
  avg_value: number;
  total_value: number;
  unit: string | null;
}

interface DetailedRow {
  site_id: number;
  site_name: string;
  meter_id: number;
  meter_name: string;
  meter_external_id: string;
  timestamp: Date;
  data_point: string;
  value: number;
  unit: string | null;
}

export async function generateReport(args: GenerateReportArgs) {
  logger.info('Executing generate_report tool', { args });

  try {
    switch (args.report_type) {
      case 'summary':
        return await generateSummaryReport(args);
      case 'detailed':
        return await generateDetailedReport(args);
      case 'comparison':
        return await generateComparisonReport(args);
      default:
        throw new Error(`Unknown report type: ${args.report_type}`);
    }
  } catch (error) {
    logger.error('generate_report error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

async function generateSummaryReport(args: GenerateReportArgs) {
  const conditions: string[] = [
    'mr.timestamp >= $1',
    'mr.timestamp <= $2',
  ];
  const params: any[] = [args.start_date, args.end_date];
  let paramIndex = 3;

  if (args.site_ids && args.site_ids.length > 0) {
    conditions.push(`s.id = ANY($${paramIndex++})`);
    params.push(args.site_ids);
  }

  if (args.data_point) {
    conditions.push(`mr.data_point = $${paramIndex++}`);
    params.push(args.data_point);
  }

  const query = `
    SELECT 
      s.id as site_id,
      s.name as site_name,
      COUNT(DISTINCT m.id) as meter_count,
      COUNT(mr.id) as reading_count,
      mr.data_point,
      MIN(mr.value) as min_value,
      MAX(mr.value) as max_value,
      AVG(mr.value) as avg_value,
      SUM(mr.value) as total_value,
      mr.unit
    FROM sites s
    INNER JOIN meters m ON s.id = m.site_id
    INNER JOIN meter_readings mr ON m.id = mr.meter_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY s.id, s.name, mr.data_point, mr.unit
    ORDER BY s.name, mr.data_point
  `;

  const result = await db.query<SummaryRow>(query, params);

  const summary = {
    report_type: 'summary',
    period: {
      start_date: args.start_date,
      end_date: args.end_date,
    },
    total_sites: new Set(result.rows.map(r => r.site_id)).size,
    total_meters: result.rows.reduce((sum, r) => sum + parseInt(r.meter_count as any, 10), 0),
    total_readings: result.rows.reduce((sum, r) => sum + parseInt(r.reading_count as any, 10), 0),
    sites: result.rows.map(row => ({
      site_id: row.site_id,
      site_name: row.site_name,
      meter_count: parseInt(row.meter_count as any, 10),
      reading_count: parseInt(row.reading_count as any, 10),
      data_point: row.data_point,
      statistics: {
        min: parseFloat(row.min_value as any),
        max: parseFloat(row.max_value as any),
        avg: parseFloat(row.avg_value as any),
        total: parseFloat(row.total_value as any),
      },
      unit: row.unit,
    })),
  };

  logger.info('generate_report (summary) completed', { 
    sites: summary.total_sites,
    readings: summary.total_readings 
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          report: summary,
        }, null, 2),
      },
    ],
  };
}

async function generateDetailedReport(args: GenerateReportArgs) {
  const conditions: string[] = [
    'mr.timestamp >= $1',
    'mr.timestamp <= $2',
  ];
  const params: any[] = [args.start_date, args.end_date];
  let paramIndex = 3;

  if (args.site_ids && args.site_ids.length > 0) {
    conditions.push(`s.id = ANY($${paramIndex++})`);
    params.push(args.site_ids);
  }

  if (args.data_point) {
    conditions.push(`mr.data_point = $${paramIndex++}`);
    params.push(args.data_point);
  }

  const query = `
    SELECT 
      s.id as site_id,
      s.name as site_name,
      m.id as meter_id,
      m.name as meter_name,
      m.external_id as meter_external_id,
      mr.timestamp,
      mr.data_point,
      mr.value,
      mr.unit
    FROM sites s
    INNER JOIN meters m ON s.id = m.site_id
    INNER JOIN meter_readings mr ON m.id = mr.meter_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY s.name, m.name, mr.timestamp DESC
    LIMIT 10000
  `;

  const result = await db.query<DetailedRow>(query, params);

  const detailed = {
    report_type: 'detailed',
    period: {
      start_date: args.start_date,
      end_date: args.end_date,
    },
    count: result.rows.length,
    readings: result.rows.map(row => ({
      site: {
        id: row.site_id,
        name: row.site_name,
      },
      meter: {
        id: row.meter_id,
        name: row.meter_name,
        external_id: row.meter_external_id,
      },
      timestamp: row.timestamp,
      data_point: row.data_point,
      value: parseFloat(row.value as any),
      unit: row.unit,
    })),
  };

  logger.info('generate_report (detailed) completed', { count: detailed.count });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          report: detailed,
        }, null, 2),
      },
    ],
  };
}

async function generateComparisonReport(args: GenerateReportArgs) {
  const conditions: string[] = [
    'mr.timestamp >= $1',
    'mr.timestamp <= $2',
  ];
  const params: any[] = [args.start_date, args.end_date];
  let paramIndex = 3;

  if (args.site_ids && args.site_ids.length > 0) {
    conditions.push(`s.id = ANY($${paramIndex++})`);
    params.push(args.site_ids);
  }

  if (args.data_point) {
    conditions.push(`mr.data_point = $${paramIndex++}`);
    params.push(args.data_point);
  }

  const query = `
    SELECT 
      s.id as site_id,
      s.name as site_name,
      mr.data_point,
      COUNT(mr.id) as reading_count,
      MIN(mr.value) as min_value,
      MAX(mr.value) as max_value,
      AVG(mr.value) as avg_value,
      SUM(mr.value) as total_value,
      mr.unit
    FROM sites s
    INNER JOIN meters m ON s.id = m.site_id
    INNER JOIN meter_readings mr ON m.id = mr.meter_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY s.id, s.name, mr.data_point, mr.unit
    ORDER BY s.name, mr.data_point
  `;

  const result = await db.query<SummaryRow>(query, params);

  // Group by data point for comparison
  const byDataPoint: Record<string, any[]> = {};
  result.rows.forEach(row => {
    if (!byDataPoint[row.data_point]) {
      byDataPoint[row.data_point] = [];
    }
    byDataPoint[row.data_point].push({
      site_id: row.site_id,
      site_name: row.site_name,
      reading_count: parseInt(row.reading_count as any, 10),
      statistics: {
        min: parseFloat(row.min_value as any),
        max: parseFloat(row.max_value as any),
        avg: parseFloat(row.avg_value as any),
        total: parseFloat(row.total_value as any),
      },
      unit: row.unit,
    });
  });

  const comparison = {
    report_type: 'comparison',
    period: {
      start_date: args.start_date,
      end_date: args.end_date,
    },
    data_points: Object.entries(byDataPoint).map(([data_point, sites]) => ({
      data_point,
      sites,
    })),
  };

  logger.info('generate_report (comparison) completed', { 
    data_points: comparison.data_points.length 
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          report: comparison,
        }, null, 2),
      },
    ],
  };
}
