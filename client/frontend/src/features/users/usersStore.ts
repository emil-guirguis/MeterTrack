// Users Entity Store

import type { User } from '../../types/auth';
import { createEntityStore, createEntityHook } from '../../store/slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../../store/middleware/apiMiddleware';

import { userService } from './userService';

// Real API service
const usersService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      const result = await userService.getUsers(params);
      return {
        items: result.items,
        total: result.total,
        hasMore: result.hasMore,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      return await userService.getUser(id);
    });
  },

  async create(data: Partial<User>) {
    return withTokenRefresh(async () => {
      return await userService.createUser(data as Partial<User> & { password: string });
    });
  },

  async update(id: string, data: Partial<User>) {
    return withTokenRefresh(async () => {
      // Handle password changes separately
      if ((data as any).password) {
        await userService.changePassword(id, (data as any).password);
        // Remove password from regular update data
        const updateData = { ...data };
        delete (updateData as any).password;
        if (Object.keys(updateData).length > 0) {
          return await userService.updateUser(id, updateData);
        }
        // If only password was changed, return the current user data
        return await userService.getUser(id);
      } else {
        return await userService.updateUser(id, data);
      }
    });
  },

  async delete(id: string) {
    return withTokenRefresh(async () => {
      await userService.deleteUser(id);
    });
  },
};

// Create users store
export const useUsersStore = createEntityStore(usersService, {
  name: 'users',
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
});

// Create users hook
export const useUsers = createEntityHook(useUsersStore);

// Enhanced users hook with additional functionality
export const useUsersEnhanced = () => {
  const users = useUsers();
  
  return {
    ...users,
    
    // Additional computed values
    // activeUsers: users.items.filter(user => user.active),
    // inactiveUsers: users.items.filter(user => user.active ),
    // adminUsers: users.items.filter(user => user.role === 'admin'),
    
    // Enhanced actions with notifications
    createUser: async (data: Partial<User>) => {
      return withApiCall(
        () => users.createItem(data),
        {
          loadingKey: 'createUser',
          showSuccessNotification: true,
          successMessage: 'User created successfully',
        }
      );
    },
    
    updateUser: async (id: string, data: Partial<User>) => {
      return withApiCall(
        () => users.updateItem(id, data),
        {
          loadingKey: 'updateUser',
          showSuccessNotification: true,
          successMessage: 'User updated successfully',
        }
      );
    },
    
    deleteUser: async (id: string) => {
      return withApiCall(
        () => users.deleteItem(id),
        {
          loadingKey: 'deleteUser',
          showSuccessNotification: true,
          successMessage: 'User deleted successfully',
        }
      );
    },
    
    // Bulk operations
    bulkUpdateStatus: async (userIds: string[], status: 'active' | 'inactive') => {
      return withApiCall(
        async () => {
          const promises = userIds.map(id => users.updateItem(id, { status }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateUsers',
          showSuccessNotification: true,
          successMessage: `${userIds.length} users updated successfully`,
        }
      );
    },
    
    // Search and filter helpers
    searchUsers: (query: string) => {
      users.setSearch(query);
      users.fetchItems();
    },
    
    filterByRole: (role: string) => {
      users.setFilters({ ...users.list.filters, role });
      users.fetchItems();
    },
    
    filterByStatus: (status: string) => {
      users.setFilters({ ...users.list.filters, status });
      users.fetchItems();
    },
  };
};