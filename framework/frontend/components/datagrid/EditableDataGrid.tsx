import React, { useState, useCallback } from 'react';
import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Select,
  MenuItem,
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
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No data available',
  addButtonLabel = 'Add',
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleCellClick = useCallback(
    (rowId: number, column: GridColumn) => {
      if (column.editable !== false) {
        const cellValue = data[rowId]?.[column.key] ?? '';
        const trimmedValue = String(cellValue).trim(); // Trim whitespace
        console.log('🔍 Cell clicked:', { rowId, column: column.key, cellValue, trimmedValue });
        setEditingCell({ rowId, column: column.key });
        setEditValue(trimmedValue);
      }
    },
    [data]
  );

  const handleCellChange = useCallback((value: string) => {
    console.log('🔍 handleCellChange called with:', value);
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
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={`editable-data-grid__row ${row._isUnsaved ? '_unsaved' : ''}`}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${rowIndex}-${column.key}`}
                      onClick={() => handleCellClick(rowIndex, column)}
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
                          {console.log('🔍 Editing cell:', { rowIndex, column: column.key, editValue, columnType: column.type, options: column.options })}
                          {column.type === 'select' && column.options ? (
                          <Select
                            autoFocus
                            value={editValue}
                            onChange={(e) => {
                              console.log('🔍 Select changed:', e.target.value);
                              const newValue = e.target.value;
                              handleCellChange(newValue);
                              // Immediately save the value when selected from dropdown
                              handleCellSave(newValue);
                            }}
                            size="small"
                            variant="outlined"
                            fullWidth
                            className="editable-data-grid__select"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: '#ffffff !important',
                              },
                              '& .MuiSelect-select': {
                                color: '#000000 !important',
                                backgroundColor: '#ffffff !important',
                              },
                              '& .MuiOutlinedInput-input': {
                                color: '#000000 !important',
                              },
                            }}
                          >
                            {column.options.map((option) => {
                              console.log('🔍 Rendering option:', option);
                              return (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        ) : (
                          <TextField
                            autoFocus
                            value={editValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCellChange(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={handleKeyDown}
                            size="small"
                            variant="outlined"
                            fullWidth
                            className="editable-data-grid__input"
                          />
                        )}
                        </>
                      ) : (
                        row[column.key]
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EditableDataGrid;
