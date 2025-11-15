import React, { useState, useEffect } from 'react';
import type { Contact, ContactCreateRequest, ContactUpdateRequest, Address } from '../../types/entities';
import './ContactForm.css';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactCreateRequest | ContactUpdateRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
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
  tags: string[];
}

interface FormErrors {
  [key: string]: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    type: 'customer',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    status: 'active',
    businessType: '',
    industry: '',
    website: '',
    notes: '',
    tags: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Initialize form with contact data if editing
  useEffect(() => {
    if (contact) {
      setFormData({
        type: (contact.category as 'customer' | 'vendor') || 'customer',
        name: contact.name,
        contactPerson: contact.company || contact.role || '',
        email: contact.email,
        phone: contact.phone,
        address: {
          street: contact.street || contact.address?.street || '',
          city: contact.city || contact.address?.city || '',
          state: contact.state || contact.address?.state || '',
          zipCode: contact.zip_code || contact.address?.zipCode || '',
          country: contact.country || contact.address?.country || 'US',
        },
        status: contact.status,
        businessType: contact.businessType || '',
        industry: contact.industry || '',
        website: contact.website || '',
        notes: contact.notes || '',
        tags: contact.tags || [],
      });
    }
  }, [contact]);

  // Handle form field changes
  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle tag input
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Contact name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    // Address validation
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
    if (!formData.address.state.trim()) newErrors['address.state'] = 'State is required';
    if (!formData.address.zipCode.trim()) newErrors['address.zipCode'] = 'ZIP code is required';

    // Website validation (if provided)
    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        website: formData.website?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      if (contact) {
        await onSubmit({ id: contact.id, ...submitData } as ContactUpdateRequest);
      } else {
        await onSubmit(submitData as ContactCreateRequest);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Contact Information</h3>
        
        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="type" className="contact-form__label">
              Type <span className="contact-form__required">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={isFormDisabled}
              className={`contact-form__select ${errors.type ? 'contact-form__select--error' : ''}`}
            >
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
            {errors.type && <span className="contact-form__error">{errors.type}</span>}
          </div>

          <div className="contact-form__field">
            <label htmlFor="status" className="contact-form__label">Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={isFormDisabled}
              className="contact-form__select"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="contact-form__field">
          <label htmlFor="name" className="contact-form__label">
            Company/Organization Name <span className="contact-form__required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter company or organization name"
            className={`contact-form__input ${errors.name ? 'contact-form__input--error' : ''}`}
          />
          {errors.name && <span className="contact-form__error">{errors.name}</span>}
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="contactPerson" className="contact-form__label">
              Contact Person <span className="contact-form__required">*</span>
            </label>
            <input
              id="contactPerson"
              type="text"
              value={formData.contactPerson}
              onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter contact person name"
              className={`contact-form__input ${errors.contactPerson ? 'contact-form__input--error' : ''}`}
            />
            {errors.contactPerson && <span className="contact-form__error">{errors.contactPerson}</span>}
          </div>

          <div className="contact-form__field">
            <label htmlFor="email" className="contact-form__label">
              Email <span className="contact-form__required">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter email address"
              className={`contact-form__input ${errors.email ? 'contact-form__input--error' : ''}`}
            />
            {errors.email && <span className="contact-form__error">{errors.email}</span>}
          </div>
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="phone" className="contact-form__label">
              Phone <span className="contact-form__required">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter phone number"
              className={`contact-form__input ${errors.phone ? 'contact-form__input--error' : ''}`}
            />
            {errors.phone && <span className="contact-form__error">{errors.phone}</span>}
          </div>

          <div className="contact-form__field">
            <label htmlFor="website" className="contact-form__label">Website</label>
            <input
              id="website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter website URL (optional)"
              className={`contact-form__input ${errors.website ? 'contact-form__input--error' : ''}`}
            />
            {errors.website && <span className="contact-form__error">{errors.website}</span>}
          </div>
        </div>
      </div>

      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Address</h3>
        
        <div className="contact-form__field">
          <label htmlFor="address.street" className="contact-form__label">
            Street Address <span className="contact-form__required">*</span>
          </label>
          <input
            id="address.street"
            type="text"
            value={formData.address.street}
            onChange={(e) => handleInputChange('address.street', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter street address"
            className={`contact-form__input ${errors['address.street'] ? 'contact-form__input--error' : ''}`}
          />
          {errors['address.street'] && <span className="contact-form__error">{errors['address.street']}</span>}
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="address.city" className="contact-form__label">
              City <span className="contact-form__required">*</span>
            </label>
            <input
              id="address.city"
              type="text"
              value={formData.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter city"
              className={`contact-form__input ${errors['address.city'] ? 'contact-form__input--error' : ''}`}
            />
            {errors['address.city'] && <span className="contact-form__error">{errors['address.city']}</span>}
          </div>

          <div className="contact-form__field">
            <label htmlFor="address.state" className="contact-form__label">
              State <span className="contact-form__required">*</span>
            </label>
            <input
              id="address.state"
              type="text"
              value={formData.address.state}
              onChange={(e) => handleInputChange('address.state', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter state"
              className={`contact-form__input ${errors['address.state'] ? 'contact-form__input--error' : ''}`}
            />
            {errors['address.state'] && <span className="contact-form__error">{errors['address.state']}</span>}
          </div>
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="address.zipCode" className="contact-form__label">
              ZIP Code <span className="contact-form__required">*</span>
            </label>
            <input
              id="address.zipCode"
              type="text"
              value={formData.address.zipCode}
              onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter ZIP code"
              className={`contact-form__input ${errors['address.zipCode'] ? 'contact-form__input--error' : ''}`}
            />
            {errors['address.zipCode'] && <span className="contact-form__error">{errors['address.zipCode']}</span>}
          </div>

          <div className="contact-form__field">
            <label htmlFor="address.country" className="contact-form__label">Country</label>
            <select
              id="address.country"
              value={formData.address.country}
              onChange={(e) => handleInputChange('address.country', e.target.value)}
              disabled={isFormDisabled}
              className="contact-form__select"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="JP">Japan</option>
            </select>
          </div>
        </div>
      </div>

      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Business Information</h3>
        
        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="businessType" className="contact-form__label">Business Type</label>
            <input
              id="businessType"
              type="text"
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              disabled={isFormDisabled}
              placeholder="e.g., Corporation, LLC, Partnership"
              className="contact-form__input"
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="industry" className="contact-form__label">Industry</label>
            <input
              id="industry"
              type="text"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              disabled={isFormDisabled}
              placeholder="e.g., Technology, Manufacturing, Healthcare"
              className="contact-form__input"
            />
          </div>
        </div>

        <div className="contact-form__field">
          <label htmlFor="tags" className="contact-form__label">Tags</label>
          <div className="contact-form__tags-container">
            <div className="contact-form__tags">
              {formData.tags.map((tag, index) => (
                <span key={index} className="contact-form__tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    disabled={isFormDisabled}
                    className="contact-form__tag-remove"
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              onBlur={addTag}
              disabled={isFormDisabled}
              placeholder="Add tags (press Enter or comma to add)"
              className="contact-form__tags-input"
            />
          </div>
        </div>

        <div className="contact-form__field">
          <label htmlFor="notes" className="contact-form__label">Notes</label>
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Additional notes about this contact..."
            className="contact-form__textarea"
            rows={4}
          />
        </div>
      </div>

      <div className="contact-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={isFormDisabled}
          className="contact-form__btn contact-form__btn--secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isFormDisabled}
          className="contact-form__btn contact-form__btn--primary"
        >
          {isSubmitting ? (
            <>
              <span className="contact-form__spinner" />
              {contact ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            contact ? 'Update Contact' : 'Create Contact'
          )}
        </button>
      </div>
    </form>
  );
};