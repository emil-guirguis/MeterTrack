import React, { useState, useEffect } from 'react';
import { useLocationsEnhanced } from '../../store/entities/locationStore';
import type { Equipment, EquipmentCreateRequest, EquipmentUpdateRequest } from '../../types/entities';
import './EquipmentForm.css';

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (data: EquipmentCreateRequest | EquipmentUpdateRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  name: string;
  type: string;
  locationId: string;
  specifications: Record<string, any>;
  installDate: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  notes?: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  locationId?: string;
  installDate?: string;
  serialNumber?: string;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const locations = useLocationsEnhanced();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    locationId: '',
    specifications: {},
    installDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load locations for dropdown
  useEffect(() => {
    locations.fetchItems();
  }, []);

  // Initialize form with equipment data if editing
  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        type: equipment.type,
        locationId: equipment.locationId,
        specifications: equipment.specifications || {},
        installDate: new Date(equipment.installDate).toISOString().split('T')[0],
        serialNumber: equipment.serialNumber,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        location: equipment.location,
        notes: equipment.notes,
      });
    }
  }, [equipment]);

  // Validation functions
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Equipment type is required';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Location assignment is required';
    }

    if (!formData.installDate) {
      newErrors.installDate = 'Install date is required';
    } else {
      const installDate = new Date(formData.installDate);
      const today = new Date();
      if (installDate > today) {
        newErrors.installDate = 'Install date cannot be in the future';
      }
    }

    // Optional field validation
    if (formData.serialNumber && formData.serialNumber.trim().length < 3) {
      newErrors.serialNumber = 'Serial number must be at least 3 characters';
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
      const submitData = {
        ...formData,
        installDate: new Date(formData.installDate),
        specifications: formData.specifications || {},
      };

      if (equipment) {
        await onSubmit({ id: equipment.id, ...submitData } as EquipmentUpdateRequest);
      } else {
        await onSubmit(submitData as EquipmentCreateRequest);
      }
    } catch (error) {
      console.error('Error submitting equipment form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSpecificationChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value,
      },
    }));
  };

  const addSpecification = () => {
    const key = prompt('Enter specification name:');
    if (key && key.trim()) {
      handleSpecificationChange(key.trim(), '');
    }
  };

  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  const isFormDisabled = loading || isSubmitting;

  // Common equipment types
  const equipmentTypes = [
    'HVAC System',
    'Electrical Panel',
    'Generator',
    'Pump',
    'Compressor',
    'Boiler',
    'Chiller',
    'Fan',
    'Motor',
    'Transformer',
    'UPS',
    'Fire Safety System',
    'Security System',
    'Elevator',
    'Lighting System',
    'Other',
  ];

  return (
    <form className="equipment-form" onSubmit={handleSubmit}>
      <div className="equipment-form__section">
        <h3 className="equipment-form__section-title">Basic Information</h3>
        
        <div className="equipment-form__row">
          <div className="equipment-form__field">
            <label htmlFor="name" className="equipment-form__label">
              Equipment Name <span className="equipment-form__required">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter equipment name"
              className={`equipment-form__input ${errors.name ? 'equipment-form__input--error' : ''}`}
            />
            {errors.name && <span className="equipment-form__error">{errors.name}</span>}
          </div>

          <div className="equipment-form__field">
            <label htmlFor="type" className="equipment-form__label">
              Equipment Type <span className="equipment-form__required">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={isFormDisabled}
              className={`equipment-form__select ${errors.type ? 'equipment-form__select--error' : ''}`}
            >
              <option value="">Select equipment type</option>
              {equipmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type && <span className="equipment-form__error">{errors.type}</span>}
          </div>
        </div>

        <div className="equipment-form__field">
          <label htmlFor="locationId" className="equipment-form__label">
            Location Assignment <span className="equipment-form__required">*</span>
          </label>
          <select
            id="locationId"
            value={formData.locationId}
            onChange={(e) => handleInputChange('locationId', e.target.value)}
            disabled={isFormDisabled}
            className={`equipment-form__select ${errors.locationId ? 'equipment-form__select--error' : ''}`}
          >
            <option value="">Select location</option>
            {locations.items.map(location => (
              <option key={location.id} value={location.id}>
                {location.name} - {location.address.city}
              </option>
            ))}
          </select>
          {errors.locationId && <span className="equipment-form__error">{errors.locationId}</span>}
        </div>
      </div>

      <div className="equipment-form__section">
        <h3 className="equipment-form__section-title">Equipment Details</h3>
        
        <div className="equipment-form__row">
          <div className="equipment-form__field">
            <label htmlFor="manufacturer" className="equipment-form__label">Manufacturer</label>
            <input
              id="manufacturer"
              type="text"
              value={formData.manufacturer || ''}
              onChange={(e) => handleInputChange('manufacturer', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter manufacturer"
              className="equipment-form__input"
            />
          </div>

          <div className="equipment-form__field">
            <label htmlFor="model" className="equipment-form__label">Model</label>
            <input
              id="model"
              type="text"
              value={formData.model || ''}
              onChange={(e) => handleInputChange('model', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter model"
              className="equipment-form__input"
            />
          </div>
        </div>

        <div className="equipment-form__row">
          <div className="equipment-form__field">
            <label htmlFor="serialNumber" className="equipment-form__label">Serial Number</label>
            <input
              id="serialNumber"
              type="text"
              value={formData.serialNumber || ''}
              onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              disabled={isFormDisabled}
              placeholder="Enter serial number"
              className={`equipment-form__input ${errors.serialNumber ? 'equipment-form__input--error' : ''}`}
            />
            {errors.serialNumber && <span className="equipment-form__error">{errors.serialNumber}</span>}
          </div>

          <div className="equipment-form__field">
            <label htmlFor="installDate" className="equipment-form__label">
              Install Date <span className="equipment-form__required">*</span>
            </label>
            <input
              id="installDate"
              type="date"
              value={formData.installDate}
              onChange={(e) => handleInputChange('installDate', e.target.value)}
              disabled={isFormDisabled}
              max={new Date().toISOString().split('T')[0]}
              className={`equipment-form__input ${errors.installDate ? 'equipment-form__input--error' : ''}`}
            />
            {errors.installDate && <span className="equipment-form__error">{errors.installDate}</span>}
          </div>
        </div>

        <div className="equipment-form__field">
          <label htmlFor="location" className="equipment-form__label">Location</label>
          <input
            id="location"
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter specific location within location"
            className="equipment-form__input"
          />
        </div>
      </div>

      <div className="equipment-form__section">
        <h3 className="equipment-form__section-title">Specifications</h3>
        
        <div className="equipment-form__specifications">
          {Object.entries(formData.specifications).map(([key, value]) => (
            <div key={key} className="equipment-form__specification">
              <div className="equipment-form__specification-key">
                <strong>{key}:</strong>
              </div>
              <div className="equipment-form__specification-value">
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => handleSpecificationChange(key, e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="Enter value"
                  className="equipment-form__input"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSpecification(key)}
                disabled={isFormDisabled}
                className="equipment-form__specification-remove"
                aria-label={`Remove ${key} specification`}
              >
                ✕
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addSpecification}
            disabled={isFormDisabled}
            className="equipment-form__add-specification"
          >
            ➕ Add Specification
          </button>
        </div>
      </div>

      <div className="equipment-form__section">
        <h3 className="equipment-form__section-title">Additional Information</h3>
        
        <div className="equipment-form__field">
          <label htmlFor="notes" className="equipment-form__label">Notes</label>
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            disabled={isFormDisabled}
            placeholder="Enter additional notes about this equipment"
            rows={4}
            className="equipment-form__textarea"
          />
        </div>
      </div>

      <div className="equipment-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={isFormDisabled}
          className="equipment-form__btn equipment-form__btn--secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isFormDisabled}
          className="equipment-form__btn equipment-form__btn--primary"
        >
          {isSubmitting ? 'Saving...' : equipment ? 'Update Equipment' : 'Create Equipment'}
        </button>
      </div>
    </form>
  );
};