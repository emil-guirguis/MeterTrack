/**
 * Tests for Tenant Isolation Logging Utilities
 * 
 * Tests the logging functions for tenant isolation events and violations
 */

// Mock the logger module before importing the logging utilities
jest.mock('../../../../framework/backend/shared/utils/logging', () => ({
  logWarn: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logDebug: jest.fn()
}));

const { logWarn, logError, logInfo } = require('../../../../framework/backend/shared/utils/logging');

const {
  logCrossTenantAccessAttempt,
  logQueryExecutionFailure,
  logTenantIsolationViolation,
  logTenantContextEstablished,
  logTenantOwnershipVerification,
  logQueryFilterApplication,
  logAuditTrail
} = require('../../../../framework/backend/api/utils/tenantIsolationLogging');
const { it } = require('node:test');
const { describe } = require('node:test');
const { it } = require('node:test');
const { describe } = require('node:test');
const { it } = require('node:test');
const { it } = require('node:test');
const { describe } = require('node:test');
const { it } = require('node:test');
const { it } = require('node:test');
const { describe } = require('node:test');
const { it } = require('node:test');
const { it } = require('node:test');
const { describe } = require('node:test');
const { it } = require('node:test');
const { describe } = require('node:test');
const { it } = require('node:test');
const { describe } = require('node:test');
const { it } = require('node:test');
const { describe } = require('node:test');
const { it } = require('node:test');
const { describe } = require('node:test');
const { describe } = require('node:test');
const { beforeEach } = require('node:test');

beforeEach(() => {
  jest.clearAllMocks();
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

      expect(logWarn).toHaveBeenCalled();
      const call = logWarn.mock.calls[0];
      expect(call[0]).toContain('SECURITY');
      expect(call[0]).toContain('Cross-tenant access attempt');
      expect(call[1].userId).toBe('user-123');
      expect(call[1].userTenantId).toBe('tenant-1');
      expect(call[1].resourceId).toBe('resource-456');
      expect(call[1].resourceTenantId).toBe('tenant-2');
      expect(call[1].violationType).toBe('CROSS_TENANT_ACCESS');
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

      expect(logError).toHaveBeenCalled();
      const call = logError.mock.calls[0];
      expect(call[0]).toContain('SECURITY');
      expect(call[0]).toContain('Query execution prevented');
      expect(call[2].userId).toBe('user-123');
      expect(call[2].operation).toBe('SELECT');
      expect(call[2].reason).toBe('missing_tenant_id');
      expect(call[2].violationType).toBe('QUERY_EXECUTION_FAILURE');
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

      expect(logWarn).toHaveBeenCalled();
      const call = logWarn.mock.calls[0];
      expect(call[0]).toContain('SECURITY');
      expect(call[1].violationType).toBe('MISSING_TENANT_CONTEXT');
      expect(call[1].userId).toBe('user-123');
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

      expect(logInfo).toHaveBeenCalled();
      const call = logInfo.mock.calls[0];
      expect(call[0]).toContain('Tenant context established');
      expect(call[1].userId).toBe('user-123');
      expect(call[1].tenantId).toBe('tenant-1');
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

      expect(logInfo).toHaveBeenCalled();
      const call = logInfo.mock.calls[0];
      expect(call[0]).toContain('Tenant ownership verified');
      expect(call[1].isOwned).toBe(true);
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

      expect(logWarn).toHaveBeenCalled();
      const call = logWarn.mock.calls[0];
      expect(call[0]).toContain('SECURITY');
      expect(call[0]).toContain('Tenant ownership verification failed');
      expect(call[1].isOwned).toBe(false);
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

      expect(logInfo).toHaveBeenCalled();
      const call = logInfo.mock.calls[0];
      expect(call[0]).toContain('Query filter applied');
      expect(call[1].success).toBe(true);
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

      expect(logError).toHaveBeenCalled();
      const call = logError.mock.calls[0];
      expect(call[0]).toContain('Query filter application failed');
      expect(call[2].success).toBe(false);
      expect(call[2].reason).toBe('invalid_query_format');
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

      expect(logInfo).toHaveBeenCalled();
      const call = logInfo.mock.calls[0];
      expect(call[0]).toContain('AUDIT');
      expect(call[1].auditType).toBe('TENANT_ISOLATION_AUDIT');
      expect(call[1].status).toBe('SUCCESS');
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

      expect(logWarn).toHaveBeenCalled();
      const call = logWarn.mock.calls[0];
      expect(call[0]).toContain('AUDIT');
      expect(call[1].status).toBe('DENIED');
    });
  });

  describe('Default values', () => {
    it('should use default values when options are minimal', () => {
      const options = {
        userId: 'user-123'
      };

      logTenantIsolationViolation(options);

      expect(logWarn).toHaveBeenCalled();
      const call = logWarn.mock.calls[0];
      expect(call[1].violationType).toBe('UNKNOWN');
      expect(call[1].userTenantId).toBe('unknown');
      expect(call[1].path).toBe('unknown');
      expect(call[1].method).toBe('UNKNOWN');
    });
  });

  describe('Timestamp inclusion', () => {
    it('should include timestamp in all log calls', () => {
      const options = {
        userId: 'user-123',
        tenantId: 'tenant-1'
      };

      logTenantContextEstablished(options);

      expect(logInfo).toHaveBeenCalled();
      const call = logInfo.mock.calls[0];
      expect(call[1].timestamp).toBeDefined();
      expect(typeof call[1].timestamp).toBe('string');
      expect(new Date(call[1].timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
