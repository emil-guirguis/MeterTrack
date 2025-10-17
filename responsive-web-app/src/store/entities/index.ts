// Entity Stores Index

// Export all entity stores
export * from './usersStore';
export * from './locationsStore';
export * from './equipmentStore';
export * from './contactsStore';
export * from './metersStore';
export * from './templatesStore';
export * from './settingsStore';

// Export CRUD patterns
export * from '../patterns/crudOperations';

// Create a centralized entity manager
import { useUsersStore, useUsersEnhanced } from './usersStore';
import { useLocationsStore, useLocationsEnhanced } from './locationsStore';
import { useEquipmentStore, useEquipmentEnhanced } from './equipmentStore';
import { useContactsStore, useContactsEnhanced } from './contactsStore';
import { useMetersStore, useMetersEnhanced } from './metersStore';
import { useTemplatesStore, useTemplatesEnhanced } from './templatesStore';
import { useSettingsStore, useSettingsEnhanced } from './settingsStore';
import { clearCache } from '../middleware/apiMiddleware';

// Entity manager for global operations
export const entityManager = {
  // Store references
  stores: {
    users: useUsersStore,
    locations: useLocationsStore,
    equipment: useEquipmentStore,
    contacts: useContactsStore,
    meters: useMetersStore,
    templates: useTemplatesStore,
    settings: useSettingsStore,
  },

  // Enhanced hooks
  hooks: {
    users: useUsersEnhanced,
    locations: useLocationsEnhanced,
    equipment: useEquipmentEnhanced,
    contacts: useContactsEnhanced,
    meters: useMetersEnhanced,
    templates: useTemplatesEnhanced,
    settings: useSettingsEnhanced,
  },

  // Global operations
  clearAllCaches: () => {
    clearCache();
  },

  resetAllStores: () => {
    useUsersStore.getState().reset();
    useLocationsStore.getState().reset();
    useEquipmentStore.getState().reset();
    useContactsStore.getState().reset();
    useMetersStore.getState().reset();
    useTemplatesStore.getState().reset();
    useSettingsStore.getState().reset();
  },

  // Bulk operations across entities
  refreshAll: async () => {
    const promises = [
      useUsersStore.getState().fetchItems(),
      useLocationsStore.getState().fetchItems(),
      useEquipmentStore.getState().fetchItems(),
      useContactsStore.getState().fetchItems(),
      useMetersStore.getState().fetchItems(),
      useTemplatesStore.getState().fetchItems(),
      useSettingsStore.getState().fetchSettings(),
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error refreshing all stores:', error);
      throw error;
    }
  },

  // Get loading state across all entities
  getGlobalLoadingState: () => {
    const usersLoading = useUsersStore.getState().loading || useUsersStore.getState().list.loading;
    const locationsLoading = useLocationsStore.getState().loading || useLocationsStore.getState().list.loading;
    const equipmentLoading = useEquipmentStore.getState().loading || useEquipmentStore.getState().list.loading;
    const contactsLoading = useContactsStore.getState().loading || useContactsStore.getState().list.loading;
    const metersLoading = useMetersStore.getState().loading || useMetersStore.getState().list.loading;
    const templatesLoading = useTemplatesStore.getState().loading || useTemplatesStore.getState().list.loading;
    const settingsLoading = useSettingsStore.getState().loading;

    return {
      isLoading: usersLoading || locationsLoading || equipmentLoading || contactsLoading || metersLoading || templatesLoading || settingsLoading,
      users: usersLoading,
      locations: locationsLoading,
      equipment: equipmentLoading,
      contacts: contactsLoading,
      meters: metersLoading,
      templates: templatesLoading,
      settings: settingsLoading,
    };
  },

  // Get error state across all entities
  getGlobalErrorState: () => {
    const usersError = useUsersStore.getState().error || useUsersStore.getState().list.error;
    const locationsError = useLocationsStore.getState().error || useLocationsStore.getState().list.error;
    const equipmentError = useEquipmentStore.getState().error || useEquipmentStore.getState().list.error;
    const contactsError = useContactsStore.getState().error || useContactsStore.getState().list.error;
    const metersError = useMetersStore.getState().error || useMetersStore.getState().list.error;
    const templatesError = useTemplatesStore.getState().error || useTemplatesStore.getState().list.error;
    const settingsError = useSettingsStore.getState().error;

    return {
      hasError: !!(usersError || locationsError || equipmentError || contactsError || metersError || templatesError || settingsError),
      users: usersError,
      locations: locationsError,
      equipment: equipmentError,
      contacts: contactsError,
      meters: metersError,
      templates: templatesError,
      settings: settingsError,
    };
  },

  // Statistics across all entities
  getGlobalStats: () => {
    const usersState = useUsersStore.getState();
    const locationsState = useLocationsStore.getState();
    const equipmentState = useEquipmentStore.getState();
    const contactsState = useContactsStore.getState();
    const metersState = useMetersStore.getState();
    const templatesState = useTemplatesStore.getState();
    const settingsState = useSettingsStore.getState();

    return {
      totalUsers: usersState.total,
      totalLocations: locationsState.total,
      totalEquipment: equipmentState.total,
      totalContacts: contactsState.total,
      totalMeters: metersState.total,
      totalTemplates: templatesState.total,
      activeUsers: usersState.items.filter(u => u.status === 'active').length,
      activeLocations: locationsState.items.filter(b => b.status === 'active').length,
      operationalEquipment: equipmentState.items.filter(e => e.status === 'operational').length,
      activeContacts: contactsState.items.filter(c => c.status === 'active').length,
      activeMeters: metersState.items.filter(m => m.status === 'active').length,
      activeTemplates: templatesState.items.filter(t => t.status === 'active').length,
      lastUpdated: Math.max(
        usersState.lastFetch || 0,
        locationsState.lastFetch || 0,
        equipmentState.lastFetch || 0,
        contactsState.lastFetch || 0,
        metersState.lastFetch || 0,
        templatesState.lastFetch || 0,
        settingsState.lastFetch || 0
      ),
    };
  },
};

// Hook for global entity state
export const useEntityManager = () => {
  const usersState = useUsersStore();
  const locationsState = useLocationsStore();
  const equipmentState = useEquipmentStore();
  const contactsState = useContactsStore();
  const metersState = useMetersStore();
  const templatesState = useTemplatesStore();
  const settingsState = useSettingsStore();

  return {
    // Individual states
    users: usersState,
    locations: locationsState,
    equipment: equipmentState,
    contacts: contactsState,
    meters: metersState,
    templates: templatesState,
    settings: settingsState,

    // Global operations
    ...entityManager,

    // Computed global state
    globalLoading: entityManager.getGlobalLoadingState(),
    globalError: entityManager.getGlobalErrorState(),
    globalStats: entityManager.getGlobalStats(),
  };
};

// Entity type registry for dynamic operations
export const entityRegistry = {
  users: {
    store: useUsersStore,
    hook: useUsersEnhanced,
    name: 'User',
    pluralName: 'Users',
  },
  locations: {
    store: useLocationsStore,
    hook: useLocationsEnhanced,
    name: 'Location',
    pluralName: 'Locations',
  },
  equipment: {
    store: useEquipmentStore,
    hook: useEquipmentEnhanced,
    name: 'Equipment',
    pluralName: 'Equipment',
  },
  contacts: {
    store: useContactsStore,
    hook: useContactsEnhanced,
    name: 'Contact',
    pluralName: 'Contacts',
  },
  meters: {
    store: useMetersStore,
    hook: useMetersEnhanced,
    name: 'Meter',
    pluralName: 'Meters',
  },
  templates: {
    store: useTemplatesStore,
    hook: useTemplatesEnhanced,
    name: 'Template',
    pluralName: 'Templates',
  },
} as const;

export type EntityType = keyof typeof entityRegistry;

// Generic entity operations that work with any registered entity
export const createGenericEntityOperations = <T extends EntityType>(entityType: T) => {
  const config = entityRegistry[entityType];
  
  return {
    getStore: () => config.store,
    useHook: config.hook,
    getName: () => config.name,
    getPluralName: () => config.pluralName,
    
    // Generic operations
    fetchAll: () => config.store.getState().fetchItems(),
    create: (data: any) => config.store.getState().createItem(data),
    update: (id: string, data: any) => config.store.getState().updateItemById(id, data),
    delete: (id: string) => config.store.getState().deleteItem(id),
    reset: () => config.store.getState().reset(),
  };
};