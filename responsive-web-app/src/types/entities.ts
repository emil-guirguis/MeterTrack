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

// Building Management
export interface Building {
  id: string;
  name: string;
  address: Address;
  contactInfo: ContactInfo;
  status: 'active' | 'inactive' | 'maintenance';
  type: 'office' | 'warehouse' | 'retail' | 'residential' | 'industrial';
  totalFloors?: number;
  totalUnits?: number;
  yearBuilt?: number;
  squareFootage?: number;
  description?: string;
  equipmentCount: number;
  meterCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuildingCreateRequest {
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

export interface BuildingUpdateRequest extends Partial<BuildingCreateRequest> {
  id: string;
}

// Equipment Management
export interface Equipment {
  id: string;
  name: string;
  type: string;
  buildingId: string;
  buildingName?: string; // For display purposes
  specifications: Record<string, any>;
  status: 'operational' | 'maintenance' | 'offline';
  installDate: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentCreateRequest {
  name: string;
  type: string;
  buildingId: string;
  specifications: Record<string, any>;
  installDate: Date;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  notes?: string;
}

export interface EquipmentUpdateRequest extends Partial<EquipmentCreateRequest> {
  id: string;
  status?: 'operational' | 'maintenance' | 'offline';
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

// Contact Management (Customers and Vendors)
export interface Contact {
  id: string;
  type: 'customer' | 'vendor';
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  status: 'active' | 'inactive';
  businessType: string;
  industry: string;
  website?: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessInfo {
  taxId?: string;
  industry?: string;
  website?: string;
  preferredPaymentTerms?: string;
  creditLimit?: number;
}

export interface ContactCreateRequest {
  type: 'customer' | 'vendor';
  name: string;
  company?: string;
  email: string;
  phone: string;
  address: Address;
  notes?: string;
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

export interface MeterReading {
  value: number;
  timestamp: Date;
  unit: string;
  quality: 'good' | 'estimated' | 'questionable';
}

export interface Meter {
  id: string;
  serialNumber: string;
  type: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  buildingId?: string;
  buildingName?: string; // For display purposes
  equipmentId?: string;
  equipmentName?: string; // For display purposes
  configuration: MeterConfig;
  lastReading?: MeterReading;
  status: 'active' | 'inactive' | 'maintenance';
  installDate: Date;
  manufacturer?: string;
  model?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeterCreateRequest {
  serialNumber: string;
  type: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  buildingId?: string;
  equipmentId?: string;
  configuration: MeterConfig;
  installDate: Date;
  manufacturer?: string;
  model?: string;
  location?: string;
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
export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  customCSS: string;
  emailSignature: string;
}

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
  branding: BrandingConfig;
  systemConfig: SystemConfig;
  features: {
    userManagement: boolean;
    buildingManagement: boolean;
    equipmentManagement: boolean;
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
  branding?: Partial<BrandingConfig>;
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

export const EquipmentStatus = {
  OPERATIONAL: 'operational',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline'
} as const;

export type EquipmentStatus = typeof EquipmentStatus[keyof typeof EquipmentStatus];

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