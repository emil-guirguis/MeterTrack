import React, { useState, useEffect } from 'react';
import type { Device } from '../../types/device';
import { formatDate } from '../../utils/helpers';
import './DeviceForm.css';

interface DeviceFormProps {
  device?: Device;
  onSubmit: (data: Partial<Device>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}



interface FormData {
  type: string;
  manufacturer: string;
  model_number: string;
  description: string;
}

interface FormErrors {
  type?: string;
  manufacturer?: string;
  model_number?: string;
  description?: string;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({
  device,
  onSubmit,
  onCancel,
  loading = false,
}) => {

  const handleLoadMeterMaps = async () => {
    try {
      const response = await fetch('/api/metermaps');
      const data = await response.json();
      console.log('Meter Maps:', data);
    } catch (error) {
      console.error('Error fetching meter maps:', error);
    }
  };

  const [formData, setFormData] = useState<FormData>({
    type: '',
    manufacturer: '',
    model_number: '',
    description: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with device data if editing
  useEffect(() => {
    if (device) {
      setFormData({
        type: device.type || '',
        manufacturer: device.manufacturer || '',
        model_number: device.model_number || '',
        description: device.description || '',
      });
    }
  }, [device]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.type.trim()) {
      newErrors.type = 'Device type is required';
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Device manufacturer is required';
    }

    if (!formData.model_number.trim()) {
      newErrors.model_number = 'Device model number is required';
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
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting device form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormDisabled = loading || isSubmitting;

  return (
    <form className="device-form" onSubmit={handleSubmit}>
      <div className="device-form__section">
        <h3 className="device-form__section-title">Device Information</h3>

        <div className="device-form__field">
          <label htmlFor="type" className="device-form__label">
            Type <span className="device-form__required">*</span>
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            disabled={isFormDisabled}
            className={`device-form__select ${errors.type ? 'device-form__select--error' : ''}`}
            required
          >
            <option value="">Select a device type</option>
            <option value="Meter">Meter</option>
            <option value="HVAC Controller">HVAC Controller</option>
            <option value="Thermostat">Thermostats</option>
            <option value="HVAC Sensor">HVAC Sensor</option>
            <option value="Lighting Controller">Lighting Control</option>
          </select>
          {errors.manufacturer && <span className="device-form__error">{errors.manufacturer}</span>}
        </div>

        <div className="device-form__field">
          <label htmlFor="manufacturer" className="device-form__label">
            Manufacturer <span className="device-form__required">*</span>
          </label>
          <select
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => handleInputChange('manufacturer', e.target.value)}
            disabled={isFormDisabled}
            className={`device-form__select ${errors.manufacturer ? 'device-form__select--error' : ''}`}
            required
          >
            <option value="">Select a manufacturer</option>
            <option value="DENT Instruments">DENT Instruments</option>
            <option value="Schneider Electric">Schneider Electric</option>
            <option value="ABB">ABB</option>
            <option value="Siemens">Siemens</option>
            <option value="General Electric">General Electric</option>
            <option value="Honeywell">Honeywell</option>
          </select>
          {errors.manufacturer && <span className="device-form__error">{errors.manufacturer}</span>}
        </div>

        <div className="device-form__field">
          <label htmlFor="model_number" className="device-form__label">
            Model Number <span className="device-form__required">*</span>
          </label>
          <input
            type="text"
            id="model_number"
            value={formData.model_number}
            onChange={(e) => handleInputChange('model_number', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter device model number"
            className={`device-form__input ${errors.model_number ? 'device-form__input--error' : ''}`}
            required
          />
          {errors.model_number && <span className="device-form__error">{errors.model_number}</span>}
        </div>

        <div className="device-form__field">
          <label htmlFor="description" className="device-form__label">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter device description (optional)"
            rows={3}
            className="device-form__textarea"
          />
        </div>
      </div>

      {device && (
        <div className="device-form__section">
          <h3 className="device-form__section-title">Timestamps</h3>
          <div className="device-form__field">
            <label className="device-form__label">Created:</label>
            <span className="device-form__value">{formatDate(device.createdAt)}</span>
          </div>
          <div className="device-form__field">
            <label className="device-form__label">Last Updated:</label>
            <span className="device-form__value">{formatDate(device.updatedAt)}</span>
          </div>
        </div>
      )}

      <div className="device-form__actions">
        <button
          type="button"
          onClick={handleLoadMeterMaps}
          disabled={isFormDisabled || loading}
        >
          Mapping
        </button>
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
          {isSubmitting ? 'Saving...' : device ? 'Update Device' : 'Create Device'}
        </button>
      </div>
    </form>
  );
};

export default DeviceForm;
