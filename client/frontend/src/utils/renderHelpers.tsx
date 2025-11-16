/**
 * Render helper functions for list cells
 * Temporary helpers until full framework migration
 */

import React from 'react';

export function renderTwoLineCell(primary: string, secondary: string) {
  return (
    <div>
      <div>{primary}</div>
      <div style={{ fontSize: '0.875rem', color: '#666' }}>{secondary}</div>
    </div>
  );
}

export function renderStatusBadge(status: string) {
  const colors: Record<string, string> = {
    active: '#4caf50',
    inactive: '#9e9e9e',
    pending: '#ff9800',
    draft: '#2196f3',
  };
  
  return (
    <span
      style={{
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: colors[status] || '#9e9e9e',
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: 500,
      }}
    >
      {status}
    </span>
  );
}

export function renderDateCell(date: string | Date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString();
}
