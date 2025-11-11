import React, { useState } from 'react';
import { Button, Typography, Box, Paper, Alert, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Card, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DeviceList } from '../device/DeviceList';
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
  const [showDeviceModal, setShowDeviceModal] = useState(false);

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
        <Paper sx={{ p: 3, mb: 3 }}>


          {meterTypesError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {meterTypesError}
            </Alert>
          )}


          {/* Devices Section */}
          <Typography variant="h6" sx={{ mb: 1 }}>Device Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage devices and mapping configurations.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowDeviceModal(true)}
            sx={{ minWidth: '160px' }}
          >
            Devices
          </Button>

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

      {/* Device Management Modal */}
      <Dialog
        open={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Device Management
          <IconButton
            aria-label="close"
            onClick={() => setShowDeviceModal(false)}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
            <DeviceList />
          </Box>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default DefaultsForm;