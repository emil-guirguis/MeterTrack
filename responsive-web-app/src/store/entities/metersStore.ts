// Meters Entity Store

import type { Meter } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';
import { tokenStorage } from '../../utils/tokenStorage';

// Real API service
const metersService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params?.search) queryParams.append('search', params.search);
      
      // Apply filters
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value) queryParams.append(`filter.${key}`, value as string);
        });
      }

      const listHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const listToken = tokenStorage.getToken();
      if (listToken) listHeaders['Authorization'] = `Bearer ${listToken}`;

      const response = await fetch(`/api/meters?${queryParams.toString()}`, {
        method: 'GET',
        headers: listHeaders
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch meters');
      }

      return {
        items: data.data.items || [],
        total: data.data.pagination?.totalItems || 0,
        hasMore: data.data.pagination?.hasNextPage || false,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      const getHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const getToken = tokenStorage.getToken();
      if (getToken) getHeaders['Authorization'] = `Bearer ${getToken}`;

      const response = await fetch(`/api/meters/${id}`, {
        method: 'GET',
        headers: getHeaders
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch meter');
      }

      return data.data;
    });
  },

  async create(meterData: Partial<Meter>) {
    return withTokenRefresh(async () => {
      const createHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const createToken = tokenStorage.getToken();
      if (createToken) createHeaders['Authorization'] = `Bearer ${createToken}`;

      const response = await fetch('/api/meters', {
        method: 'POST',
        headers: createHeaders,
        body: JSON.stringify(meterData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create meter');
      }

      return data.data;
    });
  },

  async update(id: string, meterData: Partial<Meter>) {
    return withTokenRefresh(async () => {
      const updateHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const updateToken = tokenStorage.getToken();
      if (updateToken) updateHeaders['Authorization'] = `Bearer ${updateToken}`;

      const response = await fetch(`/api/meters/${id}`, {
        method: 'PUT',
        headers: updateHeaders,
        body: JSON.stringify(meterData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update meter');
      }

      return data.data;
    });
  },

  async delete(id: string) {
    return withTokenRefresh(async () => {
      const deleteHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const deleteToken = tokenStorage.getToken();
      if (deleteToken) deleteHeaders['Authorization'] = `Bearer ${deleteToken}`;

      const response = await fetch(`/api/meters/${id}`, {
        method: 'DELETE',
        headers: deleteHeaders
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete meter');
      }

      return;
    });
  },

  // Test meter connection
  async testConnection(id: string) {
    return withTokenRefresh(async () => {
      const testHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const testToken = tokenStorage.getToken();
      if (testToken) testHeaders['Authorization'] = `Bearer ${testToken}`;

      const response = await fetch(`/api/meters/${id}/test-connection`, {
        method: 'POST',
        headers: testHeaders
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    });
  },
};

// Create meters store
export const useMetersStore = createEntityStore(metersService, {
  name: 'meters',
  cache: {
    ttl: 2 * 60 * 1000, // 2 minutes (meters data changes frequently)
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
});

// Create meters hook
export const useMeters = createEntityHook(useMetersStore);

// Enhanced meters hook with additional functionality
export const useMetersEnhanced = () => {
  const meters = useMeters();
  
  return {
    ...meters,
    
    // Additional computed values
    activeMeters: meters.items.filter(meter => meter.status === 'active'),
    inactiveMeters: meters.items.filter(meter => meter.status === 'inactive'),
    maintenanceMeters: meters.items.filter(meter => meter.status === 'maintenance'),
    
    // Meters by type
    electricMeters: meters.items.filter(meter => meter.type === 'electric'),
    gasMeters: meters.items.filter(meter => meter.type === 'gas'),
    waterMeters: meters.items.filter(meter => meter.type === 'water'),
    
    // Reading quality analysis
    metersWithGoodReadings: meters.items.filter(meter => 
      meter.lastReading?.quality === 'good'
    ),
    metersWithQuestionableReadings: meters.items.filter(meter => 
      meter.lastReading?.quality === 'questionable'
    ),
    metersWithEstimatedReadings: meters.items.filter(meter => 
      meter.lastReading?.quality === 'estimated'
    ),
    
    // Communication status
    metersWithRecentReadings: meters.items.filter(meter => {
      if (!meter.lastReading?.timestamp) return false;
      const hoursSinceReading = (Date.now() - new Date(meter.lastReading.timestamp).getTime()) / (1000 * 60 * 60);
      return hoursSinceReading <= 24; // Within last 24 hours
    }),
    
    // Enhanced actions with notifications
    createMeter: async (data: Partial<Meter>) => {
      return withApiCall(
        () => meters.createItem(data),
        {
          loadingKey: 'createMeter',
          showSuccessNotification: true,
          successMessage: 'Meter created successfully',
        }
      );
    },
    
    updateMeter: async (id: string, data: Partial<Meter>) => {
      return withApiCall(
        () => meters.updateItem(id, data),
        {
          loadingKey: 'updateMeter',
          showSuccessNotification: true,
          successMessage: 'Meter updated successfully',
        }
      );
    },
    
    deleteMeter: async (id: string) => {
      return withApiCall(
        () => meters.deleteItem(id),
        {
          loadingKey: 'deleteMeter',
          showSuccessNotification: true,
          successMessage: 'Meter deleted successfully',
        }
      );
    },
    
    // Bulk operations
    bulkUpdateStatus: async (meterIds: string[], status: Meter['status']) => {
      return withApiCall(
        async () => {
          const promises = meterIds.map(id => meters.updateItem(id, { status }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateMeters',
          showSuccessNotification: true,
          successMessage: `${meterIds.length} meters updated successfully`,
        }
      );
    },
    
    // Search and filter helpers
    searchMeters: (query: string) => {
      meters.setSearch(query);
      meters.fetchItems();
    },
    
    filterByType: (type: Meter['type']) => {
      meters.setFilters({ ...meters.list.filters, type });
      meters.fetchItems();
    },
    
    filterByStatus: (status: string) => {
      meters.setFilters({ ...meters.list.filters, status });
      meters.fetchItems();
    },
    
    filterByLocation: (locationId: string) => {
      meters.setFilters({ ...meters.list.filters, locationId });
      meters.fetchItems();
    },
    
    filterByEquipment: (equipmentId: string) => {
      meters.setFilters({ ...meters.list.filters, equipmentId });
      meters.fetchItems();
    },
    
    // Meter reading operations
    updateReading: async (id: string, reading: Meter['lastReading']) => {
      return meters.updateItem(id, { lastReading: reading });
    },
    
    // Configuration operations
    updateConfiguration: async (id: string, configuration: Partial<Meter['configuration']>) => {
      const meter = meters.items.find(m => m.id === id);
      if (!meter) throw new Error('Meter not found');
      
      const updatedConfig = { ...meter.configuration, ...configuration };
      return meters.updateItem(id, { configuration: updatedConfig });
    },
    
    // Specialized queries
    getMetersByLocation: (locationId: string) =>
      meters.items.filter(m => m.locationId === locationId),
    
    getMetersByEquipment: (equipmentId: string) =>
      meters.items.filter(m => m.equipmentId === equipmentId),
    
    getMetersByType: (type: Meter['type']) =>
      meters.items.filter(m => m.type === type),
    
    // Analytics helpers
    getTotalConsumption: (type?: Meter['type']) => {
      const filteredMeters = type ? meters.items.filter(m => m.type === type) : meters.items;
      return filteredMeters.reduce((total, meter) => {
        return total + (meter.lastReading?.value || 0);
      }, 0);
    },
    
    getAverageConsumption: (type?: Meter['type']) => {
      const filteredMeters = type ? meters.items.filter(m => m.type === type) : meters.items;
      if (filteredMeters.length === 0) return 0;
      
      const total = filteredMeters.reduce((sum, meter) => {
        return sum + (meter.lastReading?.value || 0);
      }, 0);
      
      return total / filteredMeters.length;
    },
  };
};