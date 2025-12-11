/**
 * Contacts Store - Consolidated
 * 
 * Combines API service and state management for contacts.
 * Handles all contact-related data fetching, mutations, and state.
 */

import type { Contact } from './types';
import { createEntityStore, createEntityHook } from '../../store/slices/createEntitySlice';
import { withTokenRefresh } from '../../store/middleware/apiMiddleware';
import { tokenStorage } from '../../utils/tokenStorage';

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
    // Get token from tokenStorage (which is synced by authService)
    const token = tokenStorage.getToken();
    
    console.log('[ContactAPI] Making request to:', endpoint);
    console.log('[ContactAPI] Token available:', !!token);
    console.log('[ContactAPI] Token value:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      console.error('[ContactAPI] No authentication token available');
      throw new Error('No authentication token available');
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    console.log('[ContactAPI] Request headers:', config.headers);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log('[ContactAPI] Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[ContactAPI] Error response:', errorData);
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
    
    // Specialized queries
    getCustomers: () => items.filter(c => c.category === 'customer'),
    getVendors: () => items.filter(c => c.category === 'vendor'),
    getContactsByTag: (tag: string) => items.filter(c => c.tags?.includes(tag)),
    getVIPContacts: () => items.filter(c => c.tags?.includes('VIP')),
  };
};
