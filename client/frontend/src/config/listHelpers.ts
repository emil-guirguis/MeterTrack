/**
 * List configuration helper functions
 * Temporary helpers until full framework migration
 */

import type { ColumnDefinition, FilterDefinition } from '../types/list';
import type { BulkActionConfig, ExportConfig } from '../types/list';

// Column helpers
export function createTwoLineColumn<T>(
  id: string,
  header: string,
  primaryField: keyof T,
  secondaryField: keyof T,
  options?: any
): ColumnDefinition<T> {
  return {
    id,
    header,
    accessor: primaryField as string,
    cell: (row: T) => ({
      primary: String(row[primaryField]),
      secondary: String(row[secondaryField])
    }),
    ...options
  };
}

export function createStatusColumn<T>(
  id: string,
  header: string,
  options?: any
): ColumnDefinition<T> {
  return {
    id,
    header,
    accessor: id,
    ...options
  };
}

export function createDateColumn<T>(
  id: string,
  header: string,
  options?: any
): ColumnDefinition<T> {
  return {
    id,
    header,
    accessor: id,
    ...options
  };
}

export function createLocationColumn<T>(
  id: string,
  header: string,
  options?: any
): ColumnDefinition<T> {
  return {
    id,
    header,
    accessor: id,
    ...options
  };
}

export function createBadgeListColumn<T>(
  id: string,
  header: string,
  options?: any
): ColumnDefinition<T> {
  return {
    id,
    header,
    accessor: id,
    ...options
  };
}

export function createPhoneColumn<T>(
  id: string,
  header: string,
  options?: any
): ColumnDefinition<T> {
  return {
    id,
    header,
    accessor: id,
    ...options
  };
}

// Filter helpers
export function createStatusFilter(
  id: string,
  label: string,
  options?: any
): FilterDefinition {
  return {
    id,
    label,
    type: 'select',
    ...options
  };
}

export function createRoleFilter(
  id: string,
  label: string,
  options?: any
): FilterDefinition {
  return {
    id,
    label,
    type: 'select',
    ...options
  };
}

// Bulk action helpers
export function createStandardStatusActions<T>(options?: any): BulkActionConfig<T>[] {
  return [];
}

export function createExportAction<T>(options?: any): BulkActionConfig<T> {
  return {
    id: 'export',
    label: 'Export',
    icon: 'download',
    action: async () => {},
    ...options
  };
}
