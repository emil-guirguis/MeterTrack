// Meters Entity Store

import type { Meter } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';

// Mock service for now - will be replaced with actual API service
const metersService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      // Mock implementation
      const mockMeters: Meter[] = [
        {
          id: '1',
          serialNumber: 'MTR001',
          type: 'electric',
          buildingId: '1',
          equipmentId: '1',
          status: 'active',
          manufacturer: 'Schneider Electric',
          model: 'ION7650',
          installDate: new Date('2023-01-15'),
          lastReading: {
            value: 12450.5,
            timestamp: new Date('2024-12-01T10:00:00Z'),
            unit: 'kWh',
            quality: 'good',
          },
          configuration: {
            readingInterval: 15, // minutes
            units: 'kWh',
            multiplier: 1,
            registers: [1, 2, 3],
            communicationProtocol: 'Modbus TCP',
            ipAddress: '192.168.1.100',
            port: 502,
          },
          location: 'Main Electrical Room',
          notes: 'Primary building meter',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          serialNumber: 'MTR002',
          type: 'gas',
          buildingId: '2',
          status: 'active',
          manufacturer: 'Honeywell',
          model: 'GAS-200',
          installDate: new Date('2023-02-20'),
          lastReading: {
            value: 8750.2,
            timestamp: new Date('2024-12-01T09:30:00Z'),
            unit: 'CCF',
            quality: 'good',
          },
          configuration: {
            readingInterval: 60, // minutes
            units: 'CCF',
            multiplier: 1,
            registers: [1],
            communicationProtocol: 'Pulse',
          },
          location: 'Gas Meter Room',
          notes: 'Natural gas consumption meter',
          createdAt: new Date('2023-02-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '3',
          serialNumber: 'MTR003',
          type: 'water',
          buildingId: '1',
          status: 'active',
          manufacturer: 'Neptune',
          model: 'T-10',
          installDate: new Date('2023-03-10'),
          lastReading: {
            value: 15680.8,
            timestamp: new Date('2024-12-01T08:00:00Z'),
            unit: 'gallons',
            quality: 'good',
          },
          configuration: {
            readingInterval: 30, // minutes
            units: 'gallons',
            multiplier: 10,
            registers: [1],
            communicationProtocol: 'AMR',
          },
          location: 'Water Meter Pit',
          notes: 'Main water supply meter',
          createdAt: new Date('2023-03-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 450));

      // Apply filters and pagination
      let filteredMeters = mockMeters;
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredMeters = filteredMeters.filter(meter =>
          meter.serialNumber.toLowerCase().includes(search) ||
          (meter.manufacturer && meter.manufacturer.toLowerCase().includes(search)) ||
          (meter.model && meter.model.toLowerCase().includes(search)) ||
          (meter.location && meter.location.toLowerCase().includes(search))
        );
      }

      if (params?.filters?.type) {
        filteredMeters = filteredMeters.filter(meter => meter.type === params.filters.type);
      }

      if (params?.filters?.status) {
        filteredMeters = filteredMeters.filter(meter => meter.status === params.filters.status);
      }

      if (params?.filters?.buildingId) {
        filteredMeters = filteredMeters.filter(meter => meter.buildingId === params.filters.buildingId);
      }

      if (params?.filters?.equipmentId) {
        filteredMeters = filteredMeters.filter(meter => meter.equipmentId === params.filters.equipmentId);
      }

      // Sort
      if (params?.sortBy) {
        filteredMeters.sort((a, b) => {
          let aVal = (a as any)[params.sortBy];
          let bVal = (b as any)[params.sortBy];
          
          // Handle nested properties
          if (params.sortBy === 'lastReading.value') {
            aVal = a.lastReading?.value || 0;
            bVal = b.lastReading?.value || 0;
          } else if (params.sortBy === 'lastReading.timestamp') {
            aVal = a.lastReading?.timestamp || new Date(0);
            bVal = b.lastReading?.timestamp || new Date(0);
          }
          
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
      const paginatedMeters = filteredMeters.slice(startIndex, endIndex);

      return {
        items: paginatedMeters,
        total: filteredMeters.length,
        hasMore: endIndex < filteredMeters.length,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockMeter: Meter = {
        id,
        serialNumber: `MTR${id}`,
        type: 'electric',
        buildingId: '1',
        status: 'active',
        manufacturer: 'Generic',
        model: `MODEL-${id}`,
        installDate: new Date(),
        configuration: {
          readingInterval: 15,
          units: 'kWh',
          multiplier: 1,
          registers: [1],
        },
        location: 'Unknown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return mockMeter;
    });
  },

  async create(data: Partial<Meter>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 650));
      
      const newMeter: Meter = {
        id: Date.now().toString(),
        serialNumber: data.serialNumber || '',
        type: data.type || 'electric',
        buildingId: data.buildingId || '',
        equipmentId: data.equipmentId,
        status: data.status || 'active',
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        installDate: data.installDate || new Date(),
        lastReading: data.lastReading,
        configuration: data.configuration || {
          readingInterval: 15,
          units: 'kWh',
          multiplier: 1,
          registers: [1],
        },
        location: data.location || '',
        notes: data.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newMeter;
    });
  },

  async update(id: string, data: Partial<Meter>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 550));
      
      const updatedMeter: Meter = {
        id,
        serialNumber: data.serialNumber || `MTR${id}`,
        type: data.type || 'electric',
        buildingId: data.buildingId || '1',
        equipmentId: data.equipmentId,
        status: data.status || 'active',
        manufacturer: data.manufacturer || 'Generic',
        model: data.model || `MODEL-${id}`,
        installDate: data.installDate || new Date(),
        lastReading: data.lastReading,
        configuration: data.configuration || {
          readingInterval: 15,
          units: 'kWh',
          multiplier: 1,
          registers: [1],
        },
        location: data.location || 'Unknown',
        notes: data.notes || '',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      return updatedMeter;
    });
  },

  async delete(_id: string) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 350));
      // In real implementation, this would make DELETE request
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
    
    filterByBuilding: (buildingId: string) => {
      meters.setFilters({ ...meters.list.filters, buildingId });
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
    getMetersByBuilding: (buildingId: string) =>
      meters.items.filter(m => m.buildingId === buildingId),
    
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