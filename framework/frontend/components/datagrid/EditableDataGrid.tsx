import React, { useState, useCallback } from 'react';
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
}

export interface EditableDataGridProps {
  data: Record<string, any>[];
  columns: GridColumn[];
  onRowAdd?: () => void;
  onRowDelete?: (rowId: number) => void;
  onCellChange?: (rowId: number, column: string, value: any) => void;
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
        setEditingCell({ rowId, column: column.key });
        setEditValue(String(cellValue));
      }
    },
    [data]
  );

  const handleCellChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const handleCellSave = useCallback(() => {
    if (editingCell && onCellChange) {
      onCellChange(editingCell.rowId, editingCell.column, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, onCellChange]);

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
                  className="editable-data-grid__row"
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
                          ? 'editable-data-grid__cell--editing'
                          : ''
                      }`}
                    >
                      {isEditing(rowIndex, column.key) ? (
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
