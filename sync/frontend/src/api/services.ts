import apiClient from './client';
import { Meter, MeterReading, SyncStatus } from '../types';

export const metersApi = {
  getAll: async (): Promise<Meter[]> => {
    const response = await apiClient.get<Meter[]>('/api/local/meters');
    return response.data;
  },
};

export const readingsApi = {
  getRecent: async (hours: number = 24): Promise<MeterReading[]> => {
    const response = await apiClient.get<MeterReading[]>('/api/local/readings', {
      params: { hours },
    });
    return response.data;
  },
};

export const syncApi = {
  getStatus: async (): Promise<SyncStatus> => {
    const response = await apiClient.get<SyncStatus>('/api/local/sync-status');
    return response.data;
  },

  triggerSync: async (): Promise<void> => {
    await apiClient.post('/api/local/sync-trigger');
  },
};
