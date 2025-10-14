// Contacts Entity Store (Customers and Vendors)

import type { Contact } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';
import { contactService as api } from '../../services/contactService';

// Real API-backed service
const contactsService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => api.getAll({
      page: params?.page,
      limit: params?.pageSize,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    }));
  },

  async getById(id: string) {
    return withTokenRefresh(async () => api.getById(id));
  },

  async create(data: Partial<Contact>) {
    return withTokenRefresh(async () => api.create(data as any));
  },

  async update(id: string, data: Partial<Contact>) {
    return withTokenRefresh(async () => api.update(id, data as any));
  },

  async delete(_id: string) {
    return withTokenRefresh(async () => api.delete(_id));
  },
};

// Create contacts store
export const useContactsStore = createEntityStore(contactsService, {
  name: 'contacts',
  cache: {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxAge: 60 * 60 * 1000, // 1 hour
  },
});

// Create contacts hook
export const useContacts = createEntityHook(useContactsStore);

// Enhanced contacts hook with additional functionality
export const useContactsEnhanced = () => {
  const contacts = useContacts();
  
  return {
    ...contacts,
    
    // Additional computed values
    customers: contacts.items.filter(contact => contact.type === 'customer'),
    vendors: contacts.items.filter(contact => contact.type === 'vendor'),
    activeContacts: contacts.items.filter(contact => contact.status === 'active'),
    inactiveContacts: contacts.items.filter(contact => contact.status === 'inactive'),
    
    // Industry breakdown
    contactsByIndustry: contacts.items.reduce((acc, contact) => {
      const industry = contact.industry || 'Unknown';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Business type breakdown
    contactsByBusinessType: contacts.items.reduce((acc, contact) => {
      const type = contact.businessType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Enhanced actions with notifications
    createContact: async (data: Partial<Contact>) => {
      return withApiCall(
        () => contacts.createItem(data),
        {
          loadingKey: 'createContact',
          showSuccessNotification: true,
          successMessage: 'Contact created successfully',
        }
      );
    },
    
    updateContact: async (id: string, data: Partial<Contact>) => {
      return withApiCall(
        () => contacts.updateItem(id, data),
        {
          loadingKey: 'updateContact',
          showSuccessNotification: true,
          successMessage: 'Contact updated successfully',
        }
      );
    },
    
    deleteContact: async (id: string) => {
      return withApiCall(
        () => contacts.deleteItem(id),
        {
          loadingKey: 'deleteContact',
          showSuccessNotification: true,
          successMessage: 'Contact deleted successfully',
        }
      );
    },
    
    // Bulk operations
    bulkUpdateStatus: async (contactIds: string[], status: 'active' | 'inactive') => {
      return withApiCall(
        async () => {
          const promises = contactIds.map(id => contacts.updateItem(id, { status }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateContacts',
          showSuccessNotification: true,
          successMessage: `${contactIds.length} contacts updated successfully`,
        }
      );
    },
    
    bulkUpdateTags: async (contactIds: string[], tags: string[]) => {
      return withApiCall(
        async () => {
          const promises = contactIds.map(id => contacts.updateItem(id, { tags }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateContactTags',
          showSuccessNotification: true,
          successMessage: `Tags updated for ${contactIds.length} contacts`,
        }
      );
    },
    
    // Search and filter helpers
    searchContacts: (query: string) => {
      contacts.setSearch(query);
      contacts.fetchItems();
    },
    
    filterByType: (type: 'customer' | 'vendor') => {
      contacts.setFilters({ ...contacts.list.filters, type });
      contacts.fetchItems();
    },
    
    filterByStatus: (status: string) => {
      contacts.setFilters({ ...contacts.list.filters, status });
      contacts.fetchItems();
    },
    
    filterByIndustry: (industry: string) => {
      contacts.setFilters({ ...contacts.list.filters, industry });
      contacts.fetchItems();
    },
    
    filterByBusinessType: (businessType: string) => {
      contacts.setFilters({ ...contacts.list.filters, businessType });
      contacts.fetchItems();
    },
    
    // Specialized queries
    getCustomers: () => contacts.items.filter(c => c.type === 'customer'),
    getVendors: () => contacts.items.filter(c => c.type === 'vendor'),
    getContactsByTag: (tag: string) => 
      contacts.items.filter(c => c.tags?.includes(tag)),
    
    // Contact relationship helpers
    getContactsByIndustry: (industry: string) =>
      contacts.items.filter(c => c.industry === industry),
    
    getVIPContacts: () =>
      contacts.items.filter(c => c.tags?.includes('VIP')),
  };
};