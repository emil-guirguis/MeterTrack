// Equipment Entity Store

import type { Equipment } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';
import { equipmentService as api } from '../../services/equipmentService';

// Real API-backed service
const equipmentService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      const result = await api.list(params);
      return result;
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => api.get(id));
  },

  async create(data: Partial<Equipment>) {
    return withTokenRefresh(async () => api.create(data));
  },

  async update(id: string, data: Partial<Equipment>) {
    return withTokenRefresh(async () => api.update(id, data));
  },

  async delete(_id: string) {
    return withTokenRefresh(async () => api.remove(_id));
  },
};

// Create equipment store
export const useEquipmentStore = createEntityStore(equipmentService, {
  name: 'equipment',
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
});

// Create equipment hook
export const useEquipment = createEntityHook(useEquipmentStore);

// Enhanced equipment hook with additional functionality
export const useEquipmentEnhanced = () => {
  const equipment = useEquipment();
  
  return {
    ...equipment,
    
    // Additional computed values
    operationalEquipment: equipment.items.filter(eq => eq.status === 'operational'),
    maintenanceEquipment: equipment.items.filter(eq => eq.status === 'maintenance'),
    offlineEquipment: equipment.items.filter(eq => eq.status === 'offline'),
    
    // Equipment by type
    hvacEquipment: equipment.items.filter(eq => eq.type === 'HVAC'),
    generatorEquipment: equipment.items.filter(eq => eq.type === 'Generator'),
    
    // Maintenance tracking
    equipmentNeedingMaintenance: equipment.items.filter(eq => 
      eq.nextMaintenance && new Date(eq.nextMaintenance) <= new Date()
    ),
    
    // Enhanced actions with notifications
    createEquipment: async (data: Partial<Equipment>) => {
      return withApiCall(
        () => equipment.createItem(data),
        {
          loadingKey: 'createEquipment',
          showSuccessNotification: true,
          successMessage: 'Equipment created successfully',
        }
      );
    },
    
    updateEquipment: async (id: string, data: Partial<Equipment>) => {
      return withApiCall(
        () => equipment.updateItem(id, data),
        {
          loadingKey: 'updateEquipment',
          showSuccessNotification: true,
          successMessage: 'Equipment updated successfully',
        }
      );
    },
    
    deleteEquipment: async (id: string) => {
      return withApiCall(
        () => equipment.deleteItem(id),
        {
          loadingKey: 'deleteEquipment',
          showSuccessNotification: true,
          successMessage: 'Equipment deleted successfully',
        }
      );
    },
    
    // Bulk operations
    bulkUpdateStatus: async (equipmentIds: string[], status: Equipment['status']) => {
      return withApiCall(
        async () => {
          const promises = equipmentIds.map(id => equipment.updateItem(id, { status }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateEquipment',
          showSuccessNotification: true,
          successMessage: `${equipmentIds.length} equipment items updated successfully`,
        }
      );
    },
    
    // Search and filter helpers
    searchEquipment: (query: string) => {
      equipment.setSearch(query);
      equipment.fetchItems();
    },
    
    filterByType: (type: string) => {
      equipment.setFilters({ ...equipment.list.filters, type });
      equipment.fetchItems();
    },
    
    filterByStatus: (status: string) => {
      equipment.setFilters({ ...equipment.list.filters, status });
      equipment.fetchItems();
    },
    
    filterByBuilding: (buildingId: string) => {
      equipment.setFilters({ ...equipment.list.filters, buildingId });
      equipment.fetchItems();
    },
    
    // Maintenance operations
    scheduleMaintenance: async (id: string, maintenanceDate: Date) => {
      return equipment.updateItem(id, { nextMaintenance: maintenanceDate });
    },
    
    completeMaintenance: async (id: string) => {
      const now = new Date();
      const nextMaintenance = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months
      
      return equipment.updateItem(id, {
        lastMaintenance: now,
        nextMaintenance,
        status: 'operational',
      });
    },
  };
};