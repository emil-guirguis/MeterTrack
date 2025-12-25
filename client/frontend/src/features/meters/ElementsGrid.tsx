import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { EditableDataGrid, type GridColumn } from '@framework/components/datagrid/';
import apiClient from '../../services/apiClient';
import './ElementsGrid.css';

export interface MeterElement {
  id: number;
  meter_id: number;
  name: string;
  status: string;
  element: string;
  created_at?: string;
  updated_at?: string;
}

interface UnsavedMeterElement {
  name: string;
  status: string;
  element: string;
}

interface SchemaField {
  type: string;
  label: string;
  readOnly?: boolean;
  required?: boolean;
  enumValues?: string[];
}

interface ElementsGridProps {
  meterId: number;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export const ElementsGrid: React.FC<ElementsGridProps> = ({
  meterId,
  onError,
  onSuccess,
}) => {
  const [elements, setElements] = useState<MeterElement[]>([]);
  const [unsavedRow, setUnsavedRow] = useState<UnsavedMeterElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<Record<string, SchemaField> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'saved' | 'unsaved'; index?: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingUnsavedRow, setSavingUnsavedRow] = useState(false);

  // Build columns from schema
  const columns: GridColumn[] = useMemo(() => {
    if (!schema) return [];
    
    return [
      { key: 'name', label: schema.name?.label || 'Name', editable: !schema.name?.readOnly },
      { key: 'status', label: schema.status?.label || 'Status', editable: !schema.status?.readOnly },
      { key: 'element', label: schema.element?.label || 'Element', editable: !schema.element?.readOnly },
    ];
  }, [schema]);

  // Load schema from backend
  const loadSchema = useCallback(async () => {
    try {
      const response = await apiClient.get(`/meters/${meterId}/elements/schema`);
      const schemaData = response.data.data;
      
      // Extract form fields from schema
      const formFields: Record<string, SchemaField> = {};
      if (schemaData.formFields) {
        Object.entries(schemaData.formFields).forEach(([key, field]: [string, any]) => {
          formFields[key] = {
            type: field.type,
            label: field.label,
            readOnly: field.readOnly,
            required: field.required,
            enumValues: field.enumValues,
          };
        });
      }
      
      setSchema(formFields);
    } catch (err) {
      console.error('Failed to load schema:', err);
      // Continue with default columns if schema fails
      setSchema({
        name: { type: 'STRING', label: 'Name', readOnly: false, required: true },
        status: { type: 'STRING', label: 'Status', readOnly: true, required: false },
        element: { type: 'STRING', label: 'Element', readOnly: false, required: true },
      });
    }
  }, [meterId]);

  // Load elements from backend
  const loadElements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/meters/${meterId}/elements`);
      setElements(response.data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load elements';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [meterId, onError]);

  // Load schema and elements on mount
  useEffect(() => {
    loadSchema();
    loadElements();
  }, [meterId, loadSchema, loadElements]);

  // Handle add button click - insert unsaved row
  const handleAddElement = useCallback(() => {
    setUnsavedRow({
      name: '',
      status: 'active',
      element: '',
    });
  }, []);

  // Handle saving unsaved row
  const handleSaveUnsavedRow = useCallback(async () => {
    if (!unsavedRow) return;

    // Validate required fields
    const validationErrors: Record<string, string> = {};
    if (!unsavedRow.name || unsavedRow.name.trim() === '') {
      validationErrors.name = 'Name is required';
    }
    if (!unsavedRow.element || unsavedRow.element.trim() === '') {
      validationErrors.element = 'Element is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors).join(', '));
      return;
    }

    setSavingUnsavedRow(true);
    try {
      const response = await apiClient.post(`/meters/${meterId}/elements`, {
        name: unsavedRow.name,
        status: unsavedRow.status,
        element: unsavedRow.element,
      });

      setElements([response.data.data, ...elements]);
      setUnsavedRow(null);
      onSuccess?.('Element added successfully');
    } catch (err) {
      // Handle validation errors from backend
      if (err instanceof Error && err.message.includes('Validation failed')) {
        const errorData = (err as any).response?.data;
        if (errorData?.errors) {
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          setError(errorMessages);
        } else {
          setError(err.message);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add element';
        setError(errorMessage);
      }
      onError?.(new Error(err instanceof Error ? err.message : 'Failed to add element'));
    } finally {
      setSavingUnsavedRow(false);
    }
  }, [meterId, unsavedRow, elements, onError, onSuccess]);

  // Handle cell change for unsaved row
  const handleUnsavedRowChange = useCallback((column: string, value: string) => {
    setUnsavedRow((prev) => {
      if (!prev) return null;
      return { ...prev, [column]: value };
    });
  }, []);

  // Handle cell change for saved elements
  const handleCellChange = useCallback(
    async (rowId: number, column: string, value: string) => {
      // Adjust rowId if unsaved row exists (it's at index 0)
      const actualRowId = unsavedRow ? rowId - 1 : rowId;
      const element = elements[actualRowId];
      
      if (!element) return;

      // Validate the change
      if (column === 'name' && (!value || value.trim() === '')) {
        setError('Name is required');
        return;
      }
      if (column === 'element' && (!value || value.trim() === '')) {
        setError('Element is required');
        return;
      }

      // Optimistic update
      const updatedElements = [...elements];
      (updatedElements[actualRowId] as any)[column] = value;
      setElements(updatedElements);

      try {
        await apiClient.put(`/meters/${meterId}/elements/${element.id}`, {
          [column]: value,
        });
        onSuccess?.('Element updated successfully');
      } catch (err) {
        // Revert on error
        setElements(elements);
        
        // Handle validation errors from backend
        if (err instanceof Error && err.message.includes('Validation failed')) {
          const errorData = (err as any).response?.data;
          if (errorData?.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ');
            setError(errorMessages);
          } else {
            setError(err.message);
          }
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Failed to update element';
          setError(errorMessage);
        }
        onError?.(new Error(err instanceof Error ? err.message : 'Failed to update element'));
      }
    },
    [meterId, elements, unsavedRow, onError, onSuccess]
  );

  // Handle delete
  const handleDeleteElement = useCallback(async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'unsaved') {
      setUnsavedRow(null);
      setDeleteConfirm(null);
      return;
    }

    const element = elements[deleteConfirm.index || 0];
    if (!element) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/meters/${meterId}/elements/${element.id}`);
      setElements(elements.filter((e) => e.id !== element.id));
      setDeleteConfirm(null);
      onSuccess?.('Element deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete element';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setDeleting(false);
    }
  }, [meterId, deleteConfirm, elements, onError, onSuccess]);

  // Build grid data with unsaved row at top
  const gridData = useMemo(() => {
    const data: any[] = [];
    
    if (unsavedRow) {
      data.push({
        id: 'unsaved',
        name: unsavedRow.name,
        status: unsavedRow.status,
        element: unsavedRow.element,
        _isUnsaved: true,
      });
    }
    
    elements.forEach((element) => {
      data.push({
        id: element.id,
        name: element.name,
        status: element.status,
        element: element.element,
      });
    });
    
    return data;
  }, [elements, unsavedRow]);

  // Handle row delete from grid
  const handleRowDelete = useCallback((rowId: number) => {
    if (unsavedRow && rowId === 0) {
      setDeleteConfirm({ type: 'unsaved' });
    } else {
      const actualRowId = unsavedRow ? rowId - 1 : rowId;
      setDeleteConfirm({ type: 'saved', index: actualRowId });
    }
  }, [unsavedRow]);

  return (
    <div className="elements-grid">
      {/* Unsaved Row Editor */}
      {unsavedRow && (
        <div className="elements-grid__unsaved-row">
          <div className="elements-grid__unsaved-row-content">
            <input
              type="text"
              placeholder="Name"
              value={unsavedRow.name}
              onChange={(e) => handleUnsavedRowChange('name', e.target.value)}
              className="elements-grid__unsaved-input"
            />
            <select
              value={unsavedRow.status}
              onChange={(e) => handleUnsavedRowChange('status', e.target.value)}
              className="elements-grid__unsaved-input"
              disabled
              aria-label="Status"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input
              type="text"
              placeholder="Element"
              value={unsavedRow.element}
              onChange={(e) => handleUnsavedRowChange('element', e.target.value)}
              className="elements-grid__unsaved-input"
            />
            <div className="elements-grid__unsaved-actions">
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveUnsavedRow}
                disabled={savingUnsavedRow || !unsavedRow.name || !unsavedRow.element}
              >
                {savingUnsavedRow ? <CircularProgress size={20} /> : 'Save'}
              </Button>
              <Button
                size="small"
                onClick={() => setUnsavedRow(null)}
                disabled={savingUnsavedRow}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <EditableDataGrid
        data={gridData}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadElements}
        onRowAdd={handleAddElement}
        onRowDelete={handleRowDelete}
        onCellChange={handleCellChange}
        emptyMessage="No elements associated with this meter"
        addButtonLabel="Add Element"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle>Delete Element</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this element?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={handleDeleteElement}
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

export default ElementsGrid;
