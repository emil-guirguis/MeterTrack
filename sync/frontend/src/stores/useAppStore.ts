import { create } from 'zustand';
import { Meter, MeterReading, SyncStatus, MeterStatus } from '../types';

interface AppState {
  meters: Meter[];
  readings: MeterReading[];
  syncStatus: SyncStatus | null;
  meterStatuses: MeterStatus[];
  isLoading: boolean;
  error: string | null;

  setMeters: (meters: Meter[]) => void;
  setReadings: (readings: MeterReading[]) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setMeterStatuses: (statuses: MeterStatus[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  meters: [],
  readings: [],
  syncStatus: null,
  meterStatuses: [],
  isLoading: false,
  error: null,

  setMeters: (meters) => set({ meters }),
  setReadings: (readings) => set({ readings }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setMeterStatuses: (meterStatuses) => set({ meterStatuses }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
