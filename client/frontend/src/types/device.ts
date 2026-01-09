export interface Device {
  device_id: number;
  type: string;
  manufacturer: string;
  model_number: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
