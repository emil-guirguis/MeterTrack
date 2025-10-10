import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Meter, MeterCreateRequest } from '../../types/entities';
import { Permission } from '../../types/auth';
import './MeterForm.css';

interface MeterFormProps {
  meter?: Meter;
  onSubmit: (data: MeterCreateRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const MeterForm: React.FC<MeterFormProps> = ({
  meter,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { checkPermission } = useAuth();
  
  const [formData, setFormData] = useState<MeterCreateRequest>({
    meterId: meter?.meterId || '',
    serialNumber: meter?.serialNumber || '',
    brand: meter?.brand || '',
    model: meter?.model || '',
    ip: meter?.ip || '',
    portNumber: meter?.portNumber || 502,
    slaveId: meter?.slaveId || 1,
    type: meter?.type || 'electric',
    buildingId: meter?.buildingId || '',
    equipmentId: meter?.equipmentId || '',
    configuration: meter?.configuration || {
      readingInterval: 15,
      units: 'kWh',
      multiplier: 1,
      registers: [5, 6, 7],
      communicationProtocol: 'Modbus TCP',
    },
    installDate: meter?.installDate || new Date(),
    location: meter?.location || '',
    description: meter?.description || '',
    notes: meter?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!meter;
  const canCreate = checkPermission(Permission.METER_CREATE);
  const canUpdate = checkPermission(Permission.METER_UPDATE);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.meterId.trim()) {
      newErrors.meterId = 'Meter ID is required';
    }

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.ip.trim()) {
      newErrors.ip = 'IP address is required';
    } else {
      // Basic IP validation
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipRegex.test(formData.ip)) {
        newErrors.ip = 'Please enter a valid IP address';
      }
    }

    if (formData.portNumber < 1 || formData.portNumber > 65535) {
      newErrors.portNumber = 'Port number must be between 1 and 65535';
    }

    if (formData.slaveId && (formData.slaveId < 1 || formData.slaveId > 247)) {
      newErrors.slaveId = 'Slave ID must be between 1 and 247';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof MeterCreateRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleConfigurationChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [field]: value,
      },
    }));
  };

  if (isEditing && !canUpdate) {
    return <div className="error-message">You don't have permission to edit meters.</div>;
  }

  if (!isEditing && !canCreate) {
    return <div className="error-message">You don't have permission to create meters.</div>;
  }

  return (
    <div className="meter-form">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="meterId">Meter ID *</label>
              <input
                type="text"
                id="meterId"
                value={formData.meterId}
                onChange={(e) => handleInputChange('meterId', e.target.value)}
                className={errors.meterId ? 'form-control form-control--error' : 'form-control'}
                placeholder="e.g., MTR001"
                maxLength={50}
              />
              {errors.meterId && <div className="form-error">{errors.meterId}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="serialNumber">Serial Number *</label>
              <input
                type="text"
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                className={errors.serialNumber ? 'form-control form-control--error' : 'form-control'}
                placeholder="e.g., SN123456789"
                maxLength={100}
              />
              {errors.serialNumber && <div className="form-error">{errors.serialNumber}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">Brand *</label>
              <select
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className={errors.brand ? 'form-control form-control--error' : 'form-control'}
              >
                <option value="">Select Brand</option>
                <option value="Schneider Electric">Schneider Electric</option>
                <option value="ABB">ABB</option>
                <option value="Siemens">Siemens</option>
                <option value="GE">GE</option>
                <option value="Honeywell">Honeywell</option>
                <option value="Other">Other</option>
              </select>
              {errors.brand && <div className="form-error">{errors.brand}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="model">Model *</label>
              <input
                type="text"
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className={errors.model ? 'form-control form-control--error' : 'form-control'}
                placeholder="e.g., ION7650"
                maxLength={100}
              />
              {errors.model && <div className="form-error">{errors.model}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as any)}
                className="form-control"
              >
                <option value="electric">Electric</option>
                <option value="gas">Gas</option>
                <option value="water">Water</option>
                <option value="steam">Steam</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="installDate">Install Date</label>
              <input
                type="date"
                id="installDate"
                value={formData.installDate.toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('installDate', new Date(e.target.value))}
                className="form-control"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Connection Settings</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ip">IP Address *</label>
              <input
                type="text"
                id="ip"
                value={formData.ip}
                onChange={(e) => handleInputChange('ip', e.target.value)}
                className={errors.ip ? 'form-control form-control--error' : 'form-control'}
                placeholder="e.g., 192.168.1.100"
              />
              {errors.ip && <div className="form-error">{errors.ip}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="portNumber">Port Number *</label>
              <input
                type="number"
                id="portNumber"
                value={formData.portNumber}
                onChange={(e) => handleInputChange('portNumber', parseInt(e.target.value))}
                className={errors.portNumber ? 'form-control form-control--error' : 'form-control'}
                min="1"
                max="65535"
              />
              {errors.portNumber && <div className="form-error">{errors.portNumber}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="slaveId">Slave ID</label>
              <input
                type="number"
                id="slaveId"
                value={formData.slaveId || ''}
                onChange={(e) => handleInputChange('slaveId', e.target.value ? parseInt(e.target.value) : undefined)}
                className={errors.slaveId ? 'form-control form-control--error' : 'form-control'}
                min="1"
                max="247"
                placeholder="Default: 1"
              />
              {errors.slaveId && <div className="form-error">{errors.slaveId}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="readingInterval">Reading Interval (minutes)</label>
              <input
                type="number"
                id="readingInterval"
                value={formData.configuration.readingInterval}
                onChange={(e) => handleConfigurationChange('readingInterval', parseInt(e.target.value))}
                className="form-control"
                min="1"
                max="1440"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Location & Description</h3>
          
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="form-control"
              placeholder="e.g., Main Electrical Room"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="form-control"
              rows={3}
              placeholder="Brief description of the meter..."
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="form-control"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn--secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn--primary ${loading ? 'btn--loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Meter' : 'Create Meter'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeterForm;