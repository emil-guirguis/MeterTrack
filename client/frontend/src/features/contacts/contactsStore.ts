/**
 * Contacts Store - Consolidated
 * 
 * Combines API service and state management for contacts.
 * Handles all contact-related data fetching, mutations, and state.
 */

import type { Contact } from './contactConfig';
import { createEntityStore, createEntityHook } from '../../store/slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../../store/middleware/apiMiddleware';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ============================================================================
// API SERVICE (Internal)
// ============================================================================

interface ContactFilters {
  search?: string;
  category?: 'customer' | 'vendor' | 'contractor' | 'technician' | 'client';
  status?: 'active' | 'inactive';
  industry?: string;
  businessType?: string;
  tag?: string;
  type?: 'customer' | 'vendor';
}

interface ContactListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: ContactFilters;
}

interface ContactListResponse {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class ContactAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAll(params: ContactListParams = {}): Promise<{ items: Contact[]; total: number; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const response = await this.request<{ data: ContactListResponse }>(`/contacts?${queryParams.toString()}`);
    const data = response.data;
    
    return {
      items: data.items,
      total: data.total,
      hasMore: data.page < data.totalPages
    };
  }

  async getById(id: string): Promise<Contact> {
    const response = await this.request<{ data: Contact }>(`/contacts/${id}`);
    return response.data;
  }

  async create(data: Partial<Contact>): Promise<Contact> {
    const response = await this.request<{ data: Contact }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async update(id: string, data: Partial<Contact>): Promise<Contact> {
    const response = await this.request<{ data: Contact }>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateStatus(contactIds: string[], status: 'active' | 'inactive'): Promise<{ modifiedCount: number }> {
    const response = await this.request<{ data: { modifiedCount: number } }>('/contacts/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify({ contactIds, status }),
    });
    return response.data;
  }
}

const api = new ContactAPI();

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

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
    return withTokenRefresh(async () => api.create(data));
  },

  async update(id: string, data: Partial<Contact>) {
    return withTokenRefresh(async () => api.update(id, data));
  },

  async delete(_id: string) {
    return withTokenRefresh(async () => api.delete(_id));
  },
};

export const useContactsStore = createEntityStore(contactsService, {
  name: 'contacts',
  cache: {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxAge: 60 * 60 * 1000, // 1 hour
  },
});

export const useContacts = createEntityHook(useContactsStore);

// ============================================================================
// ENHANCED HOOK
// ============================================================================

export const useContactsEnhanced = () => {
  const contacts = useContacts();
  
  const items = Array.isArray(contacts.items) ? contacts.items : [];
  
  return {
    ...contacts,
    items,
    
    // Computed values
    customers: items.filter(contact => contact.category === 'customer'),
    vendors: items.filter(contact => contact.category === 'vendor'),
    activeContacts: items.filter(contact => contact.active),
    inactiveContacts: items.filter(contact => !contact.active),
    
    // Enhanced actions
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
    
    // Specialized queries
    getCustomers: () => items.filter(c => c.category === 'customer'),
    getVendors: () => items.filter(c => c.category === 'vendor'),
    getContactsByTag: (tag: string) => items.filter(c => c.tags?.includes(tag)),
    getVIPContacts: () => items.filter(c => c.tags?.includes('VIP')),
  };
};
