import React, { useState } from 'react';
import type { Device } from './deviceConfig';
import { useEntityFormWithStore } from '@framework/forms/hooks/useEntityFormWithStore';
import { useDevicesEnhanced } from './devicesStore';
import '@framework/forms/components/BaseForm.css';
import './DeviceForm.css';
import { deviceFormSchema } from './deviceConfig';

interface DeviceFormProps {
  device?: Device;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type DeviceFormData = typeof deviceFormSchema._type;

interface FormErrors {
  [key: string]: string;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({
  device,
  onSubmit: legacyOnSubmit,
  onCancel,
  loading = false,
}) => {
  const devices = useDevicesEnhanced();
  const [errors, setErrors] = useState<FormErrors>({});

  // Use the framework hook for form management with optimistic updates
  const form = useEntityFormWithStore<Device, DeviceFormData>({
    entity: device,
    store: devices,
    entityToFormData: (deviceData) => deviceFormSchema.fromApi(deviceData),
    getDefaultFormData: () => deviceFormSchema.getDefaults(),
    formDataToEntity: (formData) => {
      const apiData = deviceFormSchema.toApi(formData, {});
      // Remove fields that shouldn't be sent to the API
      const { id, active, createdat, updatedat, createdAt, updatedAt, ...cleanData } = apiData;
      return cleanData;
    },
    updateStrategy: 'optimistic',
    onSuccess: async (savedEntity, mode) => {
      console.log(`[DeviceForm] ${mode} successful:`, savedEntity.id);
      // Call legacy onSubmit if provided for backward compatibility
      if (legacyOnSubmit) {
        await legacyOnSubmit(savedEntity);
      }
      onCancel(); // Close the form
    },
    onError: (error, mode) => {
      console.error(`[DeviceForm] ${mode} failed:`, error);
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
    if (!form.formData.description.trim()) newErrors.description = 'Description is required';
    if (!form.formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!form.formData.model_number.trim()) newErrors.model_number = 'Model Number is required';
    if (!form.formData.type.trim()) newErrors.type = 'Type is required';
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
    <form onSubmit={handleSubmit} className="device-form">
      <div className="device-form__section">
        <h3 className="device-form__section-title">Device Information</h3>

        <div className="device-form__field">
          <label htmlFor="name" className="device-form__label">
            Name <span className="device-form__required">*</span>
          </label>
          <input
            id="description"
            type="text"
            value={form.formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter device description"
            className={`device-form__input ${errors.description ? 'device-form__input--error' : ''}`}
          />
          {errors.name && <span className="device-form__error">{errors.name}</span>}
        </div>

        <div className="device-form__row">
          <div className="device-form__field">
            <label htmlFor="manufacturer" className="device-form__label">Manufacturer</label>
            <input
              id="manufacturer"
              type="text"
              value={form.formData.manufacturer}
              onChange={(e) => handleInputChange('manufacturer', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter manufacturer"
              className="device-form__input"
            />
          </div>

          <div className="device-form__field">
            <label htmlFor="model_number" className="device-form__label">Model Number</label>
            <input
              id="model_number"
              type="text"
              value={form.formData.model_number}
              onChange={(e) => handleInputChange('model_number', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter model number"
              className="device-form__input"
            />
          </div>

          <div className="device-form__field">
            <label htmlFor="type" className="device-form__label">Type</label>
            <input
              id="type"
              type="text"
              value={form.formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter type"
              className="device-form__input"
            />
          </div>
        </div>
      </div>

      <div className="device-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={isFormDisabled}
          className="device-form__btn device-form__btn--secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isFormDisabled}
          className="device-form__btn device-form__btn--primary"
        >
          {form.isSubmitting ? (
            <>
              <span className="device-form__spinner" />
              {device ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            device ? 'Update Device' : 'Create Device'
          )}
        </button>
      </div>
    </form>
  );
};
