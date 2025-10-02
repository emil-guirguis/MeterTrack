// Store Utilities and Helpers

import type { EntityState, ListState, CacheConfig } from './types';

// Create initial entity state
export const createEntityState = <T>(): EntityState<T> => ({
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
  lastFetch: null,
  hasMore: true,
  total: 0,
});

// Create initial list state
export const createListState = (): ListState => ({
  page: 1,
  pageSize: 20,
  total: 0,
  search: '',
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  loading: false,
  error: null,
});

// Cache utilities
export const createCacheConfig = (overrides: Partial<CacheConfig> = {}): CacheConfig => ({
  ttl: 5 * 60 * 1000, // 5 minutes default
  maxAge: 30 * 60 * 1000, // 30 minutes max age
  staleWhileRevalidate: true,
  ...overrides,
});

// Check if cached data is fresh
export const isCacheFresh = (lastFetch: number | null, ttl: number): boolean => {
  if (!lastFetch) return false;
  return Date.now() - lastFetch < ttl;
};

// Check if cached data is stale
export const isCacheStale = (lastFetch: number | null, maxAge: number): boolean => {
  if (!lastFetch) return true;
  return Date.now() - lastFetch > maxAge;
};

// Generic entity actions creator
export const createEntityActions = <T extends { id: string }>() => ({
  setItems: (items: T[]) => ({ items, lastFetch: Date.now() }),
  
  addItem: (item: T) => (state: EntityState<T>) => ({
    items: [item, ...state.items],
    total: state.total + 1,
  }),
  
  updateItem: (id: string, updates: Partial<T>) => (state: EntityState<T>) => ({
    items: state.items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ),
    selectedItem: state.selectedItem?.id === id 
      ? { ...state.selectedItem, ...updates }
      : state.selectedItem,
  }),
  
  removeItem: (id: string) => (state: EntityState<T>) => ({
    items: state.items.filter(item => item.id !== id),
    selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
    total: Math.max(0, state.total - 1),
  }),
  
  setSelectedItem: (item: T | null) => ({ selectedItem: item }),
  
  setLoading: (loading: boolean) => ({ loading }),
  
  setError: (error: string | null) => ({ error, loading: false }),
  
  setTotal: (total: number) => ({ total }),
  
  setHasMore: (hasMore: boolean) => ({ hasMore }),
  
  setLastFetch: (timestamp: number) => ({ lastFetch: timestamp }),
  
  reset: () => createEntityState<T>(),
});

// Generic list actions creator
export const createListActions = () => ({
  setPage: (page: number) => ({ page }),
  
  setPageSize: (pageSize: number) => ({ pageSize, page: 1 }),
  
  setSearch: (search: string) => ({ search, page: 1 }),
  
  setFilters: (filters: Record<string, any>) => ({ filters, page: 1 }),
  
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => ({ 
    sortBy, 
    sortOrder, 
    page: 1 
  }),
  
  resetFilters: () => ({
    search: '',
    filters: {},
    page: 1,
  }),
  
  setLoading: (loading: boolean) => ({ loading }),
  
  setError: (error: string | null) => ({ error, loading: false }),
  
  reset: () => createListState(),
});

// Optimistic update helper
export const withOptimisticUpdate = <T extends { id: string }>(
  items: T[],
  id: string,
  updates: Partial<T>,
  rollback?: () => void
): T[] => {
  const updatedItems = items.map(item =>
    item.id === id ? { ...item, ...updates } : item
  );
  
  // Store rollback function for potential use
  if (rollback) {
    // This would be handled by the calling code
    setTimeout(() => {
      // Rollback logic would be implemented here if the API call fails
    }, 0);
  }
  
  return updatedItems;
};

// Normalize array by ID
export const normalizeById = <T extends { id: string }>(items: T[]): Record<string, T> => {
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<string, T>);
};

// Denormalize from ID map
export const denormalizeById = <T>(normalized: Record<string, T>): T[] => {
  return Object.values(normalized);
};

// Merge arrays by ID, preferring items from the second array
export const mergeArraysById = <T extends { id: string }>(
  existing: T[],
  incoming: T[]
): T[] => {
  const existingMap = normalizeById(existing);
  const incomingMap = normalizeById(incoming);
  
  const merged = { ...existingMap, ...incomingMap };
  return denormalizeById(merged);
};

// Sort array by field
export const sortByField = <T>(
  items: T[],
  field: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// Filter array by search term
export const filterBySearch = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return items;
  
  const lowercaseSearch = searchTerm.toLowerCase();
  
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowercaseSearch);
      }
      if (typeof value === 'number') {
        return value.toString().includes(lowercaseSearch);
      }
      return false;
    })
  );
};

// Apply filters to array
export const applyFilters = <T>(
  items: T[],
  filters: Record<string, any>
): T[] => {
  return items.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return true; // Skip empty filters
      }
      
      const itemValue = (item as any)[key];
      
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }
      
      if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        return itemValue >= value.min && itemValue <= value.max;
      }
      
      return itemValue === value;
    });
  });
};

// Paginate array
export const paginateArray = <T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; hasMore: boolean; total: number } => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    hasMore: endIndex < items.length,
    total: items.length,
  };
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: any;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const cloned = {} as any;
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  return obj;
};