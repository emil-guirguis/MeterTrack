// Generic Entity Store Creator

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { EntityStoreSlice, CacheConfig } from '../types';
import { 
  createEntityState, 
  createListState, 
  isCacheFresh,
  createCacheConfig,
} from '../utils';

// Generic service interface
export interface EntityService<T> {
  getAll: (params?: any) => Promise<{ items: T[]; total: number; hasMore: boolean }>;
  getById: (id: string) => Promise<T>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

// Create entity store
export const createEntityStore = <T extends { id: string }>(
  service: EntityService<T>,
  options: {
    name: string;
    cache?: Partial<CacheConfig>;
  }
) => {
  const cacheConfig = createCacheConfig(options.cache);

  return create<EntityStoreSlice<T>>()(
    immer((set, get) => ({
      // Initial state
      ...createEntityState<T>(),
      list: createListState(),

      // Entity actions
      setItems: (items) => {
        set((state) => {
          state.items = items as any;
        });
      },

      addItem: (item) => {
        set((state) => {
          state.items.unshift(item as any);
          state.total += 1;
        });
      },

      updateItem: (id, updates) => {
        set((state) => {
          const index = state.items.findIndex(item => item.id === id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updates } as any;
          }
          if (state.selectedItem?.id === id) {
            state.selectedItem = { ...state.selectedItem, ...updates } as any;
          }
        });
      },

      removeItem: (id) => {
        set((state) => {
          state.items = state.items.filter(item => item.id !== id) as any;
          state.total = Math.max(0, state.total - 1);
          if (state.selectedItem?.id === id) {
            state.selectedItem = null;
          }
        });
      },

      setSelectedItem: (item) => {
        set((state) => {
          state.selectedItem = item as any;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.loading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      setTotal: (total) => {
        set((state) => {
          state.total = total;
        });
      },

      setHasMore: (hasMore) => {
        set((state) => {
          state.hasMore = hasMore;
        });
      },

      setLastFetch: (timestamp) => {
        set((state) => {
          state.lastFetch = timestamp;
        });
      },

      reset: () => {
        set((state) => {
          const initialState = createEntityState<T>();
          state.items = initialState.items as any;
          state.selectedItem = initialState.selectedItem as any;
          state.loading = initialState.loading;
          state.error = initialState.error;
          state.lastFetch = initialState.lastFetch;
          state.hasMore = initialState.hasMore;
          state.total = initialState.total;
          
          const initialListState = createListState();
          state.list.page = initialListState.page;
          state.list.pageSize = initialListState.pageSize;
          state.list.total = initialListState.total;
          state.list.search = initialListState.search;
          state.list.filters = initialListState.filters;
          state.list.sortBy = initialListState.sortBy;
          state.list.sortOrder = initialListState.sortOrder;
          state.list.loading = initialListState.loading;
          state.list.error = initialListState.error;
        });
      },

      // List actions - these are added as methods to the store
      setPage: (page) => {
        set((state) => {
          state.list.page = page;
        });
      },

      setPageSize: (pageSize) => {
        set((state) => {
          state.list.pageSize = pageSize;
          state.list.page = 1; // Reset to first page
        });
      },

      setSearch: (search) => {
        set((state) => {
          state.list.search = search;
          state.list.page = 1; // Reset to first page
        });
      },

      setFilters: (filters) => {
        set((state) => {
          state.list.filters = filters;
          state.list.page = 1; // Reset to first page
        });
      },

      setSorting: (sortBy, sortOrder) => {
        set((state) => {
          state.list.sortBy = sortBy;
          state.list.sortOrder = sortOrder;
        });
      },

      resetFilters: () => {
        set((state) => {
          state.list.search = '';
          state.list.filters = {};
          state.list.page = 1;
        });
      },

      setListLoading: (loading) => {
        set((state) => {
          state.list.loading = loading;
        });
      },

      setListError: (error) => {
        set((state) => {
          state.list.error = error;
        });
      },

      resetList: () => {
        set((state) => {
          const initialListState = createListState();
          state.list.page = initialListState.page;
          state.list.pageSize = initialListState.pageSize;
          state.list.total = initialListState.total;
          state.list.search = initialListState.search;
          state.list.filters = initialListState.filters;
          state.list.sortBy = initialListState.sortBy;
          state.list.sortOrder = initialListState.sortOrder;
          state.list.loading = initialListState.loading;
          state.list.error = initialListState.error;
        });
      },

      // API actions
      fetchItems: async (params) => {
        const state = get();
        
        // Check cache freshness
        if (isCacheFresh(state.lastFetch, cacheConfig.ttl) && !params) {
          return; // Use cached data
        }

        set((state) => {
          state.list.loading = true;
          state.list.error = null;
        });

        try {
          const queryParams = params || {
            page: state.list.page,
            pageSize: state.list.pageSize,
            search: state.list.search,
            filters: state.list.filters,
            sortBy: state.list.sortBy,
            sortOrder: state.list.sortOrder,
          };

          const response = await service.getAll(queryParams);

          set((state) => {
            state.items = response.items as any;
            state.total = response.total;
            state.hasMore = response.hasMore;
            state.lastFetch = Date.now();
            state.list.loading = false;
            state.list.error = null;
            state.list.total = response.total;
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch items';
          
          set((state) => {
            state.list.loading = false;
            state.list.error = errorMessage;
            state.error = errorMessage;
          });

          throw error;
        }
      },

      fetchItem: async (id) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const item = await service.getById(id);

          set((state) => {
            state.selectedItem = item as any;
            state.loading = false;
            state.error = null;
            
            // Update item in list if it exists
            const existingIndex = state.items.findIndex(i => i.id === id);
            if (existingIndex !== -1) {
              state.items[existingIndex] = item as any;
            }
          });

          return item;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch item';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          throw error;
        }
      },

      createItem: async (data) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const newItem = await service.create(data);

          set((state) => {
            state.items.unshift(newItem as any);
            state.total += 1;
            state.selectedItem = newItem as any;
            state.loading = false;
            state.error = null;
          });

          return newItem;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          throw error;
        }
      },

      updateItemById: async (id, data) => {
        // Optimistic update
        const state = get();
        const originalItem = state.items.find(item => item.id === id);
        
        if (originalItem) {
          set((state) => {
            const index = state.items.findIndex(item => item.id === id);
            if (index !== -1) {
              state.items[index] = { ...originalItem, ...data } as any;
            }
            if (state.selectedItem?.id === id) {
              state.selectedItem = { ...state.selectedItem, ...data } as any;
            }
          });
        }

        try {
          const updatedItem = await service.update(id, data);

          set((state) => {
            const index = state.items.findIndex(item => item.id === id);
            if (index !== -1) {
              state.items[index] = updatedItem as any;
            }
            if (state.selectedItem?.id === id) {
              state.selectedItem = updatedItem as any;
            }
            state.error = null;
          });

          return updatedItem;
        } catch (error) {
          // Rollback optimistic update
          if (originalItem) {
            set((state) => {
              const index = state.items.findIndex(item => item.id === id);
              if (index !== -1) {
                state.items[index] = originalItem as any;
              }
              if (state.selectedItem?.id === id) {
                state.selectedItem = originalItem as any;
              }
            });
          }

          const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
          
          set((state) => {
            state.error = errorMessage;
          });

          throw error;
        }
      },

      deleteItem: async (id) => {
        // Optimistic update
        const state = get();
        const originalItems = [...state.items];
        const originalTotal = state.total;
        const originalSelected = state.selectedItem;

        set((state) => {
          state.items = state.items.filter(item => item.id !== id) as any;
          state.total = Math.max(0, state.total - 1);
          if (state.selectedItem?.id === id) {
            state.selectedItem = null;
          }
        });

        try {
          await service.delete(id);
          
          set((state) => {
            state.error = null;
          });
        } catch (error) {
          // Rollback optimistic update
          set((state) => {
            state.items = originalItems as any;
            state.total = originalTotal;
            state.selectedItem = originalSelected as any;
          });

          const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
          
          set((state) => {
            state.error = errorMessage;
          });

          throw error;
        }
      },
    }))
  );
};

// Helper to create entity hook
export const createEntityHook = <T extends { id: string }>(
  store: ReturnType<typeof createEntityStore<T>>
) => {
  return () => {
    const storeState = store();
    
    return {
      // State
      items: storeState.items,
      selectedItem: storeState.selectedItem,
      loading: storeState.loading,
      error: storeState.error,
      total: storeState.total,
      hasMore: storeState.hasMore,
      list: storeState.list,
      
      // Actions
      fetchItems: storeState.fetchItems,
      fetchItem: storeState.fetchItem,
      createItem: storeState.createItem,
      updateItem: storeState.updateItemById,
      deleteItem: storeState.deleteItem,
      setSelectedItem: storeState.setSelectedItem,
      reset: storeState.reset,
      
      // List actions
      setPage: storeState.setPage,
      setPageSize: storeState.setPageSize,
      setSearch: storeState.setSearch,
      setFilters: storeState.setFilters,
      setSorting: storeState.setSorting,
      resetFilters: storeState.resetFilters,
    };
  };
};