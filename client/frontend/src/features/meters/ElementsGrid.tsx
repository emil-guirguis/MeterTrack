import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { EditableDataGrid, type GridColumn } from '@framework/components/datagrid/';
import apiClient from '../../services/apiClient';
import './ElementsGrid.css';

export interface MeterElement {
  id: number;
  meter_id: number;
  name: string;
  element: string;
  created_at?: string;
  updated_at?: string;
}

interface UnsavedMeterElement {
  name: string;
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
  const [pendingChanges, setPendingChanges] = useState<Record<string, { rowId: number; column: string; value: string }>>({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  // Build columns from schema
  const columns: GridColumn[] = useMemo(() => {
    if (!schema) return [];
    
    const elementOptions = schema.element?.enumValues || [];
    
    const cols: GridColumn[] = [
      { 
        key: 'element', 
        label: schema.element?.label || 'Element', 
        editable: !schema.element?.readOnly,
        type: elementOptions.length > 0 ? 'select' : 'text',
        options: elementOptions.length > 0 ? elementOptions : undefined,
      },
      { 
        key: 'name', 
        label: schema.name?.label || 'Name', 
        editable: !schema.name?.readOnly,
        type: 'text',
      },
    ];
    
    return cols;
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
        element: { 
          type: 'STRING', 
          label: 'Element', 
          readOnly: false, 
          required: true,
          enumValues: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
        },
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
      setError(null); // Clear any previous errors
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
      const errorMsg = Object.values(validationErrors).join(', ');
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastSeverity('error');
      setToastOpen(true);
      return;
    }

    try {
      const response = await apiClient.post(`/meters/${meterId}/elements`, {
        name: unsavedRow.name,
        element: unsavedRow.element,
      });

      setElements([response.data.data, ...elements]);
      setUnsavedRow(null);
      setError(null); // Clear error on success
      setToastMessage('Element added successfully');
      setToastSeverity('success');
      setToastOpen(true);
      onSuccess?.('Element added successfully');
    } catch (err) {
      // Handle validation errors from backend
      let errorMessage = 'Failed to add element';
      const errorResponse = (err as any).response?.data;
      
      if (errorResponse?.errors) {
        // Extract error messages from validation errors
        errorMessage = Object.entries(errorResponse.errors)
          .map(([field, message]) => `${message}`)
          .join(', ');
      } else if (errorResponse?.message) {
        // Use the message field if available
        errorMessage = errorResponse.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setToastMessage(errorMessage);
      setToastSeverity('error');
      setToastOpen(true);
      onError?.(new Error(errorMessage));
    }
  }, [meterId, unsavedRow, elements, onError, onSuccess]);

  // Handle cell change for unsaved row
  const handleUnsavedRowChange = useCallback((column: string, value: string) => {
    setUnsavedRow((prev) => {
      if (!prev) return null;
      return { ...prev, [column]: value };
    });
  }, []);

  // Save pending changes when cell loses focus
  const handleSavePendingChange = useCallback(
    async (rowId: number, column: string, value: string) => {
      // Adjust rowId if unsaved row exists (it's at index 0)
      const actualRowId = unsavedRow ? rowId - 1 : rowId;
      const element = elements[actualRowId];
      
      if (!element) return;

      // UI is already updated optimistically in handleCellChange, just save to backend
      try {
        await apiClient.put(`/meters/${meterId}/elements/${element.id}`, {
          [column]: value,
        });
        setError(null); // Clear error on success
        setToastMessage('Element updated successfully');
        setToastSeverity('success');
        setToastOpen(true);
        onSuccess?.('Element updated successfully');
      } catch (err) {
        // Revert on error - find the original value and restore it
        const originalValue = (element as any)[column];
        const revertedElements = [...elements];
        (revertedElements[actualRowId] as any)[column] = originalValue;
        setElements(revertedElements);
        
        // Handle validation errors from backend
        let errorMessage = 'Failed to update element';
        const errorResponse = (err as any).response?.data;
        
        if (errorResponse?.errors) {
          // Extract error messages from validation errors
          errorMessage = Object.entries(errorResponse.errors)
            .map(([field, message]) => `${message}`)
            .join(', ');
        } else if (errorResponse?.message) {
          // Use the message field if available
          errorMessage = errorResponse.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setToastMessage(errorMessage);
        setToastSeverity('error');
        setToastOpen(true);
        onError?.(new Error(errorMessage));
      }
    },
    [meterId, elements, unsavedRow, onError, onSuccess]
  );

  // Handle cell change for saved elements
  const handleCellChange = useCallback(
    (rowId: number, column: string, value: string) => {
      // Check if this is the unsaved row
      if (unsavedRow && rowId === 0) {
        handleUnsavedRowChange(column, value);
        return;
      }

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

      setError(null);

      // Immediately update UI (optimistic update)
      const updatedElements = [...elements];
      (updatedElements[actualRowId] as any)[column] = value;
      setElements(updatedElements);

      // Store pending change (will be saved on blur)
      const changeKey = `${rowId}-${column}`;
      setPendingChanges((prev) => ({
        ...prev,
        [changeKey]: { rowId, column, value },
      }));

      // Don't do optimistic update here - wait for blur
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
      setError(null); // Clear error on success
      setToastMessage('Element deleted successfully');
      setToastSeverity('success');
      setToastOpen(true);
      onSuccess?.('Element deleted successfully');
    } catch (err) {
      let errorMessage = 'Failed to delete element';
      const errorResponse = (err as any).response?.data;
      
      if (errorResponse?.errors) {
        errorMessage = Object.entries(errorResponse.errors)
          .map(([field, message]) => `${message}`)
          .join(', ');
      } else if (errorResponse?.message) {
        errorMessage = errorResponse.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setToastMessage(errorMessage);
      setToastSeverity('error');
      setToastOpen(true);
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
        element: unsavedRow.element,
        _isUnsaved: true,
      });
    }
    
    elements.forEach((element) => {
      data.push({
        id: element.id,
        name: element.name,
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
      <EditableDataGrid
        data={gridData}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={loadElements}
        onRowAdd={handleAddElement}
        onRowDelete={handleRowDelete}
        onCellChange={handleCellChange}
        onCellValidate={(rowId, column, value) => {
          // Validate element uniqueness
          if (column === 'element' && value) {
            console.log('🔍 Validating element:', { rowId, value, unsavedRow, elementsCount: elements.length, allElements: elements.map(e => ({ id: e.id, element: e.element })) });
            
            // Check if this is the unsaved row (only if unsavedRow exists and rowId is 0)
            if (unsavedRow && rowId === 0) {
              // For unsaved row, check against all saved elements
              const isDuplicate = elements.some((el) => el.element === value);
              console.log('✅ Unsaved row check:', { isDuplicate, value });
              if (isDuplicate) {
                const errorMsg = `Element "${value}" is already assigned to this meter`;
                setToastMessage(errorMsg);
                setToastSeverity('error');
                setToastOpen(true);
                return false;
              }
            } else {
              // For saved rows, adjust rowId based on whether unsavedRow exists
              const actualRowId = unsavedRow ? rowId - 1 : rowId;
              const element = elements[actualRowId];
              console.log('✅ Saved row check:', { actualRowId, element, value, allElements: elements.map(e => e.element) });
              if (element) {
                // Check against other saved elements (excluding current element)
                const isDuplicate = elements.some((el) => el.id !== element.id && el.element === value);
                console.log('❌ Duplicate check result:', isDuplicate);
                if (isDuplicate) {
                  const errorMsg = `Element "${value}" is already assigned to this meter`;
                  setToastMessage(errorMsg);
                  setToastSeverity('error');
                  setToastOpen(true);
                  return false;
                }
                // Check against unsaved row if it exists
                if (unsavedRow && unsavedRow.element === value) {
                  const errorMsg = `Element "${value}" is already assigned to this meter`;
                  setToastMessage(errorMsg);
                  setToastSeverity('error');
                  setToastOpen(true);
                  return false;
                }
              }
            }
          }
          return true;
        }}
        onCellBlur={(rowId, column, value) => {
          // Auto-save unsaved row when user leaves a cell
          if (unsavedRow && rowId === 0 && unsavedRow.name && unsavedRow.element) {
            handleSaveUnsavedRow();
          }
          // Auto-save saved row when user leaves a cell
          else if (!unsavedRow || rowId > 0) {
            const changeKey = `${rowId}-${column}`;
            if (pendingChanges[changeKey]) {
              handleSavePendingChange(rowId, column, value);
              // Remove from pending changes after saving
              setPendingChanges((prev) => {
                const updated = { ...prev };
                delete updated[changeKey];
                return updated;
              });
            }
          }
        }}
        emptyMessage="No elements associated with this meter"
        addButtonLabel="Add"
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

      {/* Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ElementsGrid;
