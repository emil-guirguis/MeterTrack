export interface Meter {
  id: string;
  meterId: string;
  brand: string;
  model: string;
  ip: string;
  serialNumber: string;
  portNumber: number;
  slaveId?: number;
  location?: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
  type?: 'electric' | 'gas' | 'water';
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface MeterReading {
  id: string;
  meterId: string;
  timestamp: string;
  voltage?: number;
  current?: number;
  power?: number;
  energy?: number;
  frequency?: number;
  powerFactor?: number;
  temperature?: number;
  status: 'good' | 'warning' | 'error';
  quality: number;
  createdAt: string;
}

export interface MeterConnectionTest {
  connected: boolean;
  ip: string;
  port: number;
  slaveId?: number;
  error?: string;
  timestamp: string;
}

export interface CreateMeterRequest {
  meterId: string;
  brand: string;
  model: string;
  ip: string;
  serialNumber: string;
  portNumber: number;
  slaveId?: number;
  location?: string;
  description?: string;
  type?: 'electric' | 'gas' | 'water';
}

export interface UpdateMeterRequest extends Partial<CreateMeterRequest> {
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface MeterFilters {
  brand?: string;
  status?: string;
  type?: string;
  location?: string;
}

export interface MeterApiResponse {
  success: boolean;
  data: Meter | Meter[] | { items: Meter[]; pagination: any };
  message?: string;
  error?: string;
}