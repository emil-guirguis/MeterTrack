export interface Meter {
  id: string;
  meterId: string;
  device: string; // From device table
  model: string; // From device table
  device_id?: string; // For backend compatibility
  ip: string;
  serial_number: string;
  portNumber: number;
  location?: string;
  description?: string;
  type?: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  status: 'operational' | 'maintenance' | 'offline';
  installDate: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
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

