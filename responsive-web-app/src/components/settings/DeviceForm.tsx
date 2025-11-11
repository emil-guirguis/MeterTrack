import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Paper, Alert } from '@mui/material';
import { deviceService } from '../../services/deviceService';
import type { Device } from '../../types/device';

interface DeviceFormProps {
  onCreated?: (device: Device) => void;
  onCancel?: () => void;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const device = await deviceService.create({ name, description });
      setSuccess('Device created successfully!');
      setName('');
      setDescription('');
      onCreated?.(device);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 400, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom>
        Add New Device
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Device Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={loading}
          />
          <TextField
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline
            rows={2}
            disabled={loading}
          />
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={loading || !name}>Add Device</Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default DeviceForm;
