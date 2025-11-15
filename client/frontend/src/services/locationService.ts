import type { 
  Location, 
  LocationCreateRequest, 
  LocationUpdateRequest,
  ListParams,
  ListResponse,
  ApiResponse 
} from '../types/entities';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class LocationService {
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
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all locations with optional filtering and pagination
   */
  async getLocations(params?: ListParams): Promise<ListResponse<Location>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params?.search) searchParams.append('search', params.search);
    
    // Add filters
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(`filter.${key}`, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/location${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<ApiResponse<ListResponse<Location>>>(endpoint);
    return response.data;
  }

  /**
   * Get a single location by ID
   */
  async getLocation(id: string): Promise<Location> {
    const response = await this.request<ApiResponse<Location>>(`/location/${id}`);
    return response.data;
  }

  /**
   * Create a new location
   */
  async createLocation(data: LocationCreateRequest): Promise<Location> {
    // Validate required fields
    this.validateLocationData(data);
    
    const response = await this.request<ApiResponse<Location>>('/location', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return response.data;
  }

  /**
   * Update an existing location
   */
  async updateLocation(data: LocationUpdateRequest): Promise<Location> {
    if (!data.id) {
      throw new Error('Location ID is required for update');
    }

    // Validate required fields if they are provided
    this.validateLocationData(data, true);
    
    const response = await this.request<ApiResponse<Location>>(`/location/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return response.data;
  }

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<void> {
    await this.request<ApiResponse<void>>(`/location/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Bulk update location status
   */
  async bulkUpdateStatus(
    locationIds: string[], 
    status: 'active' | 'inactive' | 'maintenance'
  ): Promise<void> {
    await this.request<ApiResponse<void>>('/location/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify({ locationIds, status }),
    });
  }

  /**
   * Get locations by status
   */
  async getLocationsByStatus(status: 'active' | 'inactive' | 'maintenance'): Promise<Location[]> {
    const response = await this.getLocations({
      filters: { status },
    });
    return response.items;
  }

  /**
   * Get locations by type
   */
  async getLocationsByType(type: string): Promise<Location[]> {
    const response = await this.getLocations({
      filters: { type },
    });
    return response.items;
  }

  /**
   * Search locations by name or address
   */
  async searchLocations(query: string): Promise<Location[]> {
    const response = await this.getLocations({
      search: query,
    });
    return response.items;
  }

  /**
   * Validate address using external geocoding service
   */
  async validateAddress(address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }): Promise<{
    isValid: boolean;
    suggestions?: Array<{
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      latitude?: number;
      longitude?: number;
    }>;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }> {
    try {
      const response = await this.request<ApiResponse<any>>('/location/validate-address', {
        method: 'POST',
        body: JSON.stringify(address),
      });
      return response.data;
    } catch (error) {
      console.warn('Address validation service unavailable:', error);
      // Return basic validation if service is unavailable
      return {
        isValid: this.basicAddressValidation(address),
      };
    }
  }

  /**
   * Get location statistics
   */
  async getLocationStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    byType: Record<string, number>;
    totalSquareFootage: number;
    averageSquareFootage: number;
  }> {
    const response = await this.request<ApiResponse<any>>('/location/stats');
    return response.data;
  }

  /**
   * Export locations to CSV
   */
  async exportLocations(params?: ListParams): Promise<Blob> {
    const searchParams = new URLSearchParams();
    
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(`filter.${key}`, value.toString());
        }
      });
    }
    
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/location/export${queryString ? `?${queryString}` : ''}`;
    
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export locations');
    }

    return response.blob();
  }

  /**
   * Private validation methods
   */
  private validateLocationData(
    data: LocationCreateRequest | LocationUpdateRequest, 
    isUpdate = false
  ): void {
    const errors: string[] = [];

    // Required fields for creation, optional for updates
    if (!isUpdate || data.name !== undefined) {
      if (!data.name?.trim()) {
        errors.push('Location name is required');
      }
    }

    if (!isUpdate || data.address !== undefined) {
      if (!data.address?.street?.trim()) {
        errors.push('Street address is required');
      }
      if (!data.address?.city?.trim()) {
        errors.push('City is required');
      }
      if (!data.address?.state?.trim()) {
        errors.push('State is required');
      }
      if (!data.address?.zipCode?.trim()) {
        errors.push('ZIP code is required');
      }
      if (!data.address?.country?.trim()) {
        errors.push('Country is required');
      }
    }

    if (!isUpdate || data.contactInfo !== undefined) {
      if (!data.contactInfo?.email?.trim()) {
        errors.push('Email is required');
      } else if (!this.isValidEmail(data.contactInfo.email)) {
        errors.push('Invalid email format');
      }
      
      if (!data.contactInfo?.phone?.trim()) {
        errors.push('Phone number is required');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private basicAddressValidation(address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }): boolean {
    // Basic validation - check if all required fields are present
    return !!(
      address.street?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.zipCode?.trim() &&
      address.country?.trim()
    );
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;