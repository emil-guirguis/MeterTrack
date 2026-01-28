import React from 'react';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import { useAuth } from '../../hooks/useAuth';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import { SimpleMeterReadingGrid } from './SimpleMeterReadingGrid';
import './MeterReadingList.css';

interface MeterReadingListProps {
  onMeterReadingSelect?: (reading: any) => void;
  gridType?: 'simple' | 'baselist';
  onGridTypeChange?: (type: 'simple' | 'baselist') => void;
}

export const MeterReadingList: React.FC<MeterReadingListProps> = ({
  gridType = 'simple',
  onGridTypeChange,
}) => {
  const meterReadings = useMeterReadingsEnhanced();
  const auth = useAuth();
  const { selectedMeter, selectedElement } = useMeterSelection();

  /**
   * Check for missing tenantId
   */
  const tenantError = React.useMemo(() => {
    if (!auth.user?.client) {
      return 'Unable to load meter readings - tenant information missing. Please log out and log back in.';
    }
    return null;
  }, [auth.user?.client]);

  /**
   * Memoized filtered data based on selected meter and element
   */
  const filteredData = React.useMemo(() => {
    if (meterReadings.loading) {
      return meterReadings.items;
    }

    if (!selectedMeter) {
      return meterReadings.items;
    }

    // Filter by selected meter and optionally by selected element
    const filtered = meterReadings.items.filter((reading: any) => {
      const readingMeterId = String(reading.meter_id || '');
      const meterMatch = readingMeterId === selectedMeter;

      if (!selectedElement) {
        return meterMatch;
      }

      const readingElementId = String(reading.meter_element_id || '');
      return meterMatch && readingElementId === selectedElement;
    });

    console.log('[MeterReadingList] Filtering with selectedMeter:', selectedMeter, 'selectedElement:', selectedElement);
    console.log('[MeterReadingList] Total items:', meterReadings.items.length);
    console.log('[MeterReadingList] Filtered items:', filtered.length);
    if (meterReadings.items.length > 0) {
      console.log('[MeterReadingList] First item:', meterReadings.items[0]);
    }

    return filtered;
  }, [meterReadings.items, meterReadings.loading, selectedMeter, selectedElement]);

  /**
   * Memoized title
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
   * Memoized empty state message
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
   */
  const displayError = tenantError || meterReadings.error;

  /**
   * Handle retry button click
   */
  const handleRetry = () => {
    meterReadings.clearError();
    meterReadings.fetchItems({
      tenantId: auth.user?.client,
      meterId: selectedMeter,
      meterElementId: selectedElement,
    });
  };

  /**
   * Handle grid type change
   */
  const handleGridTypeChange = (type: 'simple' | 'baselist') => {
    onGridTypeChange?.(type);
  };

  // If gridType is 'baselist', render the old BaseList component
  if (gridType === 'baselist') {
    return (
      <div className="meter-reading-list">
        <div className="meter-reading-list__header">
          <h2>{title}</h2>
          <button onClick={() => handleGridTypeChange('simple')} className="meter-reading-list__switch-btn" type="button">
            Switch to Simple Grid
          </button>
        </div>
        {displayError && (
          <div className="meter-reading-list__error">
            <p>{displayError}</p>
            <button onClick={handleRetry} className="meter-reading-list__retry-btn" type="button">
              Retry
            </button>
          </div>
        )}
        {!displayError && (
          <div className="meter-reading-list__baselist-placeholder">
            Old BaseList Grid (to be implemented)
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="meter-reading-list">
      <div className="meter-reading-list__header">
        <h2>{title}</h2>
      </div>

      {displayError && (
        <div className="meter-reading-list__error">
          <p>{displayError}</p>
          <button onClick={handleRetry} className="meter-reading-list__retry-btn" type="button">
            Retry
          </button>
        </div>
      )}

      {!displayError && (
        <SimpleMeterReadingGrid
          data={filteredData as any}
          loading={meterReadings.loading}
          error={undefined}
        />
      )}
    </div>
  );
};
