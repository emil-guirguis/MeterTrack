import React, { useEffect, useState } from 'react';
import { getDevices, deleteDevice } from '../../services/deviceService';
import type { Device } from '../../types/device';
import { Button, List, ListItem, ListItemText, IconButton, Typography, Box, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface DeviceListProps {
  onEdit: (device: Device) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({ onEdit }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDevices = () => {
    setLoading(true);
    getDevices()
      .then(setDevices)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this device?')) return;
    setDeletingId(id);
    try {
      await deleteDevice(id);
      setDevices(devices.filter(d => d._id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom>Devices</Typography>
      {loading && <CircularProgress size={24} />}
      {error && <Typography color="error">{error}</Typography>}
      <List>
        {devices.map(device => (
          <ListItem key={device._id} secondaryAction={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton edge="end" aria-label="edit" onClick={() => onEdit(device)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(device._id!)} disabled={deletingId === device._id}>
                <DeleteIcon />
              </IconButton>
            </Box>
          }>
            <ListItemText primary={device.name} secondary={device.description} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DeviceList;
