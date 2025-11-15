export interface Meter {
  id: number;
  external_id: string;
  name: string;
  bacnet_device_id: number | null;
  bacnet_ip: string | null;
  last_reading_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MeterReading {
  id: number;
  meter_external_id: string;
  timestamp: string;
  data_point: string;
  value: number;
  unit: string | null;
  is_synchronized: boolean;
  created_at: string;
}

export interface SyncStatus {
  is_connected: boolean;
  last_sync_at: string | null;
  queue_size: number;
  sync_errors: SyncError[];
}

export interface SyncError {
  id: number;
  batch_size: number;
  error_message: string;
  synced_at: string;
}

export interface MeterStatus {
  meter_external_id: string;
  meter_name: string;
  is_connected: boolean;
  last_reading_at: string | null;
  last_error: string | null;
}
