import { create } from 'zustand';
import { Meter, MeterReading, TenantStatus, SyncStatus, MeterStatus, TenantInfo } from '../types';

interface AppState {
  meters: Meter[];
  readings: MeterReading[];
  tenantStatus: TenantStatus | null;
  syncStatus: SyncStatus | null;
  meterStatuses: MeterStatus[];
  tenantInfo: TenantInfo | null;
  isLoading: boolean;
  error: string | null;

  setMeters: (meters: Meter[]) => void;
  setReadings: (readings: MeterReading[]) => void;
  setTenantStatus: (status: TenantStatus) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setMeterStatuses: (statuses: MeterStatus[]) => void;
  setTenantInfo: (info: TenantInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setTenantError: (error: string | null) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  meters: [],
  readings: [],
  tenantStatus: null,
  syncStatus: null,
  meterStatuses: [],
  tenantInfo: null,
  isLoading: false,
  error: null,

  setMeters: (meters) => set({ meters }),
  setReadings: (readings) => set({ readings }),
  setTenantStatus: (tenantStatus) => set({ tenantStatus }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setMeterStatuses: (meterStatuses) => set({ meterStatuses }),
  setTenantInfo: (tenantInfo) => set({ tenantInfo }),
  setLoading: (isLoading) => set({ isLoading }),
  setTenantError: (error) => set({ error }),
  setError: (error) => set({ error }),
}));
