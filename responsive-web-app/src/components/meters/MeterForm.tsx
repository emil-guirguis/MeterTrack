import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Meter, CreateMeterRequest } from '../../types/meter';
import { Permission } from '../../types/auth';
import RegisterMapEditor from './RegisterMapEditor';
import './MeterForm.css';

interface MeterFormProps {
  meter?: Meter;
  onSubmit: (data: CreateMeterRequest) => Promise<void>;
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

  const [formData, setFormData] = useState<CreateMeterRequest & { device_id?: string }>({
    meterId: meter?.meterId || '',
    serialNumber: meter?.serialNumber || '',
    manufacture: meter?.manufacture || '',
    model: meter?.model || '',
    device_id: meter?.device_id || undefined,
    ip: meter?.ip || '',
    portNumber: meter?.portNumber || 502,
    slaveId: meter?.slaveId || 1,
    type: meter?.type || 'electric',
    location: meter?.location || '',
    description: meter?.description || '',
    register_map: meter?.register_map || null,
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

  const handleInputChange = (field: keyof (CreateMeterRequest & { device_id?: string }), value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field as string]: '',
      }));
    }
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
              <label htmlFor="brand">Brand *</label>
              <select
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className={errors.brand ? 'form-control form-control--error' : 'form-control'}
              >
                <option value="">Select Brand</option>
                <option value="Honeywell">Honeywell</option>
                <option value="GE">GE</option>
                <option value="ClearSign">ClearSign</option>
                <option value="Powerside">Powerside</option>
                <option value="Siemens">Siemens</option>
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
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="form-control"
                placeholder="e.g., Main Electrical Room"
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


          </div>
        </div>

        <div className="form-section">
          <h3>Location & Description</h3>

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
        </div>

        <div className="form-section">
          <RegisterMapEditor
            value={formData.register_map}
            onChange={(registerMap) => handleInputChange('register_map', registerMap)}
            disabled={loading}
          />
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