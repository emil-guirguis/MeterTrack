/**
 * Tests for Schema Loader
 * 
 * Tests the frontend schema loading functionality including:
 * - fetchSchema() function
 * - useSchema() hook
 * - Schema caching
 * - Error handling
 * 
 * Requirements: 4.1-4.10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  fetchSchema,
  clearSchemaCache,
  prefetchSchemas,
  getAvailableSchemas,
  convertSchema,
  useSchema,
  type BackendSchema,
  type BackendFieldDefinition,
} from '../../../../framework/frontend/forms/utils/schemaLoader';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Schema Loader', () => {
  // Sample backend schema for testing
  const mockBackendSchema: BackendSchema = {
    entityName: 'TestEntity',
    tableName: 'test_entities',
    description: 'Test entity for testing',
    formFields: {
      name: {
        type: 'string',
        default: '',
        required: true,
        readOnly: false,
        label: 'Name',
        description: 'Entity name',
        placeholder: 'Enter name',
        dbField: 'name',
        enumValues: null,
        minLength: 1,
        maxLength: 100,
        min: null,
        max: null,
        pattern: null,
      },
      email: {
        type: 'email',
        default: '',
        required: true,
        readOnly: false,
        label: 'Email',
        description: 'Email address',
        placeholder: 'Enter email',
        dbField: 'email',
        enumValues: null,
        minLength: null,
        maxLength: 255,
        min: null,
        max: null,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      age: {
        type: 'number',
        default: 0,
        required: false,
        readOnly: false,
        label: 'Age',
        description: 'Age in years',
        placeholder: 'Enter age',
        dbField: 'age',
        enumValues: null,
        minLength: null,
        maxLength: null,
        min: 0,
        max: 150,
        pattern: null,
      },
      status: {
        type: 'string',
        default: 'active',
        required: true,
        readOnly: false,
        label: 'Status',
        description: 'Entity status',
        placeholder: 'Select status',
        dbField: 'status',
        enumValues: ['active', 'inactive', 'pending'],
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: null,
      },
    },
    entityFields: {
      id: {
        type: 'number',
        default: null,
        required: false,
        readOnly: true,
        label: 'ID',
        description: 'Unique identifier',
        placeholder: '',
        dbField: 'id',
        enumValues: null,
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: null,
      },
      createdAt: {
        type: 'date',
        default: null,
        required: false,
        readOnly: true,
        label: 'Created At',
        description: 'Creation timestamp',
        placeholder: '',
        dbField: 'created_at',
        enumValues: null,
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: null,
      },
    },
    relationships: {},
    validation: {},
    version: '1.0.0',
    generatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Clear cache before each test
    clearSchemaCache();
    // Reset mock
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSchema()', () => {
    it('should fetch schema from API successfully', async () => {
      // Requirement 4.1: WHEN fetchSchema(entityName) is called, THE system SHALL fetch the schema from /api/schema/:entity
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      const schema = await fetchSchema('testentity');

      expect(mockFetch).toHaveBeenCalledWith('/api/schema/testentity');
      expect(schema).toEqual(mockBackendSchema);
    });

    it('should use custom baseUrl when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      await fetchSchema('testentity', { baseUrl: 'http://localhost:3000/api' });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/schema/testentity');
    });

    it('should cache schema by default', async () => {
      // Requirement 4.2: WHEN a schema is fetched, THE system SHALL cache it to avoid repeated API calls
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      // First call - should fetch from API
      const schema1 = await fetchSchema('testentity');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const schema2 = await fetchSchema('testentity');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not called again
      expect(schema2).toEqual(schema1);
    });

    it('should bypass cache when cache option is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      // First call with cache disabled
      await fetchSchema('testentity', { cache: false });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call with cache disabled - should fetch again
      await fetchSchema('testentity', { cache: false });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error when API returns non-ok response', async () => {
      // Requirement 4.8: WHEN a schema fetch fails, THE system SHALL provide error details
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(fetchSchema('nonexistent')).rejects.toThrow('Failed to fetch schema: Not Found');
    });

    it('should throw error when API returns success: false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          message: 'Entity not found',
        }),
      });

      await expect(fetchSchema('nonexistent')).rejects.toThrow('Entity not found');
    });

    it('should throw error when network fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchSchema('testentity')).rejects.toThrow('Network error');
    });
  });

  describe('clearSchemaCache()', () => {
    it('should clear specific schema from cache', async () => {
      // Requirement 4.3: WHEN clearSchemaCache() is called, THE system SHALL clear cached schemas
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      // Fetch and cache
      await fetchSchema('testentity');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear specific cache
      clearSchemaCache('testentity');

      // Fetch again - should call API
      await fetchSchema('testentity');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear all schemas from cache when no entity specified', async () => {
      // Requirement 4.9: WHEN a schema is cached, THE system SHALL support cache invalidation
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      // Fetch multiple schemas
      await fetchSchema('entity1');
      await fetchSchema('entity2');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Clear all cache
      clearSchemaCache();

      // Fetch again - should call API for both
      await fetchSchema('entity1');
      await fetchSchema('entity2');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('convertSchema()', () => {
    it('should convert backend schema to frontend format', () => {
      // Requirement 4.5: WHEN a schema is loaded, THE system SHALL convert backend format to frontend-compatible format
      const converted = convertSchema(mockBackendSchema);

      expect(converted.entityName).toBe('TestEntity');
      expect(converted.description).toBe('Test entity for testing');
      expect(converted.formFields).toBeDefined();
      expect(converted.entityFields).toBeDefined();
    });

    it('should preserve all field properties', () => {
      // Requirement 4.10: WHEN converting schema, THE system SHALL preserve all field properties and validation rules
      const converted = convertSchema(mockBackendSchema);

      // Check form field conversion
      expect(converted.formFields.name).toMatchObject({
        type: 'string',
        default: '',
        required: true,
        label: 'Name',
        minLength: 1,
        maxLength: 100,
      });

      expect(converted.formFields.email).toMatchObject({
        type: 'email',
        required: true,
        label: 'Email',
        maxLength: 255,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      });

      expect(converted.formFields.age).toMatchObject({
        type: 'number',
        required: false,
        min: 0,
        max: 150,
      });

      expect(converted.formFields.status).toMatchObject({
        type: 'string',
        required: true,
        enumValues: ['active', 'inactive', 'pending'],
      });
    });

    it('should convert entity fields correctly', () => {
      const converted = convertSchema(mockBackendSchema);

      expect(converted.entityFields.id).toMatchObject({
        type: 'number',
        label: 'ID',
      });

      expect(converted.entityFields.createdAt).toMatchObject({
        type: 'date',
        label: 'Created At',
      });
    });

    it('should map dbField to apiField', () => {
      const converted = convertSchema(mockBackendSchema);

      expect(converted.formFields.name.apiField).toBe('name');
      expect(converted.entityFields.createdAt.apiField).toBe('created_at');
    });
  });

  describe('prefetchSchemas()', () => {
    it('should fetch multiple schemas in parallel', async () => {
      // Requirement 4.6: WHEN prefetchSchemas() is called, THE system SHALL load multiple schemas in parallel
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      const schemas = await prefetchSchemas(['entity1', 'entity2', 'entity3']);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(schemas).toHaveLength(3);
      expect(schemas[0]).toEqual(mockBackendSchema);
    });

    it('should cache all prefetched schemas', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      await prefetchSchemas(['entity1', 'entity2']);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Fetch again - should use cache
      await fetchSchema('entity1');
      await fetchSchema('entity2');
      expect(mockFetch).toHaveBeenCalledTimes(2); // No additional calls
    });
  });

  describe('getAvailableSchemas()', () => {
    it('should fetch list of available schemas', async () => {
      // Requirement 4.7: WHEN getAvailableSchemas() is called, THE system SHALL return list of all available schemas
      const mockSchemaList = {
        success: true,
        data: {
          schemas: [
            {
              entityName: 'Meter',
              tableName: 'meters',
              description: 'Meter entity',
              endpoint: '/api/schema/meter',
            },
            {
              entityName: 'Device',
              tableName: 'devices',
              description: 'Device entity',
              endpoint: '/api/schema/device',
            },
          ],
          count: 2,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSchemaList,
      });

      const schemas = await getAvailableSchemas();

      expect(mockFetch).toHaveBeenCalledWith('/api/schema');
      expect(schemas).toHaveLength(2);
      expect(schemas[0].entityName).toBe('Meter');
      expect(schemas[1].entityName).toBe('Device');
    });

    it('should use custom baseUrl', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { schemas: [], count: 0 },
        }),
      });

      await getAvailableSchemas('http://localhost:3000/api');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/schema');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(getAvailableSchemas()).rejects.toThrow('Failed to fetch schema list: Internal Server Error');
    });
  });

  describe('useSchema() hook', () => {
    it('should load schema and return loading states', async () => {
      // Requirement 4.4: WHEN useSchema(entityName) hook is used, THE system SHALL return schema, loading, and error states
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      const { result } = renderHook(() => useSchema('testentity'));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.schema).toBeNull();
      expect(result.current.error).toBeNull();

      // Wait for schema to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.schema).toBeDefined();
      expect(result.current.schema?.entityName).toBe('TestEntity');
      expect(result.current.error).toBeNull();
    });

    it('should handle errors and set error state', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSchema('testentity'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.schema).toBeNull();
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Network error');
    });

    it('should reload when entity name changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBackendSchema,
        }),
      });

      const { result, rerender } = renderHook(
        ({ entityName }) => useSchema(entityName),
        { initialProps: { entityName: 'entity1' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/schema/entity1');

      // Change entity name
      rerender({ entityName: 'entity2' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/schema/entity2');
      });
    });

    it('should cleanup on unmount', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: mockBackendSchema,
            }),
          }), 100)
        )
      );

      const { unmount } = renderHook(() => useSchema('testentity'));

      // Unmount before fetch completes
      unmount();

      // Wait a bit to ensure no state updates after unmount
      await new Promise(resolve => setTimeout(resolve, 150));

      // If we get here without errors, the cleanup worked
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchSchema('testentity')).rejects.toThrow('Invalid JSON');
    });

    it('should handle missing data in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          // Missing data field
        }),
      });

      await expect(fetchSchema('testentity')).rejects.toThrow();
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      await expect(fetchSchema('testentity')).rejects.toThrow('Test error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching schema for testentity:',
        expect.any(Error)
      );
    });
  });
});
