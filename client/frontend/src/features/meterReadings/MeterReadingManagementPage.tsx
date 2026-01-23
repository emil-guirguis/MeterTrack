/**
 * Meter Reading Management Page
 * 
 * Read-only view for meter readings
 * Uses EntityManagementPage but without form/create/edit functionality
 */

import React from 'react';
import { MeterReadingList } from './MeterReadingList';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import type { MeterReading } from './meterReadingConfig';

export const MeterReadingManagementPage: React.FC = () => {
  const store = useMeterReadingsEnhanced();
  const { selectedMeter } = useMeterSelection();

  // Fetch readings when selected meter changes
  React.useEffect(() => {
    if (selectedMeter) {
      store.fetchItems({ meterId: selectedMeter });
    }
  }, [selectedMeter]);

  return (
    <div className="meter-reading-management-page">
      <MeterReadingList />
    </div>
  );
};
