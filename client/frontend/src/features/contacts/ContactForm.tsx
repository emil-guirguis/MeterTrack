import React, { useState } from 'react';
import type { Contact } from '../../types/entities';
import { contactFormSchema, countryOptions } from './contactConfig';
import { useEntityFormWithStore } from '@framework/forms/hooks/useEntityFormWithStore';
import { useContactsEnhanced } from './contactsStore';
import '@framework/forms/components/BaseForm.css';
import './ContactForm.css';

interface ContactFormProps {
  contact?: Contact;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Infer TypeScript type from schema
type ContactFormData = typeof contactFormSchema._type;

interface FormErrors {
  [key: string]: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit: legacyOnSubmit,
  onCancel,
  loading = false,
}) => {
  console.log('[ContactForm] Rendering with contact:', contact?.id, contact?.name);
  
  const contacts = useContactsEnhanced();
  const [errors, setErrors] = useState<FormErrors>({});

  // Use the framework hook for form management with optimistic updates
  const form = useEntityFormWithStore<Contact, ContactFormData>({
    entity: contact,
    store: contacts,
    entityToFormData: (contactData) => contactFormSchema.fromApi(contactData),
    getDefaultFormData: () => contactFormSchema.getDefaults(),
    formDataToEntity: (formData) => {
      const apiData = contactFormSchema.toApi(formData, {});
      // Remove fields that shouldn't be sent to the API
      const { id, active, status, createdat, updatedat, createdAt, updatedAt, tags, ...cleanData } = apiData;
      return cleanData;
    },
    updateStrategy: 'optimistic',
    onSuccess: async (savedEntity, mode) => {
      console.log(`[ContactForm] ${mode} successful:`, savedEntity.id);
      // Call legacy onSubmit if provided for backward compatibility
      if (legacyOnSubmit) {
        await legacyOnSubmit(savedEntity);
      }
      onCancel(); // Close the form
    },
    onError: (error, mode) => {
      console.error(`[ContactForm] ${mode} failed:`, error);
    },
  });

  // Handle form field changes
  const handleInputChange = (field: string, value: any) => {
    form.setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!form.formData.name.trim()) newErrors.name = 'Name is required';
    if (!form.formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.formData.phone.trim()) newErrors.phone = 'Phone number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || form.isSubmitting) return;

    try {
      await form.handleSubmit();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const isFormDisabled = loading || form.isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Contact Information</h3>
        
        <div className="contact-form__field">
          <label htmlFor="name" className="contact-form__label">
            Name <span className="contact-form__required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter contact name"
            className={`contact-form__input ${errors.name ? 'contact-form__input--error' : ''}`}
          />
          {errors.name && <span className="contact-form__error">{errors.name}</span>}
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="company" className="contact-form__label">Company</label>
            <input
              id="company"
              type="text"
              value={form.formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter company name"
              className="contact-form__input"
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="role" className="contact-form__label">Role</label>
            <input
              id="role"
              type="text"
              value={form.formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter role/title"
              className="contact-form__input"
            />
          </div>
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="email" className="contact-form__label">
              Email <span className="contact-form__required">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={form.formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter email address"
              className={`contact-form__input ${errors.email ? 'contact-form__input--error' : ''}`}
            />
            {errors.email && <span className="contact-form__error">{errors.email}</span>}
          </div>

          <div className="contact-form__field">
            <label htmlFor="phone" className="contact-form__label">
              Phone <span className="contact-form__required">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter phone number"
              className={`contact-form__input ${errors.phone ? 'contact-form__input--error' : ''}`}
            />
            {errors.phone && <span className="contact-form__error">{errors.phone}</span>}
          </div>
        </div>


      </div>

      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Address</h3>
        
        <div className="contact-form__field">
          <label htmlFor="street" className="contact-form__label">Street Address</label>
          <input
            id="street"
            type="text"
            value={form.formData.street}
            onChange={(e) => handleInputChange('street', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter street address"
            className="contact-form__input"
          />
        </div>

        <div className="contact-form__field">
          <label htmlFor="street2" className="contact-form__label">Street Address 2</label>
          <input
            id="street2"
            type="text"
            value={form.formData.street2}
            onChange={(e) => handleInputChange('street2', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Apt, suite, unit, etc. (optional)"
            className="contact-form__input"
          />
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="city" className="contact-form__label">City</label>
            <input
              id="city"
              type="text"
              value={form.formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter city"
              className="contact-form__input"
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="state" className="contact-form__label">State</label>
            <input
              id="state"
              type="text"
              value={form.formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter state"
              className="contact-form__input"
            />
          </div>
        </div>

        <div className="contact-form__row">
          <div className="contact-form__field">
            <label htmlFor="zip" className="contact-form__label">ZIP Code</label>
            <input
              id="zip"
              type="text"
              value={form.formData.zip}
              onChange={(e) => handleInputChange('zip', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter ZIP code"
              className="contact-form__input"
            />
          </div>

          <div className="contact-form__field">
            <label htmlFor="country" className="contact-form__label">Country</label>
            <select
              id="country"
              value={form.formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              disabled={isFormDisabled}
              className="contact-form__select"
            >
              {countryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Additional Information</h3>
        
        <div className="contact-form__field">
          <label htmlFor="notes" className="contact-form__label">Notes</label>
          <textarea
            id="notes"
            value={form.formData.notes}
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
          {form.isSubmitting ? (
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
