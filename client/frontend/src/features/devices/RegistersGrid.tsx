import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { EditableDataGrid, type GridColumn } from '@framework/components/datagrid/';
import apiClient from '../../services/apiClient';
import './RegistersGrid.css';

export interface Register {
  id: number;
  register: string;
  name: string;
  unit: string;
  field_name: string;
}

export interface DeviceRegister {
  id: number;
  device_id: number;
  register_id: number;
  created_at: string;
  updated_at: string;
  register?: Register;
}

interface RegistersGridProps {
  deviceId: number;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export const RegistersGrid: React.FC<RegistersGridProps> = ({
  deviceId,
  onError,
  onSuccess,
}) => {
  const [registers, setRegisters] = useState<DeviceRegister[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableRegisters, setAvailableRegisters] = useState<Register[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<number | null>(null);
  const [addingRegister, setAddingRegister] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeviceRegister | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns: GridColumn[] = [
    { key: 'register', label: 'Register', editable: true, type: 'text' },
    { key: 'name', label: 'Name', editable: true, type: 'text' },
    { key: 'unit', label: 'Unit', editable: true, type: 'text' },
    { key: 'field_name', label: 'Field Name', editable: true, type: 'text' },
  ];

  const loadRegisters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/devices/${deviceId}/registers`);
      setRegisters(response.data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load registers';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [deviceId, onError]);

  const loadAvailableRegisters = useCallback(async () => {
    try {
      const response = await apiClient.get('/registers');
      const existingIds = new Set(registers.map((r) => r.register_id));
      const available = (response.data.data || []).filter(
        (r: Register) => !existingIds.has(r.id)
      );
      setAvailableRegisters(available);
    } catch (err) {
      console.error('Failed to load available registers:', err);
    }
  }, [registers]);

  useEffect(() => {
    loadRegisters();
  }, [deviceId, loadRegisters]);

  const handleAddRegister = useCallback(async () => {
    if (!selectedRegister) return;

    setAddingRegister(true);
    try {
      const response = await apiClient.post(`/devices/${deviceId}/registers`, {
        register_id: selectedRegister,
      });

      setRegisters([...registers, response.data.data]);
      setShowAddModal(false);
      setSelectedRegister(null);
      onSuccess?.('Register added successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add register';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setAddingRegister(false);
    }
  }, [deviceId, selectedRegister, registers, onError, onSuccess]);

  const handleDeleteRegister = useCallback(async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await apiClient.delete(
        `/devices/${deviceId}/registers/${deleteConfirm.register_id}`
      );

      setRegisters(registers.filter((r) => r.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      onSuccess?.('Register deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete register';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setDeleting(false);
    }
  }, [deviceId, deleteConfirm, registers, onError, onSuccess]);

  const handleCellChange = useCallback(
    async (rowId: number, column: string, value: string) => {
      const register = registers[rowId];
      if (!register) return;

      try {
        await apiClient.put(
          `/devices/${deviceId}/registers/${register.register_id}`,
          { [column]: value }
        );

        const updatedRegisters = [...registers];
        if (updatedRegisters[rowId].register) {
          (updatedRegisters[rowId].register as any)[column] = value;
        }
        setRegisters(updatedRegisters);
        onSuccess?.('Register updated successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update register';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      }
    },
    [deviceId, registers, onError, onSuccess]
  );

  const gridData = registers.map((dr) => ({
    id: dr.id,
    register: dr.register?.register || '',
    name: dr.register?.name || '',
    unit: dr.register?.unit || '',
    field_name: dr.register?.field_name || '',
  }));

  return (
    <div className="registers-grid">
      <EditableDataGrid
        data={gridData}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadRegisters}
        onRowAdd={() => {
          loadAvailableRegisters();
          setShowAddModal(true);
        }}
        onRowDelete={(rowId) => {
          setDeleteConfirm(registers[rowId]);
        }}
        onCellChange={handleCellChange}
        emptyMessage="No registers associated with this device"
        addButtonLabel="Add Register"
      />

      {/* Add Register Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Register</DialogTitle>
        <DialogContent>
          {availableRegisters.length === 0 ? (
            <Alert severity="info">No available registers to add</Alert>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Register</InputLabel>
              <Select
                value={selectedRegister || ''}
                onChange={(e) => setSelectedRegister(Number(e.target.value))}
                label="Select Register"
              >
                {availableRegisters.map((reg) => (
                  <MenuItem key={reg.id} value={reg.id}>
                    {reg.register} - {reg.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button
            onClick={handleAddRegister}
            variant="contained"
            disabled={!selectedRegister || addingRegister}
          >
            {addingRegister ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle>Delete Register</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this register?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={handleDeleteRegister}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RegistersGrid;
