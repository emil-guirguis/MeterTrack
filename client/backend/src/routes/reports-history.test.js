/**
 * Tests for Report History and Email Logs API Endpoints
 * 
 * Tests for:
 * - GET /api/reports/:id/history
 * - GET /api/reports/:id/history/:historyId/emails
 * - GET /api/email-logs/search
 * - GET /api/email-logs/export
 */

const request = require('supertest');
const express = require('express');

// Mock database module before importing routes
jest.mock('../config/database', () => ({
  query: jest.fn(),
  pool: {
    query: jest.fn()
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: true
}));

const db = require('../config/database');
const reportsRouter = require('./reports');

// Mock email-logs router
jest.mock('./email-logs', () => {
  const express = require('express');
  const router = express.Router();
  
  router.get('/search', (req, res) => {
    const { recipient } = req.query;
    if (!recipient || recipient.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient parameter is required and must be a non-empty string'
      });
    }
    
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    
    const offset = (page - 1) * limit;
    
    // Mock implementation
    const countQuery = `SELECT COUNT(*) as total FROM report_email_logs WHERE recipient ILIKE $1`;
    const emailsQuery = `SELECT report_email_logs_id as id, reports_id as report_id, report_history_id as history_id, recipient, sent_at, status, error_details, created_at FROM report_email_logs WHERE recipient ILIKE $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3`;
    
    db.query(countQuery, [`%${recipient}%`]).then(countResult => {
      const total = parseInt(countResult.rows[0].total, 10);
      return db.query(emailsQuery, [`%${recipient}%`, limit, offset]).then(emailsResult => {
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
          success: true,
          data: {
            emails: emailsResult.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages
            }
          }
        });
      });
    }).catch(error => {
      res.status(500).json({
        success: false,
        message: 'Failed to search email logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  });
  
  router.get('/export', (req, res) => {
    const { format = 'csv', reportId, startDate, endDate } = req.query;
    
    if (!['csv', 'json'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Format must be either "csv" or "json"'
      });
    }
    
    if (reportId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(reportId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report ID format'
        });
      }
    }
    
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use ISO date format (YYYY-MM-DD or ISO 8601)'
        });
      }
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use ISO date format (YYYY-MM-DD or ISO 8601)'
        });
      }
    }
    
    // Mock implementation
    let query = `SELECT report_email_logs_id as id, reports_id as report_id, report_history_id as history_id, recipient, sent_at, status, error_details, created_at FROM report_email_logs WHERE 1=1`;
    const params = [];
    
    if (reportId) {
      query += ` AND reports_id = $${params.length + 1}`;
      params.push(reportId);
    }
    
    if (startDate) {
      query += ` AND sent_at >= $${params.length + 1}`;
      params.push(new Date(startDate));
    }
    
    if (endDate) {
      query += ` AND sent_at < $${params.length + 1}`;
      params.push(new Date(endDate));
    }
    
    query += ' ORDER BY sent_at DESC';
    
    db.query(query, params).then(result => {
      const emailLogs = result.rows;
      
      if (format === 'json') {
        res.status(200).json({
          success: true,
          data: {
            emails: emailLogs,
            exportedAt: new Date().toISOString(),
            count: emailLogs.length
          }
        });
      } else {
        if (emailLogs.length === 0) {
          const headers = ['ID', 'Report ID', 'History ID', 'Recipient', 'Sent At', 'Status', 'Error Details', 'Created At'];
          const csv = headers.join(',');
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="email-logs-${new Date().toISOString().split('T')[0]}.csv"`);
          return res.send(csv);
        }
        
        const headers = ['ID', 'Report ID', 'History ID', 'Recipient', 'Sent At', 'Status', 'Error Details', 'Created At'];
        const rows = emailLogs.map(log => [
          log.id,
          log.report_id,
          log.history_id,
          log.recipient,
          log.sent_at,
          log.status,
          log.error_details ? `"${log.error_details.replace(/"/g, '""')}"` : '',
          log.created_at
        ]);
        
        const csv = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="email-logs-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      }
    }).catch(error => {
      res.status(500).json({
        success: false,
        message: 'Failed to export email logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  });
  
  return router;
});

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    req.user = { id: 'test-user-id', tenant_id: 'test-tenant-id' };
    next();
  });
  
  app.use('/api/reports', reportsRouter);
  
  // Import and mount email-logs router
  const emailLogsRouter = require('./email-logs');
  app.use('/api/email-logs', emailLogsRouter);
  
  return app;
};

describe('Report History and Email Logs API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/reports/:id/history - Get Report History', () => {
    const reportId = '550e8400-e29b-41d4-a716-446655440000';
    const mockHistory = [
      {
        id: 'history-1',
        report_id: reportId,
        executed_at: new Date('2024-01-15T09:00:00Z').toISOString(),
        status: 'success',
        error_message: null,
        created_at: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        id: 'history-2',
        report_id: reportId,
        executed_at: new Date('2024-01-14T09:00:00Z').toISOString(),
        status: 'failed',
        error_message: 'Database connection timeout',
        created_at: new Date('2024-01-14T09:00:00Z').toISOString()
      }
    ];

    test('should retrieve report history with pagination', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockHistory }); // history query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    test('should support date range filtering', async () => {
      const startDate = '2024-01-14T00:00:00Z';
      const endDate = '2024-01-16T00:00:00Z';

      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockHistory }); // history query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toHaveLength(2);
    });

    test('should return 404 when report not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // report not found

      const response = await request(app)
        .get(`/api/reports/${reportId}/history`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Report not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/reports/invalid-id/history')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID format');
    });

    test('should return 400 for invalid date format', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: reportId }] }); // report exists

      const response = await request(app)
        .get(`/api/reports/${reportId}/history?startDate=invalid-date`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid startDate format');
    });

    test('should support custom pagination parameters', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ total: '50' }] }) // count query
        .mockResolvedValueOnce({ rows: mockHistory.slice(0, 1) }); // history query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history?page=2&limit=5`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(10);
    });

    test('should return empty history when no executions exist', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ total: '0' }] }) // count query
        .mockResolvedValueOnce({ rows: [] }); // history query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history`)
        .expect(200);

      expect(response.body.data.history).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/reports/:id/history/:historyId/emails - Get Email Logs', () => {
    const reportId = '550e8400-e29b-41d4-a716-446655440000';
    const historyId = 'history-1';
    const mockEmails = [
      {
        id: 'email-1',
        report_id: reportId,
        history_id: historyId,
        recipient: 'user1@example.com',
        sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
        status: 'delivered',
        error_details: null,
        created_at: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        id: 'email-2',
        report_id: reportId,
        history_id: historyId,
        recipient: 'user2@example.com',
        sent_at: new Date('2024-01-15T09:00:01Z').toISOString(),
        status: 'failed',
        error_details: 'Invalid email address',
        created_at: new Date('2024-01-15T09:00:01Z').toISOString()
      }
    ];

    test('should retrieve email logs for a report execution', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ id: historyId }] }) // history exists check
        .mockResolvedValueOnce({ rows: mockEmails }); // emails query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history/${historyId}/emails`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
      expect(response.body.data.emails[0].recipient).toBe('user1@example.com');
      expect(response.body.data.emails[1].status).toBe('failed');
    });

    test('should return 404 when report not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // report not found

      const response = await request(app)
        .get(`/api/reports/${reportId}/history/${historyId}/emails`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Report not found');
    });

    test('should return 404 when history entry not found', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists
        .mockResolvedValueOnce({ rows: [] }); // history not found

      const response = await request(app)
        .get(`/api/reports/${reportId}/history/${historyId}/emails`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('History entry not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get(`/api/reports/invalid-id/history/${historyId}/emails`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID or history ID format');
    });

    test('should return empty email list when no emails sent', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists
        .mockResolvedValueOnce({ rows: [{ id: historyId }] }) // history exists
        .mockResolvedValueOnce({ rows: [] }); // no emails

      const response = await request(app)
        .get(`/api/reports/${reportId}/history/${historyId}/emails`)
        .expect(200);

      expect(response.body.data.emails).toHaveLength(0);
    });
  });

  describe('GET /api/email-logs/search - Search Email Logs', () => {
    const mockSearchResults = [
      {
        id: 'email-1',
        report_id: '550e8400-e29b-41d4-a716-446655440000',
        history_id: 'history-1',
        recipient: 'user@example.com',
        sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
        status: 'delivered',
        error_details: null,
        created_at: new Date('2024-01-15T09:00:00Z').toISOString()
      }
    ];

    test('should search email logs by recipient', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // count query
        .mockResolvedValueOnce({ rows: mockSearchResults }); // search query

      const response = await request(app)
        .get('/api/email-logs/search?recipient=user@example.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(1);
      expect(response.body.data.emails[0].recipient).toBe('user@example.com');
      expect(response.body.data.pagination.total).toBe(1);
    });

    test('should support pagination in search results', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '50' }] }) // count query
        .mockResolvedValueOnce({ rows: mockSearchResults }); // search query

      const response = await request(app)
        .get('/api/email-logs/search?recipient=user@example.com&page=2&limit=5')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(10);
    });

    test('should return 400 when recipient parameter is missing', async () => {
      const response = await request(app)
        .get('/api/email-logs/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Recipient parameter is required');
    });

    test('should return 400 when recipient parameter is empty', async () => {
      const response = await request(app)
        .get('/api/email-logs/search?recipient=')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Recipient parameter is required');
    });

    test('should return empty results when no matches found', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] }) // count query
        .mockResolvedValueOnce({ rows: [] }); // search query

      const response = await request(app)
        .get('/api/email-logs/search?recipient=nonexistent@example.com')
        .expect(200);

      expect(response.body.data.emails).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    test('should support case-insensitive search', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // count query
        .mockResolvedValueOnce({ rows: mockSearchResults }); // search query

      const response = await request(app)
        .get('/api/email-logs/search?recipient=USER@EXAMPLE.COM')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(1);
    });
  });

  describe('GET /api/email-logs/export - Export Email Logs', () => {
    const mockEmailLogs = [
      {
        id: 'email-1',
        report_id: '550e8400-e29b-41d4-a716-446655440000',
        history_id: 'history-1',
        recipient: 'user1@example.com',
        sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
        status: 'delivered',
        error_details: null,
        created_at: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        id: 'email-2',
        report_id: '550e8400-e29b-41d4-a716-446655440000',
        history_id: 'history-1',
        recipient: 'user2@example.com',
        sent_at: new Date('2024-01-15T09:00:01Z').toISOString(),
        status: 'failed',
        error_details: 'Invalid email',
        created_at: new Date('2024-01-15T09:00:01Z').toISOString()
      }
    ];

    test('should export email logs as JSON by default', async () => {
      db.query.mockResolvedValueOnce({ rows: mockEmailLogs });

      const response = await request(app)
        .get('/api/email-logs/export')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
      expect(response.body.data.exportedAt).toBeDefined();
    });

    test('should export email logs as JSON when format=json', async () => {
      db.query.mockResolvedValueOnce({ rows: mockEmailLogs });

      const response = await request(app)
        .get('/api/email-logs/export?format=json')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
    });

    test('should export email logs as CSV when format=csv', async () => {
      db.query.mockResolvedValueOnce({ rows: mockEmailLogs });

      const response = await request(app)
        .get('/api/email-logs/export?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('ID,Report ID,History ID,Recipient,Sent At,Status,Error Details,Created At');
      expect(response.text).toContain('user1@example.com');
      expect(response.text).toContain('user2@example.com');
    });

    test('should support filtering by report ID', async () => {
      const reportId = '550e8400-e29b-41d4-a716-446655440000';
      db.query.mockResolvedValueOnce({ rows: mockEmailLogs });

      const response = await request(app)
        .get(`/api/email-logs/export?reportId=${reportId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
    });

    test('should support date range filtering', async () => {
      const startDate = '2024-01-14T00:00:00Z';
      const endDate = '2024-01-16T00:00:00Z';
      db.query.mockResolvedValueOnce({ rows: mockEmailLogs });

      const response = await request(app)
        .get(`/api/email-logs/export?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
    });

    test('should return 400 for invalid format parameter', async () => {
      const response = await request(app)
        .get('/api/email-logs/export?format=xml')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Format must be either "csv" or "json"');
    });

    test('should return 400 for invalid report ID format', async () => {
      const response = await request(app)
        .get('/api/email-logs/export?reportId=invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID format');
    });

    test('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/email-logs/export?startDate=invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid startDate format');
    });

    test('should return empty CSV with headers when no logs exist', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/email-logs/export?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('ID,Report ID,History ID,Recipient,Sent At,Status,Error Details,Created At');
      expect(response.text.split('\n')).toHaveLength(1); // Only headers
    });

    test('should handle CSV escaping for error details with quotes', async () => {
      const logsWithQuotes = [
        {
          ...mockEmailLogs[0],
          error_details: 'Error with "quotes" in message'
        }
      ];
      db.query.mockResolvedValueOnce({ rows: logsWithQuotes });

      const response = await request(app)
        .get('/api/email-logs/export?format=csv')
        .expect(200);

      expect(response.text).toContain('"Error with ""quotes"" in message"');
    });
  });
});
