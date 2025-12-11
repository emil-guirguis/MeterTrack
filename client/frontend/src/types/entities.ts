// Business Entity Interfaces and Supporting Types

// Supporting Types
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactInfo {
  primaryContact?: string;
  email: string;
  phone: string;
  website?: string;
}

// Location Management
export interface Location {
  id: string;
  name: string;
  tenant_id: string | number;
  address: Address;
  contactInfo: ContactInfo;
  status: 'active' | 'inactive' | 'maintenance';
  type: 'office' | 'warehouse' | 'retail' | 'residential' | 'industrial';
  totalFloors?: number;
  totalUnits?: number;
  yearBuilt?: number;
  squareFootage?: number;
  description?: string;
  meterCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationCreateRequest {
  name: string;
  address: Address;
  contactInfo: ContactInfo;
  type: 'office' | 'warehouse' | 'retail' | 'residential' | 'industrial';
  status?: 'active' | 'inactive' | 'maintenance';
  totalFloors?: number;
  totalUnits?: number;
  yearBuilt?: number;
  squareFootage?: number;
  description?: string;
  notes?: string;
}

export interface LocationUpdateRequest extends Partial<LocationCreateRequest> {
  id: string;
}


export interface BusinessInfo {
  taxId?: string;
  industry?: string;
  website?: string;
  preferredPaymentTerms?: string;
  creditLimit?: number;
}

export interface ContactCreateRequest {
  category: 'customer' | 'vendor' | 'contractor' | 'technician' | 'client';
  name: string;
  company?: string;
  role?: string;
  email: string;
  phone: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  // Legacy fields for backward compatibility
  type?: 'customer' | 'vendor';
  address?: Address;
  businessInfo?: BusinessInfo;
}

export interface ContactUpdateRequest extends Partial<ContactCreateRequest> {
  id: string;
  status?: 'active' | 'inactive';
}

// Meter Management
export interface MeterConfig {
  readingInterval: number; // in minutes
  units: string;
  multiplier: number;
  registers?: number[];
  communicationProtocol?: string;
  baudRate?: number;
  slaveId?: number;
  ipAddress?: string;
  port?: number;
}

// Simple meter reading for basic display
export interface MeterReading {
  value: number;
  timestamp: Date;
  unit: string;
  quality: 'good' | 'estimated' | 'questionable';
}

// Detailed meter reading with all electrical parameters
export interface DetailedMeterReading {
  id: string;
  meterId: string;
  ip: string;
  port: number;
  kVARh: number;      // kVAR Hour Net
  kVAh: number;       // kVA Hour Net
  A: number;          // Current (Amperes)
  kWh: number;        // Watt-Hour Meter
  dPF: number;        // Displacement Power Factor
  dPFchannel: number; // Displacement Power Factor Channel
  V: number;          // Volts
  kW: number;         // Watt Demand
  kWpeak: number;     // Demand kW Peak
  timestamp: Date;
  quality: 'good' | 'estimated' | 'questionable';
  createdAt: Date;
  updatedAt: Date;
  
  // Additional optional fields from modbus agent
  deviceIP?: string;
  slaveId?: number;
  source?: string;
  voltage?: number;
  current?: number;
  power?: number;
  energy?: number;
  frequency?: number;
  powerFactor?: number;
  
  // Phase voltage measurements
  phaseAVoltage?: number;
  phaseBVoltage?: number;
  phaseCVoltage?: number;
  
  // Phase current measurements
  phaseACurrent?: number;
  phaseBCurrent?: number;
  phaseCCurrent?: number;
  
  // Phase power measurements
  phaseAPower?: number;
  phaseBPower?: number;
  phaseCPower?: number;
  
  // Line-to-line voltage measurements
  lineToLineVoltageAB?: number;
  lineToLineVoltageBC?: number;
  lineToLineVoltageCA?: number;
  
  // Power measurements
  totalActivePower?: number;
  totalReactivePower?: number;
  totalApparentPower?: number;
  
  // Energy measurements
  totalActiveEnergyWh?: number;
  totalReactiveEnergyVARh?: number;
  totalApparentEnergyVAh?: number;
  importActiveEnergyWh?: number;
  exportActiveEnergyWh?: number;
  importReactiveEnergyVARh?: number;
  exportReactiveEnergyVARh?: number;
  
  // Additional measurements
  frequencyHz?: number;
  temperatureC?: number;
  humidity?: number;
  neutralCurrent?: number;
  groundCurrent?: number;
  
  // Power factor per phase
  phaseAPowerFactor?: number;
  phaseBPowerFactor?: number;
  phaseCPowerFactor?: number;
  
  // Total harmonic distortion
  voltageThd?: number;
  currentThd?: number;
  voltageThdPhaseA?: number;
  voltageThdPhaseB?: number;
  voltageThdPhaseC?: number;
  currentThdPhaseA?: number;
  currentThdPhaseB?: number;
  currentThdPhaseC?: number;
  
  // Individual harmonic measurements
  voltageHarmonic3?: number;
  voltageHarmonic5?: number;
  voltageHarmonic7?: number;
  currentHarmonic3?: number;
  currentHarmonic5?: number;
  currentHarmonic7?: number;
  
  // Demand measurements
  maxDemandKW?: number;
  maxDemandKVAR?: number;
  maxDemandKVA?: number;
  currentDemandKW?: number;
  currentDemandKVAR?: number;
  currentDemandKVA?: number;
  predictedDemandKW?: number;
  
  // Advanced power quality measurements
  voltageUnbalance?: number;
  currentUnbalance?: number;
  voltageFlicker?: number;
  frequencyDeviation?: number;
  
  // Phase sequence and rotation
  phaseSequence?: 'ABC' | 'ACB' | 'BAC' | 'BCA' | 'CAB' | 'CBA';
  phaseRotation?: 'positive' | 'negative';
  
  // Power direction indicators
  powerDirection?: 'import' | 'export';
  reactiveDirection?: 'inductive' | 'capacitive';
  
  // Communication and status fields
  communicationStatus?: 'ok' | 'error' | 'timeout' | 'offline';
  lastCommunication?: Date;
  dataQuality?: 'good' | 'estimated' | 'questionable' | 'bad';
  
  // Register-specific Modbus data
  modbusRegister40001?: number;
  modbusRegister40002?: number;
  modbusRegister40003?: number;
  modbusRegister40004?: number;
  modbusRegister40005?: number;
  
  // Device information
  deviceModel?: string;
  firmwareVersion?: string;
  serial_number?: string;
  manufacturerCode?: number;
  
  // Meter configuration
  currentTransformerRatio?: number;
  voltageTransformerRatio?: number;
  pulseConstant?: number;
  
  // Time and synchronization
  deviceTime?: Date;
  syncStatus?: 'synchronized' | 'unsynchronized';
  timeSource?: 'internal' | 'ntp' | 'gps';
  
  // Alarm and event information
  alarmStatus?: 'active' | 'inactive';
  eventCounter?: number;
  lastEvent?: string;
}

// Meter Reading Statistics
export interface MeterReadingStats {
  totalReadings: number;
  totalKWh: number;
  totalKVAh: number;
  totalKVARh: number;
  avgPowerFactor: number;
  avgVoltage: number;
  avgCurrent: number;
  maxKWpeak: number;
  uniqueMeters: number;
}

export interface Meter {
  id: string;
  meterId: string; // User-friendly meter identifier
  serial_number: string;
  device: string; // Manufacturer/device name
  model: string; // Model number
  ip: string; // IP address for connection
  portNumber: number; // Port number for connection
  slaveId?: number; // Modbus slave ID
  type: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  locationId?: string;
  locationName?: string; // For display purposes
  configuration: MeterConfig;
  lastReading?: MeterReading;
  status: 'active' | 'inactive' | 'maintenance';
  installDate: Date;
  location?: string;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface Device {
  id: string;
  type: string;
  manufacturer: string;
  model_number: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 
export interface MeterCreateRequest {
  meterId: string;
  serial_number: string;
  device: string;
  model: string;
  ip: string;
  portNumber: number;
  slaveId?: number;
  type: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  locationId?: string;
  configuration: MeterConfig;
  installDate: Date;
  location?: string;
  description?: string;
  notes?: string;
}

export interface MeterUpdateRequest extends Partial<MeterCreateRequest> {
  id: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

// Email Template Management
export interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  category: string;
  usageCount: number;
  status: 'active' | 'inactive' | 'draft';
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplateCreateRequest {
  name: string;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  category: string;
}

export interface EmailTemplateUpdateRequest extends Partial<EmailTemplateCreateRequest> {
  id: string;
  isActive?: boolean;
}

// Company Settings

export interface SystemConfig {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  defaultPageSize: number;
  sessionTimeout: number; // in minutes
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  maintenanceMode: boolean;
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
  backupSettings: {
    enabled: boolean;
    frequency: string;
    retentionDays: number;
    includeFiles: boolean;
  };
}

export interface CompanySettings {
  id: string;
  name: string;
  logo?: string;
  address: Address;
  contactInfo: ContactInfo;
  systemConfig: SystemConfig;
  features: {
    userManagement: boolean;
    locationManagement: boolean;
    meterManagement: boolean;
    contactManagement: boolean;
    emailTemplates: boolean;
    reporting: boolean;
    analytics: boolean;
    mobileApp: boolean;
    apiAccess: boolean;
  };
  integrations: {
    emailProvider: string | null;
    smsProvider: string | null;
    paymentProcessor: string | null;
    calendarSync: boolean;
    weatherAPI: boolean;
    mapProvider: string;
  };
  updatedAt: Date;
}

export interface CompanySettingsUpdateRequest {
  name?: string;
  logo?: string;
  address?: Address;
  contactInfo?: ContactInfo;
  systemConfig?: Partial<SystemConfig>;
}

// Entity State Interfaces for CRUD Operations
export interface EntityState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  pageSize: number;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CrudOperations<T, CreateRequest, UpdateRequest> {
  create: (data: CreateRequest) => Promise<T>;
  read: (id: string) => Promise<T>;
  update: (data: UpdateRequest) => Promise<T>;
  delete: (id: string) => Promise<void>;
  list: (params?: ListParams) => Promise<ListResponse<T>>;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Generic API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  statusCode?: number;
}

// Validation and Form Types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// FormState is defined in ui.ts to avoid duplication

// Status and State Constants
export const EntityStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance'
} as const;

export type EntityStatus = typeof EntityStatus[keyof typeof EntityStatus];


export const MeterType = {
  ELECTRIC: 'electric',
  GAS: 'gas',
  WATER: 'water',
  STEAM: 'steam',
  OTHER: 'other'
} as const;

export type MeterType = typeof MeterType[keyof typeof MeterType];

export const ContactType = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor'
} as const;

export type ContactType = typeof ContactType[keyof typeof ContactType];

export const ReadingQuality = {
  GOOD: 'good',
  ESTIMATED: 'estimated',
  QUESTIONABLE: 'questionable'
} as const;

export type ReadingQuality = typeof ReadingQuality[keyof typeof ReadingQuality];

export const ReadingSource = {
  AUTOMATIC: 'automatic',
  MANUAL: 'manual'
} as const;

export type ReadingSource = typeof ReadingSource[keyof typeof ReadingSource];
