// Contacts Entity Store (Customers and Vendors)

import type { Contact } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';

// Mock service for now - will be replaced with actual API service
const contactsService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      // Mock implementation
      const mockContacts: Contact[] = [
        {
          id: '1',
          type: 'customer',
          name: 'ABC Corporation',
          contactPerson: 'John Smith',
          email: 'john.smith@abc-corp.com',
          phone: '555-0123',
          address: {
            street: '123 Business Ave',
            city: 'Business City',
            state: 'BC',
            zipCode: '12345',
            country: 'USA',
          },
          status: 'active',
          businessType: 'Commercial',
          industry: 'Technology',
          website: 'https://abc-corp.com',
          notes: 'Long-term customer with multiple properties',
          tags: ['VIP', 'Technology'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          type: 'vendor',
          name: 'XYZ Services',
          contactPerson: 'Jane Doe',
          email: 'jane.doe@xyz-services.com',
          phone: '555-0456',
          address: {
            street: '456 Service Blvd',
            city: 'Service City',
            state: 'SC',
            zipCode: '67890',
            country: 'USA',
          },
          status: 'active',
          businessType: 'Service Provider',
          industry: 'Maintenance',
          website: 'https://xyz-services.com',
          notes: 'Reliable HVAC maintenance vendor',
          tags: ['HVAC', 'Maintenance'],
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          id: '3',
          type: 'customer',
          name: 'DEF Industries',
          contactPerson: 'Bob Johnson',
          email: 'bob.johnson@def-industries.com',
          phone: '555-0789',
          address: {
            street: '789 Industrial Way',
            city: 'Industrial City',
            state: 'IC',
            zipCode: '13579',
            country: 'USA',
          },
          status: 'active',
          businessType: 'Manufacturing',
          industry: 'Manufacturing',
          website: 'https://def-industries.com',
          notes: 'Manufacturing client with warehouse facilities',
          tags: ['Manufacturing', 'Warehouse'],
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Apply filters and pagination
      let filteredContacts = mockContacts;
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredContacts = filteredContacts.filter(contact =>
          contact.name.toLowerCase().includes(search) ||
          contact.contactPerson.toLowerCase().includes(search) ||
          contact.email.toLowerCase().includes(search) ||
          contact.industry.toLowerCase().includes(search)
        );
      }

      if (params?.filters?.type) {
        filteredContacts = filteredContacts.filter(contact => contact.type === params.filters.type);
      }

      if (params?.filters?.status) {
        filteredContacts = filteredContacts.filter(contact => contact.status === params.filters.status);
      }

      if (params?.filters?.industry) {
        filteredContacts = filteredContacts.filter(contact => 
          contact.industry.toLowerCase().includes(params.filters.industry.toLowerCase())
        );
      }

      if (params?.filters?.businessType) {
        filteredContacts = filteredContacts.filter(contact => contact.businessType === params.filters.businessType);
      }

      // Sort
      if (params?.sortBy) {
        filteredContacts.sort((a, b) => {
          let aVal = (a as any)[params.sortBy];
          let bVal = (b as any)[params.sortBy];
          
          // Handle nested properties
          if (params.sortBy.includes('.')) {
            const keys = params.sortBy.split('.');
            aVal = keys.reduce((obj: any, key: any) => obj?.[key], a);
            bVal = keys.reduce((obj: any, key: any) => obj?.[key], b);
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
      const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

      return {
        items: paginatedContacts,
        total: filteredContacts.length,
        hasMore: endIndex < filteredContacts.length,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockContact: Contact = {
        id,
        type: 'customer',
        name: `Contact ${id}`,
        contactPerson: `Person ${id}`,
        email: `contact${id}@example.com`,
        phone: '555-0000',
        address: {
          street: `${id}00 Main St`,
          city: 'Sample City',
          state: 'SC',
          zipCode: '12345',
          country: 'USA',
        },
        status: 'active',
        businessType: 'Commercial',
        industry: 'General',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return mockContact;
    });
  },

  async create(data: Partial<Contact>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const newContact: Contact = {
        id: Date.now().toString(),
        type: data.type || 'customer',
        name: data.name || '',
        contactPerson: data.contactPerson || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
        },
        status: data.status || 'active',
        businessType: data.businessType || 'Commercial',
        industry: data.industry || 'General',
        website: data.website,
        notes: data.notes || '',
        tags: data.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newContact;
    });
  },

  async update(id: string, data: Partial<Contact>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const updatedContact: Contact = {
        id,
        type: data.type || 'customer',
        name: data.name || `Contact ${id}`,
        contactPerson: data.contactPerson || `Person ${id}`,
        email: data.email || `contact${id}@example.com`,
        phone: data.phone || '555-0000',
        address: data.address || {
          street: `${id}00 Main St`,
          city: 'Sample City',
          state: 'SC',
          zipCode: '12345',
          country: 'USA',
        },
        status: data.status || 'active',
        businessType: data.businessType || 'Commercial',
        industry: data.industry || 'General',
        website: data.website,
        notes: data.notes || '',
        tags: data.tags || [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      return updatedContact;
    });
  },

  async delete(_id: string) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 400));
      // In real implementation, this would make DELETE request
    });
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