/**
 * Meter Reading Management Page
 * 
 * Read-only view for meter readings
 * Uses EntityManagementPage but without form/create/edit functionality
 */

import React from 'react';
import { MeterReadingList } from './MeterReadingList';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';
import type { MeterReading } from './meterReadingConfig';

export const MeterReadingManagementPage: React.FC = () => {
  const store = useMeterReadingsEnhanced();

  // Fetch readings on mount
  React.useEffect(() => {
    store.fetchItems();
  }, []);

  return (
    <AppLayoutWrapper title="Meter Readings">
      <div className="meter-reading-management-page">
        <MeterReadingList />
      </div>
    </AppLayoutWrapper>
  );
};
