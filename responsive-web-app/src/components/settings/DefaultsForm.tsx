import React, { useState } from 'react';
import { Button, Typography, Box, Paper, Alert } from '@mui/material';
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
  values, 
  onChange, 
  onSubmit, 
  onCancel, 
  loading, 
  error 
}) => {
  const { getMeterTypes } = useModbus();
  const [meterTypes, setMeterTypes] = useState<any>({});
  const [loadingMeterTypes, setLoadingMeterTypes] = useState(false);
  const [meterTypesError, setMeterTypesError] = useState<string | null>(null);

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

  const handleCreateDefaultMeterMap = () => {
    // Create a basic default meter map configuration
    const defaultMeterMap = {
      name: 'Default Generic Meter',
      description: 'Standard Modbus register layout for generic energy meters',
      manufacturer: 'Generic',
      model: 'Universal',
      registers: {
        voltage: { address: 0, description: 'Line voltage (V)', dataType: 'uint16', unit: 'V' },
        current: { address: 1, description: 'Line current (A)', dataType: 'uint16', unit: 'A' },
        power: { address: 2, description: 'Active power (W)', dataType: 'uint16', unit: 'W' },
        energy: { address: 3, description: 'Total energy (Wh)', dataType: 'uint32', unit: 'Wh' },
        frequency: { address: 5, description: 'Frequency (Hz)', dataType: 'uint16', unit: 'Hz' }
      }
    };
    
    console.log('Created default meter map:', defaultMeterMap);
    // TODO: Save to backend/database
  };

  const handleImportMeterMap = () => {
    // Create a file input to import JSON meter map configurations
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const meterMap = JSON.parse(content);
            console.log('Imported meter map:', meterMap);
            // TODO: Validate and save meter map
          } catch (error) {
            console.error('Failed to parse meter map file:', error);
            setMeterTypesError('Invalid meter map file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                onClick={handleCreateDefaultMeterMap}
                disabled={loading}
                sx={{ minWidth: '160px' }}
              >
                Create Default Map
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleImportMeterMap}
                disabled={loading}
                sx={{ minWidth: '160px' }}
              >
                Import Map
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleExportMeterMaps}
                disabled={loading || Object.keys(meterTypes).length === 0}
                sx={{ minWidth: '160px' }}
              >
                Export Maps
              </Button>
            </Box>

            {Object.keys(meterTypes).length > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Successfully loaded {Object.keys(meterTypes).length} meter map(s) from the system.
              </Alert>
            )}

            {Object.keys(meterTypes).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Meter Types ({Object.keys(meterTypes).length}):
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {Object.entries(meterTypes).map(([key, type]: [string, any]) => (
                    <Paper key={key} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="body1" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {type.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {type.description}
                      </Typography>
                      {type.registers && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            Register Map:
                          </Typography>
                          <Box sx={{ pl: 1, mt: 0.5 }}>
                            {Object.entries(type.registers).map(([regKey, reg]: [string, any]) => (
                              <Typography key={regKey} variant="caption" component="div" sx={{ mb: 0.5 }}>
                                • <strong>{regKey}</strong>: Address {reg.address} - {reg.description}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Defaults
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure default values for new meters, buildings, and other system entities.
          </Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <div className="settings-form__field">
              <label className="settings-form__label">Default Meter Reading Interval (minutes)</label>
              <input
                type="number"
                value={values?.defaultMeterInterval || 15}
                onChange={e => onChange?.('defaultMeterInterval', Number(e.target.value))}
                className="settings-form__input"
                disabled={loading}
                min={1}
                max={1440}
                placeholder="15"
                title="Default reading interval for new meters"
              />
            </div>
            
            <div className="settings-form__field">
              <label className="settings-form__label">Default Meter Communication Protocol</label>
              <select
                value={values?.defaultMeterProtocol || 'Modbus TCP'}
                onChange={e => onChange?.('defaultMeterProtocol', e.target.value)}
                className="settings-form__input"
                disabled={loading}
                title="Default communication protocol for new meters"
              >
                <option value="Modbus TCP">Modbus TCP</option>
                <option value="Modbus RTU">Modbus RTU</option>
                <option value="BACnet">BACnet</option>
                <option value="Pulse">Pulse</option>
                <option value="AMR">AMR</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="settings-form__field">
              <label className="settings-form__label">Default Modbus Port</label>
              <input
                type="number"
                value={values?.defaultModbusPort || 502}
                onChange={e => onChange?.('defaultModbusPort', Number(e.target.value))}
                className="settings-form__input"
                disabled={loading}
                min={1}
                max={65535}
                placeholder="502"
                title="Default Modbus TCP port for new meters"
              />
            </div>
            
            <div className="settings-form__field">
              <label className="settings-form__label">Default Slave ID</label>
              <input
                type="number"
                value={values?.defaultSlaveId || 1}
                onChange={e => onChange?.('defaultSlaveId', Number(e.target.value))}
                className="settings-form__input"
                disabled={loading}
                min={1}
                max={255}
                placeholder="1"
                title="Default Modbus slave ID for new meters"
              />
            </div>
          </Box>
        </Paper>
      </div>

      <div className="settings-form__actions">
        <button 
          type="button" 
          className="settings-form__btn settings-form__btn--secondary" 
          onClick={onCancel} 
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="settings-form__btn settings-form__btn--primary" 
          disabled={loading}
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default DefaultsForm;