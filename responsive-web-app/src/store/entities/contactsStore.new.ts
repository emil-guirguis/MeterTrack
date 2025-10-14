// Contacts Entity Store (Customers and Vendors)

import type { Contact } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall } from '../middleware/apiMiddleware';
import { contactService } from '../../services/contactService';

// Create a wrapper service to match the EntityService interface
const contactServiceWrapper = {
  getAll: contactService.getAll.bind(contactService),
  getById: contactService.getById.bind(contactService),
  delete: contactService.delete.bind(contactService),
  update: async (id: string, data: Partial<Contact>) => {
    return contactService.update(id, {
      id,
      ...data
    } as any);
  },
  create: async (data: Partial<Contact>) => {
    // Ensure required fields are present for ContactCreateRequest
    if (!data.type || !data.name || !data.email || !data.phone || !data.address) {
      throw new Error('Missing required fields for contact creation');
    }
    return contactService.create({
      type: data.type,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      company: data.contactPerson,
      notes: data.notes,
      businessInfo: {
        industry: data.industry,
        website: data.website
      }
    });
  }
};

// Create contacts store with wrapped service
export const useContactsStore = createEntityStore(contactServiceWrapper, {
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
          const result = await contactService.bulkUpdateStatus(contactIds, status);
          contacts.fetchItems(); // Refresh the list
          return result;
        },
        {
          loadingKey: 'bulkUpdateStatus',
          showSuccessNotification: true,
          successMessage: `${contactIds.length} contacts updated successfully`,
        }
      );
    },
    
    // Filter helpers
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