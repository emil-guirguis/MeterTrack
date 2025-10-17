// Locations Entity Store

import type { Location } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';

import { locationService } from '../../services/locationService';

// Real API service
const locationsService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      const result = await locationService.getLocations(params);
      return {
        items: result.items,
        total: result.total,
        hasMore: result.page * result.pageSize < result.total,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      return await locationService.getLocation(id);
    });
  },

  async create(data: Partial<Location>) {
    return withTokenRefresh(async () => {
      return await locationService.createLocation(data as any);
    });
  },

  async update(id: string, data: Partial<Location>) {
    return withTokenRefresh(async () => {
      return await locationService.updateLocation({ id, ...data } as any);
    });
  },

  async delete(id: string) {
    return withTokenRefresh(async () => {
      await locationService.deleteLocation(id);
    });
  },
};

// Create locations store
export const useLocationsStore = createEntityStore(locationsService, {
  name: 'locations',
  cache: {
    ttl: 10 * 60 * 1000, // 10 minutes (locations change less frequently)
    maxAge: 60 * 60 * 1000, // 1 hour
  },
});

// Create locations hook
export const useLocations = createEntityHook(useLocationsStore);

// Enhanced locations hook with additional functionality
export const useLocationsEnhanced = () => {
  const locations = useLocations();
  
  return {
    ...locations,
    
    // Additional computed values
    activeLocations: locations.items.filter(location => location.status === 'active'),
    inactiveLocations: locations.items.filter(location => location.status === 'inactive'),
    officeLocations: locations.items.filter(location => location.type === 'office'),
    warehouseLocations: locations.items.filter(location => location.type === 'warehouse'),
    retailLocations: locations.items.filter(location => location.type === 'retail'),
    
    // Statistics
    totalSquareFootage: locations.items.reduce((sum, location) => sum + (location.squareFootage || 0), 0),
    totalUnits: locations.items.reduce((sum, location) => sum + (location.totalUnits || 0), 0),
    averageYearBuilt: locations.items.length > 0 
      ? Math.round(locations.items.reduce((sum, location) => sum + (location.yearBuilt || 0), 0) / locations.items.length)
      : 0,
    
    // Enhanced actions with notifications
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
    bulkUpdateStatus: async (locationIds: string[], status: 'active' | 'inactive' | 'maintenance') => {
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
    
    filterByCity: (city: string) => {
      locations.setFilters({ ...locations.list.filters, city });
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