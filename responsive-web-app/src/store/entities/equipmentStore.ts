// Equipment Entity Store

import type { Equipment } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';

// Mock service for now - will be replaced with actual API service
const equipmentService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      // Mock implementation
      const mockEquipment: Equipment[] = [
        {
          id: '1',
          name: 'HVAC Unit 1',
          type: 'HVAC',
          buildingId: '1',
          status: 'operational',
          manufacturer: 'Carrier',
          model: 'XYZ-123',
          serialNumber: 'SN001',
          installDate: new Date('2023-01-15'),
          lastMaintenance: new Date('2024-06-01'),
          nextMaintenance: new Date('2024-12-01'),
          specifications: {
            capacity: '5 tons',
            efficiency: 'SEER 16',
            refrigerant: 'R-410A',
          },
          location: 'Roof',
          notes: 'Regular maintenance required',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Generator Unit',
          type: 'Generator',
          buildingId: '2',
          status: 'operational',
          manufacturer: 'Generac',
          model: 'GEN-456',
          serialNumber: 'SN002',
          installDate: new Date('2023-03-20'),
          lastMaintenance: new Date('2024-05-15'),
          nextMaintenance: new Date('2024-11-15'),
          specifications: {
            capacity: '100kW',
            fuel: 'Natural Gas',
            voltage: '480V',
          },
          location: 'Basement',
          notes: 'Backup power system',
          createdAt: new Date('2023-03-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      // Apply filters and pagination
      let filteredEquipment = mockEquipment;
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredEquipment = filteredEquipment.filter(equipment =>
          equipment.name.toLowerCase().includes(search) ||
          equipment.type.toLowerCase().includes(search) ||
          (equipment.manufacturer && equipment.manufacturer.toLowerCase().includes(search))
        );
      }

      if (params?.filters?.type) {
        filteredEquipment = filteredEquipment.filter(equipment => equipment.type === params.filters.type);
      }

      if (params?.filters?.status) {
        filteredEquipment = filteredEquipment.filter(equipment => equipment.status === params.filters.status);
      }

      if (params?.filters?.buildingId) {
        filteredEquipment = filteredEquipment.filter(equipment => equipment.buildingId === params.filters.buildingId);
      }

      // Sort
      if (params?.sortBy) {
        filteredEquipment.sort((a, b) => {
          const aVal = (a as any)[params.sortBy];
          const bVal = (b as any)[params.sortBy];
          const order = params.sortOrder === 'desc' ? -1 : 1;
          
          if (aVal < bVal) return -1 * order;
          if (aVal > bVal) return 1 * order;
          return 0;
        });
      }

      // Paginate
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedEquipment = filteredEquipment.slice(startIndex, endIndex);

      return {
        items: paginatedEquipment,
        total: filteredEquipment.length,
        hasMore: endIndex < filteredEquipment.length,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockEquipment: Equipment = {
        id,
        name: `Equipment ${id}`,
        type: 'HVAC',
        buildingId: '1',
        status: 'operational',
        manufacturer: 'Generic',
        model: `MODEL-${id}`,
        serialNumber: `SN${id}`,
        installDate: new Date(),
        specifications: {},
        location: 'Unknown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return mockEquipment;
    });
  },

  async create(data: Partial<Equipment>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const newEquipment: Equipment = {
        id: Date.now().toString(),
        name: data.name || '',
        type: data.type || 'Other',
        buildingId: data.buildingId || '',
        status: data.status || 'operational',
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        installDate: data.installDate || new Date(),
        lastMaintenance: data.lastMaintenance,
        nextMaintenance: data.nextMaintenance,
        specifications: data.specifications || {},
        location: data.location || '',
        notes: data.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newEquipment;
    });
  },

  async update(id: string, data: Partial<Equipment>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedEquipment: Equipment = {
        id,
        name: data.name || `Equipment ${id}`,
        type: data.type || 'HVAC',
        buildingId: data.buildingId || '1',
        status: data.status || 'operational',
        manufacturer: data.manufacturer || 'Generic',
        model: data.model || `MODEL-${id}`,
        serialNumber: data.serialNumber || `SN${id}`,
        installDate: data.installDate || new Date(),
        lastMaintenance: data.lastMaintenance,
        nextMaintenance: data.nextMaintenance,
        specifications: data.specifications || {},
        location: data.location || 'Unknown',
        notes: data.notes || '',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      return updatedEquipment;
    });
  },

  async delete(_id: string) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      // In real implementation, this would make DELETE request
    });
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