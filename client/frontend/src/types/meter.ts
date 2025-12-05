export interface RegisterMapField {
  name: string; // Modbus Register Name
  register: number; // Modbus Register
  absoluteAddress: number; // Absolute Address  
  description: string; // Item Description
  units?: string; // Units
  functionality?: string; // Functionality
  dataType: 'uint16' | 'uint32' | 'int16' | 'int32' | 'float32' | 'string'; // Data Type
  readWrite: 'R' | 'W' | 'R/W'; // R/W
  bacnetObject?: string; // BACnet Object
  bacnetObjectType?: string; // BACnet Object Type
  bacnetObjectName?: string; // BACnet Object Name
  systemElement?: string; // System or Element
  valueRange?: string; // Value/Range
  publicNotes?: string; // Public Notes
  models?: string; // Models
}

export interface RegisterMap {
  description?: string;
  fields: RegisterMapField[];
}
export interface Meter {
  id: string;
  meterId: string;
  device: string; // From device table
  model: string; // From device table
  device_id?: string; // For backend compatibility
  ip: string;
  serial_number: string;
  portNumber: number;
  slaveId?: number;
  location?: string;
  description?: string;
  type?: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  status: 'operational' | 'maintenance' | 'offline';
  installDate: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  register_map?: RegisterMap | null;
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
  device: string;
  model: string;
  device_id: string;
  ip: string;
  serial_number: string;
  portNumber: number;
  slaveId?: number;
  location?: string;
  description?: string;
  type?: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  register_map?: RegisterMap | null;
}

export interface UpdateMeterRequest extends Partial<CreateMeterRequest> {
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface MeterFilters {
  device?: string;
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