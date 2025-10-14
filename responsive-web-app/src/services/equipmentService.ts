import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { Equipment, ListParams } from '../types/entities';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class EquipmentService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async list(params?: ListParams): Promise<{ items: Equipment[]; total: number; hasMore: boolean }> {
    // Backend currently returns all items without pagination
    const res: AxiosResponse<{ success: boolean; data: { items: Equipment[]; total: number } }>
      = await this.apiClient.get('/equipment', { params });
    const data = res.data?.data || { items: [], total: 0 };
    return { items: data.items, total: data.total, hasMore: false };
  }

  async get(id: string): Promise<Equipment> {
    const res: AxiosResponse<{ success: boolean; data: Equipment }>
      = await this.apiClient.get(`/equipment/${id}`);
    return res.data.data;
  }

  async create(payload: Partial<Equipment>): Promise<Equipment> {
    const res: AxiosResponse<{ success: boolean; data: Equipment }>
      = await this.apiClient.post('/equipment', payload);
    return res.data.data;
  }

  async update(id: string, payload: Partial<Equipment>): Promise<Equipment> {
    const res: AxiosResponse<{ success: boolean; data: Equipment }>
      = await this.apiClient.put(`/equipment/${id}`, payload);
    return res.data.data;
  }

  async remove(id: string): Promise<void> {
    await this.apiClient.delete(`/equipment/${id}`);
  }
}

export const equipmentService = new EquipmentService();
export default equipmentService;
