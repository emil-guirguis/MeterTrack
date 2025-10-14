import React, { useState } from 'react';
import DeviceList from './DeviceList';
import DeviceEditForm from './DeviceEditForm';
import { Dialog, DialogTitle } from '@mui/material';
import { Button, Typography, Box, Paper, Alert } from '@mui/material';
import { Card, Divider } from '@mui/material';
import { useModbus } from '../../services/modbusService';
import './SettingsForm.css';

export interface DefaultsFormProps {
  values?: any;
  onChange?: (field: string, value: any) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

const DefaultsForm: React.FC<DefaultsFormProps> = ({ 
  values: _values, 
  onChange: _onChange, 
  onSubmit, 
  onCancel, 
  loading, 
  error 
}) => {
  const { getMeterTypes } = useModbus();
  const [meterTypes, setMeterTypes] = useState<any>({});
  const [loadingMeterTypes, setLoadingMeterTypes] = useState(false);
  const [meterTypesError, setMeterTypesError] = useState<string | null>(null);
  const [showDevices, setShowDevices] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);
  const [showDeviceEdit, setShowDeviceEdit] = useState(false);
  const [deviceSuccess, setDeviceSuccess] = useState<string | null>(null);

  const handleLoadMeterMaps = async () => {
    setLoadingMeterTypes(true);
    setMeterTypesError(null);
    try {
      const result = await getMeterTypes();
      if (result.success && result.data) {
        setMeterTypes(result.data);
        console.log('Loaded meter types:', result.data);
      } else {
        setMeterTypesError(result.error || 'Failed to load meter maps');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load meter maps';
      setMeterTypesError(errorMsg);
    } finally {
      setLoadingMeterTypes(false);
    }
  };



  const handleExportMeterMaps = () => {
    // Export current meter types as JSON
    const exportData = {
      exportDate: new Date().toISOString(),
      meterTypes: meterTypes
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meter-maps-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <form className="settings-form" onSubmit={e => { e.preventDefault(); onSubmit?.(); }}>
      {error && <div className="settings-form__error">{error}</div>}
      
      <div className="settings-form__section">
        <h3 className="settings-form__section-title">Default Settings</h3>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Meter Maps Configuration
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage default meter register maps and configurations for different meter types.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Meter Maps</strong> define how to read data from different types of energy meters using Modbus protocol. 
              Each map specifies which registers to read for voltage, current, power, and other measurements.
            </Typography>
          </Alert>

          {meterTypesError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {meterTypesError}
            </Alert>
          )}


          {/* Devices Section */}
          <Card sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Device Management</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setShowDevices(true)}
              sx={{ minWidth: '160px' }}
            >
              Devices
            </Button>
          </Card>
          <Divider sx={{ mb: 3 }} />
          {/* Meter Maps Section */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleLoadMeterMaps}
              disabled={loadingMeterTypes || loading}
              sx={{ minWidth: '160px' }}
            >
              {loadingMeterTypes ? 'Loading...' : 'Load Meter Maps'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleExportMeterMaps}
              disabled={!meterTypes || Object.keys(meterTypes).length === 0 || loading}
              sx={{ minWidth: '160px' }}
            >
              Export Maps
            </Button>
          </Box>

          {/* Display loaded meter types */}
          {meterTypes && Object.keys(meterTypes).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Loaded Meter Types: {Object.keys(meterTypes).length}
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', p: 1, borderRadius: 1 }}>
                <pre className="meter-types-display">
                  {JSON.stringify(meterTypes, null, 2)}
                </pre>
              </Box>
            </Box>
          )}

          {deviceSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {deviceSuccess}
            </Alert>
          )}
        </Paper>
        
        <div className="settings-form__actions">
          <button type="button" className="settings-form__btn settings-form__btn--secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="settings-form__btn settings-form__btn--primary" disabled={loading}>
            Save
          </button>
        </div>
      </div>

      {/* Device List Dialog */}
      <Dialog open={showDevices} onClose={() => setShowDevices(false)} maxWidth="md" fullWidth>
        <DialogTitle>Device Management</DialogTitle>
        <DeviceList 
          onEdit={(device) => {
            setEditingDevice(device);
            setShowDeviceEdit(true);
            setShowDevices(false);
          }}
        />
      </Dialog>

      {/* Device Edit Dialog */}
      <Dialog open={showDeviceEdit} onClose={() => setShowDeviceEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDevice ? 'Edit Device' : 'Add Device'}</DialogTitle>
        <DeviceEditForm 
          device={editingDevice}
          onSaved={(device) => {
            setDeviceSuccess(`Device "${device.name}" saved successfully!`);
            setShowDeviceEdit(false);
            setEditingDevice(null);
            setTimeout(() => setDeviceSuccess(null), 3000);
          }}
          onCancel={() => {
            setShowDeviceEdit(false);
            setEditingDevice(null);
          }}
        />
      </Dialog>
    </form>
  );
};

export default DefaultsForm;