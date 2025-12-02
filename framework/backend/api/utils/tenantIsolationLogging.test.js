/**
 * Tests for Tenant Isolation Logging Utilities
 * 
 * Tests the logging functions for tenant isolation events and violations
 */

const {
  logCrossTenantAccessAttempt,
  logQueryExecutionFailure,
  logTenantIsolationViolation,
  logTenantContextEstablished,
  logTenantOwnershipVerification,
  logQueryFilterApplication,
  logAuditTrail
} = require('./tenantIsolationLogging');

// Mock console methods
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

let warnCalls = [];
let errorCalls = [];
let logCalls = [];

beforeEach(() => {
  warnCalls = [];
  errorCalls = [];
  logCalls = [];

  console.warn = jest.fn((message, context) => {
    warnCalls.push({ message, context });
  });

  console.error = jest.fn((message, context) => {
    errorCalls.push({ message, context });
  });

  console.log = jest.fn((message, context) => {
    logCalls.push({ message, context });
  });
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
  console.log = originalLog;
});

describe('Tenant Isolation Logging', () => {
  describe('logCrossTenantAccessAttempt', () => {
    it('should log cross-tenant access attempt with all required fields', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        resourceId: 'resource-456',
        resourceTenantId: 'tenant-2',
        resourceType: 'meter',
        operation: 'READ',
        path: '/api/meters/456',
        method: 'GET',
        ip: '192.168.1.1'
      };

      logCrossTenantAccessAttempt(options);

      expect(warnCalls.length).toBe(1);
      const call = warnCalls[0];
      expect(call.message).toContain('SECURITY');
      expect(call.message).toContain('Cross-tenant access attempt');
      expect(call.context.userId).toBe('user-123');
      expect(call.context.userTenantId).toBe('tenant-1');
      expect(call.context.resourceId).toBe('resource-456');
      expect(call.context.resourceTenantId).toBe('tenant-2');
      expect(call.context.violationType).toBe('CROSS_TENANT_ACCESS');
    });

    it('should include additional context when provided', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        resourceId: 'resource-456',
        resourceTenantId: 'tenant-2',
        resourceType: 'meter',
        operation: 'UPDATE',
        path: '/api/meters/456',
        method: 'PUT',
        ip: '192.168.1.1',
        additionalContext: {
          reason: 'unauthorized_access',
          severity: 'high'
        }
      };

      logCrossTenantAccessAttempt(options);

      expect(warnCalls.length).toBe(1);
      const call = warnCalls[0];
      expect(call.context.reason).toBe('unauthorized_access');
      expect(call.context.severity).toBe('high');
    });
  });

  describe('logQueryExecutionFailure', () => {
    it('should log query execution failure with required fields', () => {
      const options = {
        userId: 'user-123',
        query: 'SELECT * FROM meters',
        operation: 'SELECT',
        path: '/api/meters',
        method: 'GET',
        ip: '192.168.1.1',
        reason: 'missing_tenant_id'
      };

      logQueryExecutionFailure(options);

      expect(errorCalls.length).toBe(1);
      const call = errorCalls[0];
      expect(call.message).toContain('SECURITY');
      expect(call.message).toContain('Query execution prevented');
      expect(call.context.userId).toBe('user-123');
      expect(call.context.operation).toBe('SELECT');
      expect(call.context.reason).toBe('missing_tenant_id');
      expect(call.context.violationType).toBe('QUERY_EXECUTION_FAILURE');
    });

    it('should not include query in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const options = {
        userId: 'user-123',
        query: 'SELECT * FROM meters WHERE id = 1',
        operation: 'SELECT',
        path: '/api/meters',
        method: 'GET',
        ip: '192.168.1.1',
        reason: 'missing_tenant_id'
      };

      logQueryExecutionFailure(options);

      expect(errorCalls.length).toBe(1);
      const call = errorCalls[0];
      expect(call.context.query).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should include query in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const options = {
        userId: 'user-123',
        query: 'SELECT * FROM meters WHERE id = 1',
        operation: 'SELECT',
        path: '/api/meters',
        method: 'GET',
        ip: '192.168.1.1',
        reason: 'missing_tenant_id'
      };

      logQueryExecutionFailure(options);

      expect(errorCalls.length).toBe(1);
      const call = errorCalls[0];
      expect(call.context.query).toBe('SELECT * FROM meters WHERE id = 1');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logTenantIsolationViolation', () => {
    it('should log tenant isolation violation with required fields', () => {
      const options = {
        violationType: 'MISSING_TENANT_CONTEXT',
        userId: 'user-123',
        userTenantId: 'tenant-1',
        message: 'Missing tenant context in request',
        path: '/api/meters',
        method: 'GET',
        ip: '192.168.1.1'
      };

      logTenantIsolationViolation(options);

      expect(warnCalls.length).toBe(1);
      const call = warnCalls[0];
      expect(call.message).toContain('SECURITY');
      expect(call.context.violationType).toBe('MISSING_TENANT_CONTEXT');
      expect(call.context.userId).toBe('user-123');
    });
  });

  describe('logTenantContextEstablished', () => {
    it('should log successful tenant context establishment', () => {
      const options = {
        userId: 'user-123',
        tenantId: 'tenant-1',
        path: '/api/meters',
        method: 'GET'
      };

      logTenantContextEstablished(options);

      expect(logCalls.length).toBe(1);
      const call = logCalls[0];
      expect(call.message).toContain('Tenant context established');
      expect(call.context.userId).toBe('user-123');
      expect(call.context.tenantId).toBe('tenant-1');
    });
  });

  describe('logTenantOwnershipVerification', () => {
    it('should log successful tenant ownership verification', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        resourceId: 'resource-456',
        resourceType: 'meter',
        isOwned: true,
        path: '/api/meters/456',
        method: 'GET'
      };

      logTenantOwnershipVerification(options);

      expect(logCalls.length).toBe(1);
      const call = logCalls[0];
      expect(call.message).toContain('Tenant ownership verified');
      expect(call.context.isOwned).toBe(true);
    });

    it('should log failed tenant ownership verification', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        resourceId: 'resource-456',
        resourceType: 'meter',
        isOwned: false,
        path: '/api/meters/456',
        method: 'GET'
      };

      logTenantOwnershipVerification(options);

      expect(warnCalls.length).toBe(1);
      const call = warnCalls[0];
      expect(call.message).toContain('SECURITY');
      expect(call.message).toContain('Tenant ownership verification failed');
      expect(call.context.isOwned).toBe(false);
    });
  });

  describe('logQueryFilterApplication', () => {
    it('should log successful query filter application', () => {
      const options = {
        userId: 'user-123',
        tenantId: 'tenant-1',
        operation: 'SELECT',
        table: 'meters',
        success: true
      };

      logQueryFilterApplication(options);

      expect(logCalls.length).toBe(1);
      const call = logCalls[0];
      expect(call.message).toContain('Query filter applied');
      expect(call.context.success).toBe(true);
    });

    it('should log failed query filter application', () => {
      const options = {
        userId: 'user-123',
        tenantId: 'tenant-1',
        operation: 'SELECT',
        table: 'meters',
        success: false,
        reason: 'invalid_query_format'
      };

      logQueryFilterApplication(options);

      expect(errorCalls.length).toBe(1);
      const call = errorCalls[0];
      expect(call.message).toContain('Query filter application failed');
      expect(call.context.success).toBe(false);
      expect(call.context.reason).toBe('invalid_query_format');
    });
  });

  describe('logAuditTrail', () => {
    it('should log audit trail with success status', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        action: 'READ',
        resourceType: 'meter',
        resourceId: 'resource-456',
        resourceTenantId: 'tenant-1',
        status: 'SUCCESS',
        path: '/api/meters/456',
        method: 'GET',
        ip: '192.168.1.1'
      };

      logAuditTrail(options);

      expect(logCalls.length).toBe(1);
      const call = logCalls[0];
      expect(call.message).toContain('AUDIT');
      expect(call.context.auditType).toBe('TENANT_ISOLATION_AUDIT');
      expect(call.context.status).toBe('SUCCESS');
    });

    it('should log audit trail with denied status', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        action: 'UPDATE',
        resourceType: 'meter',
        resourceId: 'resource-456',
        resourceTenantId: 'tenant-2',
        status: 'DENIED',
        path: '/api/meters/456',
        method: 'PUT',
        ip: '192.168.1.1'
      };

      logAuditTrail(options);

      expect(warnCalls.length).toBe(1);
      const call = warnCalls[0];
      expect(call.message).toContain('AUDIT');
      expect(call.context.status).toBe('DENIED');
    });

    it('should log audit trail with failed status', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        action: 'DELETE',
        resourceType: 'meter',
        resourceId: 'resource-456',
        resourceTenantId: 'tenant-1',
        status: 'FAILED',
        path: '/api/meters/456',
        method: 'DELETE',
        ip: '192.168.1.1'
      };

      logAuditTrail(options);

      expect(warnCalls.length).toBe(1);
      const call = warnCalls[0];
      expect(call.message).toContain('AUDIT');
      expect(call.context.status).toBe('FAILED');
    });

    it('should include additional context in audit trail', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        action: 'CREATE',
        resourceType: 'meter',
        resourceId: 'resource-789',
        resourceTenantId: 'tenant-1',
        status: 'SUCCESS',
        path: '/api/meters',
        method: 'POST',
        ip: '192.168.1.1',
        additionalContext: {
          meterType: 'electric',
          location: 'building-a'
        }
      };

      logAuditTrail(options);

      expect(logCalls.length).toBe(1);
      const call = logCalls[0];
      expect(call.context.meterType).toBe('electric');
      expect(call.context.location).toBe('building-a');
    });
  });

  describe('Default values', () => {
    it('should use default values when options are minimal', () => {
      const options = {
        userId: 'user-123'
      };

      logTenantIsolationViolation(options);

      expect(warnCalls.length).toBe(1);
      const call = warnCalls[0];
      expect(call.context.violationType).toBe('UNKNOWN');
      expect(call.context.userTenantId).toBe('unknown');
      expect(call.context.path).toBe('unknown');
      expect(call.context.method).toBe('UNKNOWN');
    });

    it('should handle missing optional fields gracefully', () => {
      const options = {
        userId: 'user-123',
        userTenantId: 'tenant-1',
        resourceId: 'resource-456',
        resourceTenantId: 'tenant-2',
        resourceType: 'meter',
        operation: 'READ'
      };

      logCrossTenantAccessAttempt(options);

      expect(warnCalls.length).toBe(1);
      const call = warnCalls[0];
      expect(call.context.path).toBe('unknown');
      expect(call.context.method).toBe('UNKNOWN');
      expect(call.context.ip).toBe('unknown');
    });
  });

  describe('Timestamp inclusion', () => {
    it('should include timestamp in all log calls', () => {
      const options = {
        userId: 'user-123',
        tenantId: 'tenant-1'
      };

      logTenantContextEstablished(options);

      expect(logCalls.length).toBe(1);
      const call = logCalls[0];
      expect(call.context.timestamp).toBeDefined();
      expect(typeof call.context.timestamp).toBe('string');
      // Verify it's a valid ISO timestamp
      expect(new Date(call.context.timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
