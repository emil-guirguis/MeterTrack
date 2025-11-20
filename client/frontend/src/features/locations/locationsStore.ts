/**
 * Locations Store - Consolidated
 * 
 * Combines API service and state management for locations.
 */

import type { Location, LocationCreateRequest, LocationUpdateRequest, ListParams, ListResponse, ApiResponse } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../../store/slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../../store/middleware/apiMiddleware';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ============================================================================
// API SERVICE (Internal)
// ============================================================================

class LocationAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getLocations(params?: ListParams): Promise<ListResponse<Location>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params?.search) searchParams.append('search', params.search);
    
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(`filter.${key}`, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/location${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<ApiResponse<ListResponse<Location>>>(endpoint);
    return response.data;
  }

  async getLocation(id: string): Promise<Location> {
    const response = await this.request<ApiResponse<Location>>(`/location/${id}`);
    return response.data;
  }

  async createLocation(data: LocationCreateRequest): Promise<Location> {
    const response = await this.request<ApiResponse<Location>>('/location', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateLocation(data: LocationUpdateRequest): Promise<Location> {
    if (!data.id) throw new Error('Location ID is required for update');
    
    const response = await this.request<ApiResponse<Location>>(`/location/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteLocation(id: string): Promise<void> {
    await this.request<ApiResponse<void>>(`/location/${id}`, {
      method: 'DELETE',
    });
  }
}

const api = new LocationAPI();

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

const locationsService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      const result = await api.getLocations(params);
      return {
        items: result.items,
        total: result.total,
        hasMore: result.page * result.pageSize < result.total,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => api.getLocation(id));
  },

  async create(data: Partial<Location>) {
    return withTokenRefresh(async () => api.createLocation(data as any));
  },

  async update(id: string, data: Partial<Location>) {
    return withTokenRefresh(async () => api.updateLocation({ id, ...data } as any));
  },

  async delete(id: string) {
    return withTokenRefresh(async () => api.deleteLocation(id));
  },
};

export const useLocationsStore = createEntityStore(locationsService, {
  name: 'locations',
  cache: {
    ttl: 10 * 60 * 1000,
    maxAge: 60 * 60 * 1000,
  },
});

export const useLocations = createEntityHook(useLocationsStore);

// ============================================================================
// ENHANCED HOOK
// ============================================================================

export const useLocationsEnhanced = () => {
  const locations = useLocations();
  
  return {
    ...locations,
    
    // Computed values
    activeLocations: locations.items.filter(location => location.status === 'active'),
    inactiveLocations: locations.items.filter(location => location.status === 'inactive'),
    officeLocations: locations.items.filter(location => location.type === 'office'),
    warehouseLocations: locations.items.filter(location => location.type === 'warehouse'),
    retailLocations: locations.items.filter(location => location.type === 'retail'),
    
    // Statistics
    totalSquareFootage: locations.items.reduce((sum, location) => sum + (location.squareFootage || 0), 0),
    totalUnits: locations.items.reduce((sum, location) => sum + (location.totalUnits || 0), 0),
    
    // Enhanced actions
    createLocation: async (data: Partial<Location>) => {
      return withApiCall(
        () => locations.createItem(data),
        {
          loadingKey: 'createLocation',
          showSuccessNotification: true,
          successMessage: 'Location created successfully',
        }
      );
    },
    
    updateLocation: async (id: string, data: Partial<Location>) => {
      return withApiCall(
        () => locations.updateItem(id, data),
        {
          loadingKey: 'updateLocation',
          showSuccessNotification: true,
          successMessage: 'Location updated successfully',
        }
      );
    },
    
    deleteLocation: async (id: string) => {
      return withApiCall(
        () => locations.deleteItem(id),
        {
          loadingKey: 'deleteLocation',
          showSuccessNotification: true,
          successMessage: 'Location deleted successfully',
        }
      );
    },
    
    // Bulk operations
    bulkUpdateStatus: async (locationIds: string[], status: string) => {
      return withApiCall(
        async () => {
          const promises = locationIds.map(id => locations.updateItem(id, { status }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateLocations',
          showSuccessNotification: true,
          successMessage: `${locationIds.length} locations updated successfully`,
        }
      );
    },
    
    // Search and filter helpers
    searchLocations: (query: string) => {
      locations.setSearch(query);
      locations.fetchItems();
    },
    
    filterByType: (type: string) => {
      locations.setFilters({ ...locations.list.filters, type });
      locations.fetchItems();
    },
    
    filterByStatus: (status: string) => {
      locations.setFilters({ ...locations.list.filters, status });
      locations.fetchItems();
    },
    
    // Location-based queries
    getLocationsByState: (state: string) => {
      return locations.items.filter(location => 
        location.address.state.toLowerCase() === state.toLowerCase()
      );
    },
    
    getLocationsByCity: (city: string) => {
      return locations.items.filter(location => 
        location.address.city.toLowerCase().includes(city.toLowerCase())
      );
    },
  };
};
