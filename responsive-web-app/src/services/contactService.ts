import type { Contact, ContactCreateRequest, ContactUpdateRequest } from '../types/entities';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface ContactFilters {
  search?: string;
  type?: 'customer' | 'vendor';
  status?: 'active' | 'inactive';
  industry?: string;
  businessType?: string;
  tag?: string;
}

export interface ContactListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: ContactFilters;
}

export interface ContactListResponse {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ContactStatsResponse {
  overview: {
    totalContacts: number;
    customers: number;
    vendors: number;
    activeContacts: number;
    inactiveContacts: number;
  };
  topIndustries: Array<{
    _id: string;
    count: number;
  }>;
}

class ContactService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
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

  // Get all contacts with filtering and pagination
  async getAll(params: ContactListParams = {}): Promise<{ items: Contact[]; total: number; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const response = await this.request<{ data: ContactListResponse }>(`/contacts?${queryParams.toString()}`);
    const data = response.data;
    
    // Transform to expected format
    return {
      items: data.items,
      total: data.total,
      hasMore: data.page < data.totalPages
    };
  }

  // Get single contact by ID
  async getById(id: string): Promise<Contact> {
    const response = await this.request<{ data: Contact }>(`/contacts/${id}`);
    return response.data;
  }

  // Create new contact
  async create(data: ContactCreateRequest): Promise<Contact> {
    const response = await this.request<{ data: Contact }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Update existing contact
  async update(id: string, data: ContactUpdateRequest): Promise<Contact> {
    const response = await this.request<{ data: Contact }>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Delete contact
  async delete(id: string): Promise<void> {
    await this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Bulk update contact status
  async bulkUpdateStatus(contactIds: string[], status: 'active' | 'inactive'): Promise<{ modifiedCount: number }> {
    const response = await this.request<{ data: { modifiedCount: number } }>('/contacts/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify({ contactIds, status }),
    });
    return response.data;
  }

  // Get contact statistics
  async getStats(): Promise<ContactStatsResponse> {
    const response = await this.request<{ data: ContactStatsResponse }>('/contacts/stats/overview');
    return response.data;
  }
}

export const contactService = new ContactService();