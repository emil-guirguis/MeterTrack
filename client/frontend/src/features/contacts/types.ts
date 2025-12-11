/**
 * Contact Types
 * 
 * TypeScript type definitions for Contact entity.
 * Schema is loaded dynamically from backend via useSchema('contact')
 */

export type Contact = {
  id: string;
  name: string;
  company?: string;
  role?: string;
  email: string;
  phone: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  category: 'customer' | 'vendor' | 'contractor' | 'technician' | 'client';
  status: 'active' | 'inactive';
  createdat: Date;
  updatedat: Date;
  tags?: string[];
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
