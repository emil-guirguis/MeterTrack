import type { Device } from '../types/device';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface DeviceCreateRequest {
  type: string;
  manufacturer: string;
  description?: string;
  model_number?: string;
}

export interface DeviceUpdateRequest {
  type: string;
  manufacturer: string;
  description?: string;
  model_number?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

class DeviceService {
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
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all devices
   */
  async getAll(): Promise<Device[]> {
    const response = await this.request<ApiResponse<Device[]>>('/device');
    return response.data;
  }

  /**
   * Get device by ID
   */
  async getById(id: string): Promise<Device> {
    const response = await this.request<ApiResponse<Device>>(`/device/${id}`);
    return response.data;
  }

  /**
   * Create new device
   */
  async create(data: DeviceCreateRequest): Promise<Device> {
    const response = await this.request<ApiResponse<Device>>('/device', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Update existing device
   */
  async update(id: string, data: DeviceUpdateRequest): Promise<Device> {
    const response = await this.request<ApiResponse<Device>>(`/device/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Delete device
   */
  async delete(id: string): Promise<void> {
    await this.request<ApiResponse<void>>(`/device/${id}`, {
      method: 'DELETE',
    });
  }
}

export const deviceService = new DeviceService();
export default deviceService;
