import React, { useState, useCallback, useRef } from 'react';
import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Box,
  Paper,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import './EditableDataGrid.css';

export interface GridColumn {
  key: string;
  label: string;
  editable?: boolean;
  type?: 'text' | 'number' | 'select';
  width?: string;
  options?: string[];
}

export interface EditableDataGridProps {
  data: Record<string, any>[];
  columns: GridColumn[];
  onRowAdd?: () => void;
  onRowDelete?: (rowId: number) => void;
  onCellChange?: (rowId: number, column: string, value: any) => void;
  onCellBlur?: (rowId: number, column: string, value: any) => void;
  onCellValidate?: (rowId: number, column: string, value: any) => boolean; // Returns true if valid
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  addButtonLabel?: string;
}

interface EditingCell {
  rowId: number;
  column: string;
}

export const EditableDataGrid: React.FC<EditableDataGridProps> = ({
  data,
  columns,
  onRowAdd,
  onRowDelete,
  onCellChange,
  onCellBlur,
  onCellValidate,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No data available',
  addButtonLabel = 'Add',
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const selectRef = useRef<HTMLSelectElement>(null);
  const cellRef = useRef<HTMLTableCellElement>(null);
  const [selectPosition, setSelectPosition] = useState<{ top: number; left: number } | null>(null);

  const handleCellClick = useCallback(
    (rowId: number, column: GridColumn) => {
      if (column.editable !== false) {
        const cellValue = data[rowId]?.[column.key] ?? '';
        const trimmedValue = String(cellValue).trim();
        setEditingCell({ rowId, column: column.key });
        setEditValue(trimmedValue);
      }
    },
    [data]
  );

  // Calculate select position when editing a select cell
  React.useEffect(() => {
    if (editingCell && cellRef.current) {
      const column = columns.find(col => col.key === editingCell.column);
      if (column?.type === 'select') {
        const rect = cellRef.current.getBoundingClientRect();
        setSelectPosition({
          top: rect.top - 200,
          left: rect.left,
        });
      }
    } else {
      setSelectPosition(null);
    }
  }, [editingCell, columns]);

  const handleCellChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const handleCellSave = useCallback((valueOverride?: string) => {
    if (editingCell && onCellChange) {
      const finalValue = valueOverride !== undefined ? valueOverride : editValue;
      onCellChange(editingCell.rowId, editingCell.column, finalValue);
      onCellBlur?.(editingCell.rowId, editingCell.column, finalValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, onCellChange, onCellBlur]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        handleCellSave();
      } else if (e.key === 'Escape') {
        handleCellCancel();
      }
    },
    [handleCellSave, handleCellCancel]
  );

  const isEditing = (rowId: number, column: string) =>
    editingCell?.rowId === rowId && editingCell?.column === column;

  return (
    <Box className="editable-data-grid">
      {/* Header with Add Button */}
      <Box className="editable-data-grid__header">
        <Button
          variant="contained"
          color="primary"
          onClick={onRowAdd}
          disabled={loading}
          className="editable-data-grid__add-button"
        >
          {addButtonLabel}
        </Button>
        {loading && (
          <CircularProgress
            size={24}
            className="editable-data-grid__loading"
          />
        )}
      </Box>

      {/* Error State */}
      {error && (
        <Alert
          severity="error"
          onClose={onRetry ? () => onRetry() : undefined}
          className="editable-data-grid__error"
        >
          {error}
          {onRetry && (
            <Button
              size="small"
              onClick={onRetry}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          )}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} className="editable-data-grid__table">
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  style={{ width: column.width }}
                  className="editable-data-grid__header-cell"
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell
                style={{ width: '60px' }}
                className="editable-data-grid__header-cell"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  align="center"
                  className="editable-data-grid__empty"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => {
                // Generate stable key from row data
                const rowKey = row.id ? String(row.id) : `row-${rowIndex}-${JSON.stringify(row).substring(0, 20)}`;
                return (
                <TableRow
                  key={rowKey}
                  className={`editable-data-grid__row ${row._isUnsaved ? '_unsaved' : ''}`}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${rowIndex}-${column.key}`}
                      ref={isEditing(rowIndex, column.key) ? cellRef : null}
                      onClick={() => handleCellClick(rowIndex, column)}
                      data-select-cell={column.type === 'select' ? 'true' : 'false'}
                      className={`editable-data-grid__cell ${
                        column.editable !== false
                          ? 'editable-data-grid__cell--editable'
                          : ''
                      } ${
                        isEditing(rowIndex, column.key)
                          ? `editable-data-grid__cell--editing ${column.type === 'select' ? 'editable-data-grid__cell--editing-select' : ''}`
                          : ''
                      }`}
                    >
                      {isEditing(rowIndex, column.key) ? (
                        <>
                          {column.type === 'select' && column.options ? (
                          <div style={{ visibility: 'hidden', height: '0' }}>
                            <select
                              ref={selectRef}
                              autoFocus
                              size={Math.min(10, (column.options?.length || 0) + 1)}
                              value={editValue}
                              title="Select element"
                              onChange={(e) => {
                                const newValue = e.target.value;
                                
                                // Validate before saving
                                if (editingCell && onCellValidate) {
                                  const isValid = onCellValidate(editingCell.rowId, editingCell.column, newValue);
                                  if (!isValid) {
                                    // Validation failed - keep select open, reset to previous value
                                    setEditValue(editValue);
                                    return;
                                  }
                                }
                                
                                // Save immediately after selection
                                if (editingCell && onCellChange) {
                                  onCellChange(editingCell.rowId, editingCell.column, newValue);
                                  onCellBlur?.(editingCell.rowId, editingCell.column, newValue);
                                }
                                
                                // Clear editing state
                                setEditingCell(null);
                                setEditValue('');
                              }}
                              onBlur={() => {
                                setEditingCell(null);
                                setEditValue('');
                              }}
                              className="editable-data-grid__select"
                            >
                              <option value="">Select...</option>
                              {column.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <TextField
                            autoFocus
                            value={editValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCellChange(e.target.value)}
                            onBlur={() => handleCellSave()}
                            onKeyDown={handleKeyDown}
                            size="small"
                            variant="outlined"
                            fullWidth
                            className="editable-data-grid__input"
                          />
                        )}
                        </>
                      ) : (
                        <div className="editable-data-grid__cell-content">
                          <span>{row[column.key]}</span>
                          {column.type === 'select' && <span className="editable-data-grid__cell-dropdown-icon">▼</span>}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  <TableCell
                    align="center"
                    className="editable-data-grid__actions-cell"
                  >
                    <IconButton
                      size="small"
                      onClick={() => onRowDelete?.(rowIndex)}
                      className="editable-data-grid__delete-button"
                      title="Delete row"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Floating Select Dropdown */}
      {selectPosition && editingCell && (
        <select
          ref={selectRef}
          autoFocus
          value={editValue}
          aria-label="Select element"
          onChange={(e) => {
            const newValue = e.target.value;
            
            // Validate before saving
            if (editingCell && onCellValidate) {
              const isValid = onCellValidate(editingCell.rowId, editingCell.column, newValue);
              if (!isValid) {
                // Validation failed - keep select open, reset to previous value
                // The toast is already shown by onCellValidate
                setEditValue(editValue);
                // Re-focus the select to keep it open
                setTimeout(() => {
                  selectRef.current?.focus();
                }, 0);
                return;
              }
            }
            
            // Save immediately after selection
            if (editingCell && onCellChange) {
              onCellChange(editingCell.rowId, editingCell.column, newValue);
              onCellBlur?.(editingCell.rowId, editingCell.column, newValue);
            }
            
            // Clear editing state
            setEditingCell(null);
            setEditValue('');
          }}
          onBlur={() => {
            setEditingCell(null);
            setEditValue('');
          }}
          className="editable-data-grid__select"
          style={{
            position: 'fixed',
            top: `${selectPosition.top}px`,
            left: `${selectPosition.left}px`,
            width: '200px',
            padding: '8px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '2px solid #1976d2',
            borderRadius: '4px',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          size={Math.min(10, (columns.find(c => c.key === editingCell.column)?.options?.length || 0) + 1)}
          title="Select element"
        >
          <option value="">Select...</option>
          {columns.find(c => c.key === editingCell.column)?.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </Box>
  );
};

export default EditableDataGrid;
