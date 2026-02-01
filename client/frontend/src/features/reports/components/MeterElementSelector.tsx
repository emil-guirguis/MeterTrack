import React, { useState, useEffect } from 'react';
import { tokenStorage } from '../../../utils/tokenStorage';
import './MeterElementSelector.css';

interface Meter {
  meter_id: number;
  id?: string;
  name: string;
  serial_number?: string;
  identifier?: string;
  [key: string]: any;
}

interface Element {
  id: string;
  element_id?: number;
  name: string;
  element_number?: string;
  meter_id: number;
  [key: string]: any;
}

interface MeterElementSelectorProps {
  value: {
    meter_ids: string[];
    element_ids: string[];
  };
  error?: string;
  isDisabled: boolean;
  onChange: (value: { meter_ids: string[]; element_ids: string[] }) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * MeterElementSelector Component
 * 
 * Allows users to select meters and their associated elements.
 * When meters are selected, elements for those meters are loaded and displayed.
 * 
 * Features:
 * - Loads meters from /api/meters endpoint
 * - Loads elements from /api/meters/{meterId}/elements endpoint
 * - Handles API errors gracefully with user-facing messages
 * - Shows loading states during data fetching
 * - Validates token before making API calls
 * - Supports multiple meter and element selection
 * 
 * **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5**
 */
export const MeterElementSelector: React.FC<MeterElementSelectorProps> = ({
  value = { meter_ids: [], element_ids: [] },
  error,
  isDisabled,
  onChange,
}) => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedMeterIds, setSelectedMeterIds] = useState<string[]>(value.meter_ids || []);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(value.element_ids || []);
  const [loading, setLoading] = useState(false);
  const [metersLoading, setMetersLoading] = useState(true);
  const [metersError, setMetersError] = useState<string | null>(null);
  const [elementsError, setElementsError] = useState<string | null>(null);

  // Load meters on mount
  useEffect(() => {
    const fetchMeters = async () => {
      try {
        setMetersLoading(true);
        setMetersError(null);
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const token = tokenStorage.getToken();
        if (!token) {
          throw new Error('Authentication token not found. Please log in.');
        }
        headers['Authorization'] = `Bearer ${token}`;

        console.log('[MeterElementSelector] Fetching meters from:', `${API_BASE_URL}/meters?limit=1000`);
        const response = await fetch(`${API_BASE_URL}/meters?limit=1000`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view meters.');
          } else if (response.status === 404) {
            throw new Error('Meters endpoint not found.');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[MeterElementSelector] Meters response:', data);
        
        // Handle both direct array response and wrapped response
        let metersList: Meter[] = [];
        if (Array.isArray(data)) {
          metersList = data;
        } else if (data.success && data.data) {
          if (Array.isArray(data.data)) {
            metersList = data.data;
          } else if (data.data.items && Array.isArray(data.data.items)) {
            metersList = data.data.items;
          }
        }
        
        if (!Array.isArray(metersList)) {
          throw new Error('Invalid response format from meters API');
        }
        
        console.log('[MeterElementSelector] Parsed meters:', metersList);
        setMeters(metersList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load meters';
        console.error('[MeterElementSelector] Failed to fetch meters:', err);
        setMetersError(errorMessage);
        setMeters([]);
      } finally {
        setMetersLoading(false);
      }
    };

    fetchMeters();
  }, []);

  // Load elements when meters change
  useEffect(() => {
    const fetchElements = async () => {
      if (selectedMeterIds.length === 0) {
        setElements([]);
        setElementsError(null);
        return;
      }

      try {
        setLoading(true);
        setElementsError(null);
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const token = tokenStorage.getToken();
        if (!token) {
          throw new Error('Authentication token not found. Please log in.');
        }
        headers['Authorization'] = `Bearer ${token}`;

        console.log('[MeterElementSelector] Fetching elements for meters:', selectedMeterIds);

        // Fetch elements for each selected meter
        const elementPromises = selectedMeterIds.map(meterId =>
          fetch(`${API_BASE_URL}/meters/${meterId}/elements`, {
            method: 'GET',
            headers,
          })
            .then(res => {
              if (!res.ok) {
                if (res.status === 401) {
                  throw new Error('Authentication failed. Please log in again.');
                } else if (res.status === 403) {
                  throw new Error('You do not have permission to view elements.');
                } else if (res.status === 404) {
                  throw new Error(`Meter ${meterId} not found.`);
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              }
              return res.json();
            })
            .then(data => {
              console.log(`[MeterElementSelector] Elements response for meter ${meterId}:`, data);
              
              // Handle both direct array response and wrapped response
              if (Array.isArray(data)) {
                return data;
              } else if (data.success && data.data) {
                if (Array.isArray(data.data)) {
                  return data.data;
                }
              }
              return [];
            })
            .catch(err => {
              console.error(`[MeterElementSelector] Failed to fetch elements for meter ${meterId}:`, err);
              // Don't throw - continue with other meters
              return [];
            })
        );

        const allElements = await Promise.all(elementPromises);
        const flattenedElements = allElements.flat();
        console.log('[MeterElementSelector] Parsed elements:', flattenedElements);
        setElements(flattenedElements);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load elements';
        console.error('[MeterElementSelector] Failed to fetch elements:', err);
        setElementsError(errorMessage);
        setElements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchElements();
  }, [selectedMeterIds]);

  const handleMeterToggle = (meterId: string) => {
    const newMeterIds = selectedMeterIds.includes(meterId)
      ? selectedMeterIds.filter(id => id !== meterId)
      : [...selectedMeterIds, meterId];

    setSelectedMeterIds(newMeterIds);
    onChange({
      meter_ids: newMeterIds,
      element_ids: selectedElementIds,
    });
  };

  const handleElementToggle = (elementId: string) => {
    const newElementIds = selectedElementIds.includes(elementId)
      ? selectedElementIds.filter(id => id !== elementId)
      : [...selectedElementIds, elementId];

    setSelectedElementIds(newElementIds);
    onChange({
      meter_ids: selectedMeterIds,
      element_ids: newElementIds,
    });
  };

  return (
    <div className="meter-element-selector">
      <div className="selector-section">
        <h4 className="selector-section__title">Available Meters</h4>
        {metersError && (
          <div className="form-error">{metersError}</div>
        )}
        {metersLoading ? (
          <div className="selector-section__loading">Loading meters...</div>
        ) : meters.length === 0 ? (
          <div className="selector-section__empty">No meters available</div>
        ) : (
          <div className="meter-list">
            {meters.map(meter => (
              <label key={meter.meter_id || meter.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedMeterIds.includes(String(meter.meter_id || meter.id))}
                  onChange={() => handleMeterToggle(String(meter.meter_id || meter.id))}
                  disabled={isDisabled}
                  className="checkbox-item__input"
                />
                <span className="checkbox-item__label">
                  {meter.name} {meter.serial_number && `(${meter.serial_number})`}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {selectedMeterIds.length > 0 && (
        <div className="selector-section">
          <h4 className="selector-section__title">Available Elements</h4>
          {elementsError && (
            <div className="form-error">{elementsError}</div>
          )}
          {loading ? (
            <div className="selector-section__loading">Loading elements...</div>
          ) : elements.length === 0 ? (
            <div className="selector-section__empty">No elements available for selected meters</div>
          ) : (
            <div className="element-list">
              {elements.map(element => (
                <label key={element.id || element.element_id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedElementIds.includes(String(element.id || element.element_id))}
                    onChange={() => handleElementToggle(String(element.id || element.element_id))}
                    disabled={isDisabled}
                    className="checkbox-item__input"
                  />
                  <span className="checkbox-item__label">
                    {element.name} {element.element_number && `(${element.element_number})`}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default MeterElementSelector;
