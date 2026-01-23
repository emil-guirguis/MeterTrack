import React from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import { useBaseList } from '@framework/components/list/hooks';
import { useAuth } from '../../hooks/useAuth';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import type { MeterReading } from './meterReadingConfig';
import { Permission } from '../../types/auth';
import {
  meterReadingColumns,
  meterReadingFilters,
  meterReadingStats,
  meterReadingExportConfig,
} from './meterReadingConfig';
import '@framework/components/common/TableCellStyles.css';
import './MeterReadingList.css';

interface MeterReadingListProps {
  onMeterReadingSelect?: (reading: MeterReading) => void;
}

export const MeterReadingList: React.FC<MeterReadingListProps> = ({
  onMeterReadingSelect,
}) => {
  const meterReadings = useMeterReadingsEnhanced();
  const auth = useAuth();
  const { selectedMeter, selectedElement } = useMeterSelection();
  
  // Initialize base list hook with meter reading configuration
  // Note: Read-only - no create/edit/delete operations
  const baseList = useBaseList<MeterReading, any>({
    entityName: 'meter reading',
    entityNamePlural: 'meter readings',
    useStore: useMeterReadingsEnhanced,
    features: {
      allowCreate: false,      // Read-only
      allowEdit: false,        // Read-only
      allowDelete: false,      // Read-only
      allowBulkActions: false, // Read-only
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.METER_READ,
      update: Permission.METER_READ,
      delete: Permission.METER_READ,
    },
    columns: meterReadingColumns,
    filters: meterReadingFilters,
    stats: meterReadingStats,
    bulkActions: [],
    export: meterReadingExportConfig,
    authContext: auth,
  });

  /**
   * Check for missing tenantId
   * 
   * Validates: Requirements 5.3, 6.1
   */
  const tenantError = React.useMemo(() => {
    if (!auth.user?.client) {
      return 'Unable to load meter readings - tenant information missing. Please log out and log back in.';
    }
    return null;
  }, [auth.user?.client]);

  /**
   * Memoized filtered data based on selected meter and element
   * 
   * This prevents unnecessary re-renders by only recomputing when:
   * - baseList.data changes (new data from store)
   * - baseList.loading changes (loading state)
   * - selectedMeter changes (user selects different meter)
   * - selectedElement changes (user selects different element)
   * 
   * Validates: Requirements 2.1, 2.3, 3.1
   */
  const filteredData = React.useMemo(() => {
    // If data is still loading, return empty array to show loading state
    if (baseList.loading) {
      return [];
    }
    
    // If no meter is selected, return all data
    if (!selectedMeter) {
      return baseList.data;
    }

    // Filter by selected meter and optionally by selected element
    const filtered = baseList.data.filter((reading: any) => {
      // Try both meterId and meter_id field names, convert to string for comparison
      const readingMeterId = String(reading.meterId || reading.meter_id || '');
      const meterMatch = readingMeterId === selectedMeter;
      
      if (!selectedElement) {
        return meterMatch;
      }
      
      // Try both meterElementId and meter_element_id field names, convert to string for comparison
      const readingElementId = String(reading.meterElementId || reading.meter_element_id || '');
      return meterMatch && readingElementId === selectedElement;
    });
    
    return filtered;
  }, [baseList.data, baseList.loading, selectedMeter, selectedElement]);

  /**
   * Memoized title that displays selected meter and element information
   * 
   * Validates: Requirement 1.3
   */
  const title = React.useMemo(() => {
    if (!selectedMeter) {
      return 'Meter Readings';
    }
    
    if (selectedElement) {
      return `Meter Readings - Meter ${selectedMeter} / Element ${selectedElement}`;
    }
    
    return `Meter Readings - Meter ${selectedMeter}`;
  }, [selectedMeter, selectedElement]);

  /**
   * Memoized empty state message based on selection state
   * 
   * Shows different messages depending on:
   * - No meter selected: prompts user to select a meter
   * - Meter selected but no data: indicates no readings found
   * 
   * Validates: Requirements 2.4, 3.3
   */
  const emptyMessage = React.useMemo(() => {
    if (!selectedMeter) {
      return 'No meter readings found. Select a meter from the sidebar to view readings.';
    }
    
    if (selectedElement) {
      return `No meter readings found for meter ${selectedMeter} and element ${selectedElement}.`;
    }
    
    return `No meter readings found for meter ${selectedMeter}.`;
  }, [selectedMeter, selectedElement]);

  /**
   * Determine which error to display
   * Priority: tenantError > API error > none
   * 
   * Validates: Requirements 5.3, 6.1, 6.2
   */
  const displayError = tenantError || baseList.error;

  /**
   * Handle retry button click
   * Re-fetches data from the store
   * 
   * Validates: Requirements 6.4
   */
  const handleRetry = () => {
    baseList.clearError?.();
    meterReadings.fetchItems({
      tenantId: auth.user?.client,
      meterId: selectedMeter,
      meterElementId: selectedElement,
    });
  };

  return (
    <div className="meter-reading-list">
      {displayError && (
        <div className="error-container">
          <div className="error-message">{displayError}</div>
          <button onClick={handleRetry} className="retry-button">
            Retry
          </button>
        </div>
      )}
      <BaseList
        title={title}
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={filteredData}
        columns={baseList.columns}
        loading={baseList.loading}
        error={null}
        emptyMessage={emptyMessage}
        // onSelect={onMeterReadingSelect}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
