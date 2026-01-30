/**
 * Meter Reading Management Page
 * 
 * Read-only view for meter readings
 * Uses EntityManagementPage but without form/create/edit functionality
 */

console.log('[MeterReadingManagementPage.tsx] Module loaded at', new Date().toISOString());

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MeterReadingList } from './MeterReadingList';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useAuth } from '../../hooks/useAuth';

export const MeterReadingManagementPage: React.FC = () => {
  console.log('[MeterReadingManagementPage] RENDERING');
  const store = useMeterReadingsEnhanced();
  const { setSelectedMeter, setSelectedElement } = useMeterSelection();
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const [gridType, setGridType] = React.useState<'simple' | 'baselist'>('simple');

  const meterId = searchParams.get('meterId');
  const elementId = searchParams.get('elementId');
  const elementName = searchParams.get('elementName');
  const elementNumber = searchParams.get('elementNumber');
  const urlGridType = searchParams.get('gridType') as 'simple' | 'baselist' | null;

  console.log('[MeterReadingManagementPage] URL params - meterId:', meterId, 'elementId:', elementId, 'elementName:', elementName, 'elementNumber:', elementNumber, 'gridType:', urlGridType);
  console.log('[MeterReadingManagementPage] auth.user?.client:', auth.user?.client);

  // Set context values from URL params and fetch readings
  React.useEffect(() => {
    console.log('[MeterReadingManagementPage] ===== EFFECT TRIGGERED =====');
    console.log('[MeterReadingManagementPage] meterId:', meterId, 'elementId:', elementId, 'tenantId:', auth.user?.client);
    console.log('[MeterReadingManagementPage] meterId type:', typeof meterId, 'elementId type:', typeof elementId);
    
    if (meterId && auth.user?.client) {
      console.log('[MeterReadingManagementPage] Conditions met, setting context and fetching');
      setSelectedMeter(meterId);
      if (elementId) {
        const parsedElementNumber = elementNumber ? parseInt(elementNumber) : undefined;
        setSelectedElement(elementId, elementName || undefined, parsedElementNumber);
      }
      
      // Set gridType from URL if provided
      if (urlGridType) {
        console.log('[MeterReadingManagementPage] Setting gridType from URL:', urlGridType);
        setGridType(urlGridType);
      }
      
      const fetchParams = {
        tenantId: auth.user.client,
        meterId: meterId,
        meterElementId: elementId || undefined,
      };
      console.log('[MeterReadingManagementPage] Calling fetchItems with:', fetchParams);
      store.fetchItems(fetchParams);
      console.log('[MeterReadingManagementPage] ===== EFFECT COMPLETE =====');
    } else {
      console.log('[MeterReadingManagementPage] Conditions NOT met - meterId:', meterId, 'tenantId:', auth.user?.client);
    }
  }, [meterId, elementId, elementName, elementNumber, auth.user?.client, urlGridType]);

  return (
    <div className="meter-reading-management-page">
      <MeterReadingList gridType={gridType} onGridTypeChange={setGridType} />
    </div>
  );
};
