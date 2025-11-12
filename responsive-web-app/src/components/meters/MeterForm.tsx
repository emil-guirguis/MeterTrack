import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDevice } from '../../store/entities/deviceStore';
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
  const devices = useDevice();

  const [formData, setFormData] = useState<CreateMeterRequest>({
    meterId: meter?.meterId || '',
    serialNumber: meter?.serialNumber || '',
    device: meter?.device || '',
    model: meter?.model || '',
    device_id: meter?.device_id || '',
    ip: meter?.ip || '',
    portNumber: meter?.portNumber || 502,
    slaveId: meter?.slaveId || 1,
    type: meter?.type || 'electric',
    location: meter?.location || '',
    description: meter?.description || '',
    register_map: meter?.register_map || null,
  });

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    meter?.device_id
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deviceWarning, setDeviceWarning] = useState<string>('');

  const isEditing = !!meter;
  const canCreate = checkPermission(Permission.METER_CREATE);
  const canUpdate = checkPermission(Permission.METER_UPDATE);

  // Fetch devices on component mount
  useEffect(() => {
    devices.fetchItems();
  }, []);

  // Handle device pre-selection and validation in edit mode
  useEffect(() => {
    if (!devices.loading && devices.items.length > 0 && meter) {
      // Sub-task 6.1: Pre-select device in edit mode
      if (meter.device_id) {
        const deviceExists = devices.items.find(d => d.id === meter.device_id);
        
        if (deviceExists) {
          // Device found - ensure it's selected
          setSelectedDeviceId(meter.device_id);
          setFormData(prev => ({
            ...prev,
            device: deviceExists.manufacturer,
            model: deviceExists.model_number,
            device_id: deviceExists.id,
          }));
        } else {
          // Sub-task 6.2: Handle orphaned device references
          setDeviceWarning('The associated device is no longer available. Please select a new device.');
          setSelectedDeviceId(undefined);
          setFormData(prev => ({
            ...prev,
            device_id: '',
          }));
        }
      } else if (meter.device && meter.model) {
        // Sub-task 6.3: Support legacy meters without device_id
        // Try to find matching device by manufacturer and model
        const matchingDevice = devices.items.find(
          d => d.manufacturer === meter.device && d.model_number === meter.model
        );
        
      }
    }
  }, [devices.loading, devices.items, meter]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};


    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }

    // Sub-task 7.2: Verify validation prevents submission without device
    if (!selectedDeviceId) {
      newErrors.device = 'Device selection is required';
    }

    // Sub-task 7.1: Verify device, model, and device_id are all populated
    if (!formData.device || !formData.model || !formData.device_id) {
      newErrors.device = 'Device selection is required';
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

    // Sub-task 7.2: Ensure validation prevents submission without device
    if (!validateForm()) {
      return;
    }

    // Sub-task 7.1: Ensure formData.device_id is included in onSubmit call
    // Verify device, model, and device_id are all populated
    if (!formData.device_id || !formData.device || !formData.model) {
      console.error('Submission blocked: device information incomplete', {
        device_id: formData.device_id,
        device: formData.device,
        model: formData.model,
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof CreateMeterRequest, value: any) => {
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

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    
    // Find selected device from devices.items array
    const selectedDevice = devices.items.find(device => device.id === deviceId);
    
    if (selectedDevice) {
      // Update formData with selected device's manufacturer, model_number, and id
      setFormData((prev) => ({
        ...prev,
        device: selectedDevice.manufacturer,
        model: selectedDevice.model_number,
        device_id: selectedDevice.id,
      }));
    }
    
    // Clear error when user selects a device
    if (errors.device) {
      setErrors(prev => ({
        ...prev,
        device: '',
      }));
    }
    
    // Clear warning when user makes a selection
    if (deviceWarning) {
      setDeviceWarning('');
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

          {/* Device load error banner */}
          {devices.error && (
            <div className="form-error-banner">
              <span className="error-icon">⚠️</span>
              <span>Unable to load devices. Please try again.</span>
              <button 
                type="button"
                onClick={() => devices.fetchItems()} 
                className="btn btn--small btn--secondary"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty device list info banner */}
          {!devices.loading && !devices.error && devices.items.length === 0 && (
            <div className="form-info-banner">
              <span className="info-icon">ℹ️</span>
              <span>No devices available. Please create a device first.</span>
              <a href="/devices" className="link">Go to Device Management</a>
            </div>
          )}

          {/* Device warning banner for edit mode issues */}
          {deviceWarning && (
            <div className="form-warning-banner">
              <span className="warning-icon">⚠️</span>
              <span>{deviceWarning}</span>
            </div>
          )}

          <div className="form-row">
                        <div className="form-group">
              <label htmlFor="device">Device *</label>
              {devices.loading && (
                <div className="form-loading-message">Loading devices...</div>
              )}
              <select
                id="device"
                value={selectedDeviceId || ''}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className={errors.device ? 'form-control form-control--error' : 'form-control'}
                disabled={devices.loading}
              >
                <option value="">Select Device</option>
                {devices.items.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.manufacturer} - {device.model_number}
                  </option>
                ))}
              </select>
              {errors.device && <div className="form-error">{errors.device}</div>}
              <div className="form-helper-text">
                Select a device from the list. Need to add a new device? <a href="/devices" className="form-helper-link">Manage Devices</a>
              </div>
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
            disabled={loading || devices.loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Meter' : 'Create Meter'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeterForm;