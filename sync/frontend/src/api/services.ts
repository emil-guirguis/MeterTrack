import apiClient from './client';
import { Meter, MeterReading, SyncStatus, TenantInfo } from '../types';
import axios from 'axios';

const CLIENT_API_URL = import.meta.env.VITE_CLIENT_API_URL || 'https://client.meterit.com/api';

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

export const tenantApi = {
  getTenantInfo: async (): Promise<TenantInfo | null> => {
    try {
      console.log('🔍 [Tenant] Fetching tenant info from local database...');
      const response = await apiClient.get<TenantInfo | null>('/api/local/tenant');
      console.log('✅ [Tenant] Successfully fetched tenant info:', response.data);
      return response.data;
    } catch (error) {
      // Log detailed error information for debugging
      if (axios.isAxiosError(error)) {
        console.error('❌ [Tenant] API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          endpoint: '/api/local/tenant',
          timestamp: new Date().toISOString(),
          baseURL: apiClient.defaults.baseURL,
        });
      } else {
        console.error('❌ [Tenant] Unexpected error:', error);
      }
      throw error;
    }
  },

  /**
   * Fetch tenant data from client API using the user's token
   */
  fetchTenantFromClientApi: async (token: string): Promise<TenantInfo | null> => {
    try {
      console.log('📡 [Tenant] Fetching tenant data from client API...');
      console.log('📡 [Tenant] Client API URL:', CLIENT_API_URL);
      console.log('📡 [Tenant] Token:', token ? `${token.substring(0, 20)}...` : 'missing');
      
      const clientApiClient = axios.create({
        baseURL: CLIENT_API_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 [Tenant] Sending request to /users/me...');
      const response = await clientApiClient.get<any>('/users/me');
      
      console.log('📡 [Tenant] Response status:', response.status);
      console.log('📡 [Tenant] Response data keys:', Object.keys(response.data));
      
      if (!response.data || !response.data.tenant) {
        console.warn('⚠️ [Tenant] No tenant data in response');
        console.warn('⚠️ [Tenant] Response data:', response.data);
        return null;
      }

      const tenantData: TenantInfo = {
        id: response.data.tenant.id,
        name: response.data.tenant.name,
        url: response.data.tenant.url,
        street: response.data.tenant.street,
        street2: response.data.tenant.street2,
        city: response.data.tenant.city,
        state: response.data.tenant.state,
        zip: response.data.tenant.zip,
        country: response.data.tenant.country,
        active: response.data.tenant.active,
        created_at: response.data.tenant.created_at,
        updated_at: response.data.tenant.updated_at,
      };

      console.log('✅ [Tenant] Successfully fetched tenant data:', tenantData);
      return tenantData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ [Tenant] Failed to fetch tenant from client API:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error('❌ [Tenant] Unexpected error:', error);
      }
      throw error;
    }
  },

  /**
   * Sync tenant data to local database
   */
  syncTenantToLocal: async (tenantData: TenantInfo): Promise<TenantInfo> => {
    try {
      console.log('💾 [Tenant] Syncing tenant data to local database...');
      console.log('💾 [Tenant] Tenant data:', tenantData);
      console.log('💾 [Tenant] API base URL:', apiClient.defaults.baseURL);
      
      // Call the local API to upsert tenant data
      const payload = {
        name: tenantData.name,
        id: tenantData.id,
        street: tenantData.address,
        street2: tenantData.address2,
        city: tenantData.city,
        state: tenantData.state,
        zip: tenantData.zip,
        country: tenantData.country,
        active: tenantData.active,
      };
      
      console.log('💾 [Tenant] Sending payload:', payload);
      const response = await apiClient.post<TenantInfo>('/api/local/tenant', payload);

      console.log('✅ [Tenant] Sync response status:', response.status);
      console.log('✅ [Tenant] Successfully synced tenant to local database:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ [Tenant] Failed to sync tenant to local database:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          timestamp: new Date().toISOString(),
          responseData: error.response?.data,
        });
      } else {
        console.error('❌ [Tenant] Unexpected error:', error);
      }
      throw error;
    }
  },
};
