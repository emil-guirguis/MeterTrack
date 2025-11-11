// Devices Entity Store

import type { Device } from '../../types/device';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';

import { deviceService as apiDeviceService } from '../../services/deviceService';

// Real API service wrapper
const deviceService = {
  async getAll(): Promise<{ items: Device[]; total: number; hasMore: boolean }> {
    return withTokenRefresh(async () => {
      const items = await apiDeviceService.getAll();
      return {
        items,
        total: items.length,
        hasMore: false,
      };
    });
  },

  async getById(id: string): Promise<Device> {
    return withTokenRefresh(async () => {
      return await apiDeviceService.getById(id);
    });
  },

  async create(data: Partial<Device>): Promise<Device> {
    return withTokenRefresh(async () => {
      return await apiDeviceService.create(data as any);
    });
  },

  async update(id: string, data: Partial<Device>): Promise<Device> {
    return withTokenRefresh(async () => {
      return await apiDeviceService.update(id, data as any);
    });
  },

  async delete(id: string): Promise<void> {
    return withTokenRefresh(async () => {
      await apiDeviceService.delete(id);
    });
  },
};

// Create device store
export const useDeviceStore = createEntityStore(deviceService, {
  name: 'devices',
  cache: {
    ttl: 10 * 60 * 1000, // 10 minutes (devices change less frequently)
    maxAge: 60 * 60 * 1000, // 1 hour
  },
});

// Create device hook
export const useDevice = createEntityHook(useDeviceStore);

// Enhanced device hook with additional functionality
export const useDevicesEnhanced = () => {
  const device = useDevice();
  
  return {
    ...device,
    
    // Additional computed values
    devicesByManufacturer : (manufacturer: string) => 
      device.items.filter(d => d.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())),
    
    devicesByModel: (model: string) => 
      device.items.filter(d => d.model_number?.toLowerCase().includes(model.toLowerCase())),
    
    // Statistics
    totalDevices: device.items.length,
    uniqueManufacturers: [...new Set(device.items.map(d => d.manufacturer))].length,
    
    // Enhanced actions with notifications
    createDevice: async (data: Partial<Device>) => {
      return withApiCall(
        () => device.createItem(data),
        {
          loadingKey: 'createDevice',
          showSuccessNotification: true,
          successMessage: 'Device created successfully',
        }
      );
    },
    
    updateDevice: async (id: string, data: Partial<Device>) => {
      return withApiCall(
        () => device.updateItem(id, data),
        {
          loadingKey: 'updateDevice',
          showSuccessNotification: true,
          successMessage: 'Device updated successfully',
        }
      );
    },
    
    deleteDevice: async (id: string) => {
      return withApiCall(
        () => device.deleteItem(id),
        {
          loadingKey: 'deleteDevice',
          showSuccessNotification: true,
          successMessage: 'Device deleted successfully',
        }
      );
    },
    
    // Bulk operations
    bulkDelete: async (deviceIds: string[]) => {
      return withApiCall(
        async () => {
          const promises = deviceIds.map(id => device.deleteItem(id));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkDeleteDevices',
          showSuccessNotification: true,
          successMessage: `${deviceIds.length} device(s) deleted successfully`,
        }
      );
    },
    
    // Search and filter helpers
    searchDevices: (query: string) => {
      device.setSearch(query);
      device.fetchItems();
    },
    
    filterBymanufacturer: (manufacturer: string) => {
      device.setFilters({ ...device.list.filters, manufacturer });
      device.fetchItems();
    },
  };
};