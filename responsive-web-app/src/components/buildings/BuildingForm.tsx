import React, { useState, useEffect } from 'react';
import type { Building, BuildingCreateRequest, BuildingUpdateRequest, Address, ContactInfo } from '../../types/entities';
import './BuildingForm.css';

interface BuildingFormProps {
  building?: Building;
  onSubmit: (data: BuildingCreateRequest | BuildingUpdateRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  name: string;
  address: Address;
  contactInfo: ContactInfo;
  type: 'office' | 'warehouse' | 'retail' | 'residential' | 'industrial';
  status: 'active' | 'inactive' | 'maintenance';
  totalFloors?: number;
  totalUnits?: number;
  yearBuilt?: number;
  squareFootage?: number;
  description?: string;
  notes?: string;
}

interface FormErrors {
  name?: string;
  'address.street'?: string;
  'address.city'?: string;
  'address.state'?: string;
  'address.zipCode'?: string;
  'address.country'?: string;
  'contactInfo.email'?: string;
  'contactInfo.phone'?: string;
  type?: string;
  yearBuilt?: string;
  squareFootage?: string;
}

export const BuildingForm: React.FC<BuildingFormProps> = ({
  building,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    contactInfo: {
      email: '',
      phone: '',
    },
    type: 'office',
    status: 'active',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with building data if editing
  useEffect(() => {
    if (building) {
      setFormData({
        name: building.name,
        address: { ...building.address },
        contactInfo: { ...building.contactInfo },
        type: building.type,
        status: building.status,
        totalFloors: building.totalFloors,
        totalUnits: building.totalUnits,
        yearBuilt: building.yearBuilt,
        squareFootage: building.squareFootage,
        description: building.description,
        notes: building.notes,
      });
    }
  }, [building]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateZipCode = (zipCode: string, country: string): boolean => {
    if (country === 'US') {
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      return usZipRegex.test(zipCode);
    }
    return zipCode.length >= 3 && zipCode.length <= 10;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Building name is required';
    }

    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'State is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = 'ZIP code is required';
    } else if (!validateZipCode(formData.address.zipCode, formData.address.country)) {
      newErrors['address.zipCode'] = 'Invalid ZIP code format';
    }

    if (!formData.contactInfo.email.trim()) {
      newErrors['contactInfo.email'] = 'Email is required';
    } else if (!validateEmail(formData.contactInfo.email)) {
      newErrors['contactInfo.email'] = 'Invalid email format';
    }

    if (!formData.contactInfo.phone.trim()) {
      newErrors['contactInfo.phone'] = 'Phone number is required';
    } else if (!validatePhone(formData.contactInfo.phone)) {
      newErrors['contactInfo.phone'] = 'Invalid phone number format';
    }

    // Optional field validation
    if (formData.yearBuilt && (formData.yearBuilt < 1800 || formData.yearBuilt > new Date().getFullYear())) {
      newErrors.yearBuilt = 'Year built must be between 1800 and current year';
    }

    if (formData.squareFootage && formData.squareFootage <= 0) {
      newErrors.squareFootage = 'Square footage must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = building 
        ? { id: building.id, ...formData } as BuildingUpdateRequest
        : formData as BuildingCreateRequest;
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting building form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        const parentKey = keys[0] as keyof FormData;
        const parentValue = prev[parentKey];
        return {
          ...prev,
          [keys[0]]: {
            ...(parentValue && typeof parentValue === 'object' ? parentValue : {}),
            [keys[1]]: value,
          },
        };
      }
      return prev;
    });

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormDisabled = loading || isSubmitting;

  return (
    <form className="building-form" onSubmit={handleSubmit}>
      <div className="building-form__section">
        <h3 className="building-form__section-title">Basic Information</h3>
        
        <div className="building-form__row">
          <div className="building-form__field">
            <label htmlFor="name" className="building-form__label">
              Building Name <span className="building-form__required">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter building name"
              className={`building-form__input ${errors.name ? 'building-form__input--error' : ''}`}
            />
            {errors.name && <span className="building-form__error">{errors.name}</span>}
          </div>

          <div className="building-form__field">
            <label htmlFor="type" className="building-form__label">
              Building Type <span className="building-form__required">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={isFormDisabled}
              className={`building-form__select ${errors.type ? 'building-form__select--error' : ''}`}
            >
              <option value="office">Office</option>
              <option value="warehouse">Warehouse</option>
              <option value="retail">Retail</option>
              <option value="residential">Residential</option>
              <option value="industrial">Industrial</option>
            </select>
            {errors.type && <span className="building-form__error">{errors.type}</span>}
          </div>
        </div>

        <div className="building-form__row">
          <div className="building-form__field">
            <label htmlFor="status" className="building-form__label">
              Status <span className="building-form__required">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={isFormDisabled}
              className="building-form__select"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="building-form__section">
        <h3 className="building-form__section-title">Address Information</h3>
        
        <div className="building-form__field">
          <label htmlFor="address.street" className="building-form__label">
            Street Address <span className="building-form__required">*</span>
          </label>
          <input
            id="address.street"
            type="text"
            value={formData.address.street}
            onChange={(e) => handleInputChange('address.street', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter street address"
            className={`building-form__input ${errors['address.street'] ? 'building-form__input--error' : ''}`}
          />
          {errors['address.street'] && <span className="building-form__error">{errors['address.street']}</span>}
        </div>

        <div className="building-form__row">
          <div className="building-form__field">
            <label htmlFor="address.city" className="building-form__label">
              City <span className="building-form__required">*</span>
            </label>
            <input
              id="address.city"
              type="text"
              value={formData.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter city"
              className={`building-form__input ${errors['address.city'] ? 'building-form__input--error' : ''}`}
            />
            {errors['address.city'] && <span className="building-form__error">{errors['address.city']}</span>}
          </div>

          <div className="building-form__field">
            <label htmlFor="address.state" className="building-form__label">
              State <span className="building-form__required">*</span>
            </label>
            <input
              id="address.state"
              type="text"
              value={formData.address.state}
              onChange={(e) => handleInputChange('address.state', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter state"
              className={`building-form__input ${errors['address.state'] ? 'building-form__input--error' : ''}`}
            />
            {errors['address.state'] && <span className="building-form__error">{errors['address.state']}</span>}
          </div>

          <div className="building-form__field">
            <label htmlFor="address.zipCode" className="building-form__label">
              ZIP Code <span className="building-form__required">*</span>
            </label>
            <input
              id="address.zipCode"
              type="text"
              value={formData.address.zipCode}
              onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter ZIP code"
              className={`building-form__input ${errors['address.zipCode'] ? 'building-form__input--error' : ''}`}
            />
            {errors['address.zipCode'] && <span className="building-form__error">{errors['address.zipCode']}</span>}
          </div>
        </div>

        <div className="building-form__field">
          <label htmlFor="address.country" className="building-form__label">
            Country <span className="building-form__required">*</span>
          </label>
          <select
            id="address.country"
            value={formData.address.country}
            onChange={(e) => handleInputChange('address.country', e.target.value)}
            disabled={isFormDisabled}
            className="building-form__select"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="MX">Mexico</option>
          </select>
        </div>
      </div>

      <div className="building-form__section">
        <h3 className="building-form__section-title">Contact Information</h3>
        
        <div className="building-form__row">
          <div className="building-form__field">
            <label htmlFor="contactInfo.email" className="building-form__label">
              Email <span className="building-form__required">*</span>
            </label>
            <input
              id="contactInfo.email"
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter email address"
              className={`building-form__input ${errors['contactInfo.email'] ? 'building-form__input--error' : ''}`}
            />
            {errors['contactInfo.email'] && <span className="building-form__error">{errors['contactInfo.email']}</span>}
          </div>

          <div className="building-form__field">
            <label htmlFor="contactInfo.phone" className="building-form__label">
              Phone <span className="building-form__required">*</span>
            </label>
            <input
              id="contactInfo.phone"
              type="tel"
              value={formData.contactInfo.phone}
              onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter phone number"
              className={`building-form__input ${errors['contactInfo.phone'] ? 'building-form__input--error' : ''}`}
            />
            {errors['contactInfo.phone'] && <span className="building-form__error">{errors['contactInfo.phone']}</span>}
          </div>
        </div>

        <div className="building-form__field">
          <label htmlFor="contactInfo.website" className="building-form__label">Website</label>
          <input
            id="contactInfo.website"
            type="url"
            value={formData.contactInfo.website || ''}
            onChange={(e) => handleInputChange('contactInfo.website', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter website URL (optional)"
            className="building-form__input"
          />
        </div>

        <div className="building-form__field">
          <label htmlFor="contactInfo.primaryContact" className="building-form__label">Primary Contact</label>
          <input
            id="contactInfo.primaryContact"
            type="text"
            value={formData.contactInfo.primaryContact || ''}
            onChange={(e) => handleInputChange('contactInfo.primaryContact', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter primary contact name (optional)"
            className="building-form__input"
          />
        </div>
      </div>

      <div className="building-form__section">
        <h3 className="building-form__section-title">Building Details</h3>
        
        <div className="building-form__row">
          <div className="building-form__field">
            <label htmlFor="squareFootage" className="building-form__label">Square Footage</label>
            <input
              id="squareFootage"
              type="number"
              value={formData.squareFootage?.toString() || ''}
              onChange={(e) => handleInputChange('squareFootage', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isFormDisabled}
              placeholder="Enter square footage"
              min="1"
              className={`building-form__input ${errors.squareFootage ? 'building-form__input--error' : ''}`}
            />
            {errors.squareFootage && <span className="building-form__error">{errors.squareFootage}</span>}
          </div>

          <div className="building-form__field">
            <label htmlFor="yearBuilt" className="building-form__label">Year Built</label>
            <input
              id="yearBuilt"
              type="number"
              value={formData.yearBuilt?.toString() || ''}
              onChange={(e) => handleInputChange('yearBuilt', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isFormDisabled}
              placeholder="Enter year built"
              min="1800"
              max={new Date().getFullYear().toString()}
              className={`building-form__input ${errors.yearBuilt ? 'building-form__input--error' : ''}`}
            />
            {errors.yearBuilt && <span className="building-form__error">{errors.yearBuilt}</span>}
          </div>
        </div>

        <div className="building-form__row">
          <div className="building-form__field">
            <label htmlFor="totalFloors" className="building-form__label">Total Floors</label>
            <input
              id="totalFloors"
              type="number"
              value={formData.totalFloors?.toString() || ''}
              onChange={(e) => handleInputChange('totalFloors', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isFormDisabled}
              placeholder="Enter number of floors"
              min="1"
              className="building-form__input"
            />
          </div>

          <div className="building-form__field">
            <label htmlFor="totalUnits" className="building-form__label">Total Units</label>
            <input
              id="totalUnits"
              type="number"
              value={formData.totalUnits?.toString() || ''}
              onChange={(e) => handleInputChange('totalUnits', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isFormDisabled}
              placeholder="Enter number of units"
              min="1"
              className="building-form__input"
            />
          </div>
        </div>

        <div className="building-form__field">
          <label htmlFor="description" className="building-form__label">Description</label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter building description (optional)"
            rows={3}
            className="building-form__textarea"
          />
        </div>

        <div className="building-form__field">
          <label htmlFor="notes" className="building-form__label">Notes</label>
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter additional notes (optional)"
            rows={3}
            className="building-form__textarea"
          />
        </div>
      </div>

      <div className="building-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={isFormDisabled}
          className="building-form__btn building-form__btn--secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isFormDisabled}
          className="building-form__btn building-form__btn--primary"
        >
          {isSubmitting ? 'Saving...' : building ? 'Update Building' : 'Create Building'}
        </button>
      </div>
    </form>
  );
};