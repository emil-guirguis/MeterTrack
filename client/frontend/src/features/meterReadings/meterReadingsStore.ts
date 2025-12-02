/**
 * Meter Readings Store
 * 
 * Read-only store for meter readings data
 * Provides data fetching and filtering (no create/update/delete)
 */

import { create } from 'zustand';
import type { MeterReading } from './meterReadingConfig';

interface MeterReadingsState {
  items: MeterReading[];
  loading: boolean;
  error: string | null;
  
  // Fetch operations
  fetchItems: () => Promise<void>;
  fetchByMeterId: (meterId: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

/**
 * Meter readings store hook
 * Read-only - no create/update/delete operations
 */
export const useMeterReadings = create<MeterReadingsState>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/meterreadings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meter readings');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        set({ 
          items: result.data.items || result.data || [],
          loading: false 
        });
      } else {
        throw new Error(result.message || 'Failed to fetch meter readings');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch meter readings';
      set({ error: message, loading: false });
      console.error('Fetch meter readings error:', error);
    }
  },

  fetchByMeterId: async (meterId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/meterreadings/meter/${meterId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meter readings');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        set({ 
          items: result.data || [],
          loading: false 
        });
      } else {
        throw new Error(result.message || 'Failed to fetch meter readings');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch meter readings';
      set({ error: message, loading: false });
      console.error('Fetch meter readings by meter ID error:', error);
    }
  },

  clearError: () => set({ error: null }),
}));

/**
 * Enhanced hook with additional computed properties
 */
export const useMeterReadingsEnhanced = () => {
  const store = useMeterReadings();
  
  return {
    ...store,
    // Computed properties
    totalReadings: store.items.length,
    goodQualityReadings: store.items.filter(r => r.quality === 'good'),
    estimatedReadings: store.items.filter(r => r.quality === 'estimated'),
  };
};
