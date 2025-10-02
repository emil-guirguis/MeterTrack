// Buildings Entity Store

import type { Building } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';

import { buildingService } from '../../services/buildingService';

// Real API service
const buildingsService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      const result = await buildingService.getBuildings(params);
      return {
        items: result.items,
        total: result.total,
        hasMore: result.page * result.pageSize < result.total,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      return await buildingService.getBuilding(id);
    });
  },

  async create(data: Partial<Building>) {
    return withTokenRefresh(async () => {
      return await buildingService.createBuilding(data as any);
    });
  },

  async update(id: string, data: Partial<Building>) {
    return withTokenRefresh(async () => {
      return await buildingService.updateBuilding({ id, ...data } as any);
    });
  },

  async delete(id: string) {
    return withTokenRefresh(async () => {
      await buildingService.deleteBuilding(id);
    });
  },
};

// Create buildings store
export const useBuildingsStore = createEntityStore(buildingsService, {
  name: 'buildings',
  cache: {
    ttl: 10 * 60 * 1000, // 10 minutes (buildings change less frequently)
    maxAge: 60 * 60 * 1000, // 1 hour
  },
});

// Create buildings hook
export const useBuildings = createEntityHook(useBuildingsStore);

// Enhanced buildings hook with additional functionality
export const useBuildingsEnhanced = () => {
  const buildings = useBuildings();
  
  return {
    ...buildings,
    
    // Additional computed values
    activeBuildings: buildings.items.filter(building => building.status === 'active'),
    inactiveBuildings: buildings.items.filter(building => building.status === 'inactive'),
    officeBuildings: buildings.items.filter(building => building.type === 'office'),
    warehouseBuildings: buildings.items.filter(building => building.type === 'warehouse'),
    retailBuildings: buildings.items.filter(building => building.type === 'retail'),
    
    // Statistics
    totalSquareFootage: buildings.items.reduce((sum, building) => sum + (building.squareFootage || 0), 0),
    totalUnits: buildings.items.reduce((sum, building) => sum + (building.totalUnits || 0), 0),
    averageYearBuilt: buildings.items.length > 0 
      ? Math.round(buildings.items.reduce((sum, building) => sum + (building.yearBuilt || 0), 0) / buildings.items.length)
      : 0,
    
    // Enhanced actions with notifications
    createBuilding: async (data: Partial<Building>) => {
      return withApiCall(
        () => buildings.createItem(data),
        {
          loadingKey: 'createBuilding',
          showSuccessNotification: true,
          successMessage: 'Building created successfully',
        }
      );
    },
    
    updateBuilding: async (id: string, data: Partial<Building>) => {
      return withApiCall(
        () => buildings.updateItem(id, data),
        {
          loadingKey: 'updateBuilding',
          showSuccessNotification: true,
          successMessage: 'Building updated successfully',
        }
      );
    },
    
    deleteBuilding: async (id: string) => {
      return withApiCall(
        () => buildings.deleteItem(id),
        {
          loadingKey: 'deleteBuilding',
          showSuccessNotification: true,
          successMessage: 'Building deleted successfully',
        }
      );
    },
    
    // Bulk operations
    bulkUpdateStatus: async (buildingIds: string[], status: 'active' | 'inactive' | 'maintenance') => {
      return withApiCall(
        async () => {
          const promises = buildingIds.map(id => buildings.updateItem(id, { status }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateBuildings',
          showSuccessNotification: true,
          successMessage: `${buildingIds.length} buildings updated successfully`,
        }
      );
    },
    
    // Search and filter helpers
    searchBuildings: (query: string) => {
      buildings.setSearch(query);
      buildings.fetchItems();
    },
    
    filterByType: (type: string) => {
      buildings.setFilters({ ...buildings.list.filters, type });
      buildings.fetchItems();
    },
    
    filterByStatus: (status: string) => {
      buildings.setFilters({ ...buildings.list.filters, status });
      buildings.fetchItems();
    },
    
    filterByCity: (city: string) => {
      buildings.setFilters({ ...buildings.list.filters, city });
      buildings.fetchItems();
    },
    
    // Location-based queries
    getBuildingsByState: (state: string) => {
      return buildings.items.filter(building => 
        building.address.state.toLowerCase() === state.toLowerCase()
      );
    },
    
    getBuildingsByCity: (city: string) => {
      return buildings.items.filter(building => 
        building.address.city.toLowerCase().includes(city.toLowerCase())
      );
    },
  };
};