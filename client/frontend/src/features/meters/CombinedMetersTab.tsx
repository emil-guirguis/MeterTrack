/**
 * CombinedMetersTab Component
 * 
 * Displays a dual-list selector for managing which physical meters are combined
 * into a virtual meter. Provides search, double-click, drag-and-drop, and delete
 * functionality for intuitive meter selection.
 * 
 * Features:
 * - Real-time persistence to database on each meter addition/removal
 * - Tab disabled until parent meter is saved
 * - Auto-save parent meter when first meter is selected
 * - Loading and error states with retry functionality
 * - Material Design styling
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DualListSelector } from '@framework/components/dual-list-selector';
import { meterService, type Meter, type VirtualMeterConfig } from '../../services/meterService';
import './CombinedMetersTab.css';

interface CombinedMetersTabProps {
  meterId: string | number;
  isVirtual: boolean;
  isParentSaved: boolean;
  onMetersChange?: (selectedMeters: Meter[]) => void;
  onError?: (error: Error) => void;
  onParentSave?: () => Promise<void>;
}

interface TabState {
  availableMeters: Meter[];
  selectedMeters: Meter[];
  searchQuery: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  previousState: {
    availableMeters: Meter[];
    selectedMeters: Meter[];
  } | null;
}

/**
 * CombinedMetersTab Component
 * 
 * Manages the selection of physical meters to combine into a virtual meter.
 * Integrates with DualListSelector for UI and meterService for API calls.
 */
export const CombinedMetersTab: React.FC<CombinedMetersTabProps> = ({
  meterId,
  isParentSaved,
  onMetersChange,
  onError,
  onParentSave,
}) => {
  const [state, setState] = useState<TabState>({
    availableMeters: [],
    selectedMeters: [],
    searchQuery: '',
    isLoading: true,
    isSaving: false,
    error: null,
    previousState: null,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  /**
   * Load available meters and previously selected meters
   */
  const loadMeters = useCallback(async () => {
    if (!isParentSaved) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // Load available meters (exclude the current meter)
      const availableMeters = await meterService.getMeterElements({
        type: 'physical',
        excludeIds: String(meterId),
      });

      // Load previously selected meters
      const config = await meterService.getVirtualMeterConfig(meterId);
      const selectedMeters = config.selectedMeterIds
        .map((id) => availableMeters.find((m) => m.id === id))
        .filter((m): m is Meter => m !== undefined);

      setState((prev) => ({
        ...prev,
        availableMeters,
        selectedMeters,
        isLoading: false,
        error: null,
      }));

      if (onMetersChange) {
        onMetersChange(selectedMeters);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load meters';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [meterId, isParentSaved, onMetersChange, onError]);

  /**
   * Load meters on mount or when parent meter is saved
   */
  useEffect(() => {
    if (isInitialLoadRef.current || isParentSaved) {
      isInitialLoadRef.current = false;
      loadMeters();
    }
  }, [isParentSaved, loadMeters]);

  /**
   * Save meter selection to database
   */
  const saveMeterSelection = useCallback(
    async (availableMeters: Meter[], selectedMeters: Meter[]) => {
      if (!isParentSaved) {
        return;
      }

      try {
        setState((prev) => ({
          ...prev,
          isSaving: true,
          error: null,
        }));

        // Prepare the configuration
        const config: VirtualMeterConfig = {
          meterId,
          selectedMeterIds: selectedMeters.map((m) => m.id),
          selectedMeterElementIds: selectedMeters.map((m) => m.id), // Use meter ID as element ID
        };

        // Save to database
        await meterService.saveVirtualMeterConfig(meterId, config);

        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: null,
          previousState: null,
        }));

        if (onMetersChange) {
          onMetersChange(selectedMeters);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save meters';

        // Revert UI changes on save failure
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
          availableMeters: prev.previousState?.availableMeters || availableMeters,
          selectedMeters: prev.previousState?.selectedMeters || selectedMeters,
          previousState: null,
        }));

        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      }
    },
    [meterId, isParentSaved, onMetersChange, onError]
  );

  /**
   * Handle meter move (add or remove)
   */
  const handleItemMove = useCallback(
    async (item: Meter, direction: 'left' | 'right') => {
      if (!isParentSaved) {
        return;
      }

      // Save previous state for potential rollback
      const previousState = {
        availableMeters: state.availableMeters,
        selectedMeters: state.selectedMeters,
      };

      let newSelectedMeters: Meter[];

      if (direction === 'right') {
        // Add meter to selected
        newSelectedMeters = [...state.selectedMeters, item];
      } else {
        // Remove meter from selected
        newSelectedMeters = state.selectedMeters.filter((m) => m.id !== item.id);
      }

      // Update UI immediately
      setState((prev) => ({
        ...prev,
        selectedMeters: newSelectedMeters,
        previousState,
      }));

      // Clear any existing save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce the save operation
      saveTimeoutRef.current = setTimeout(() => {
        saveMeterSelection(state.availableMeters, newSelectedMeters);
      }, 300);

      // If this is the first meter being selected and parent is not saved, auto-save parent
      if (
        direction === 'right' &&
        state.selectedMeters.length === 0 &&
        onParentSave
      ) {
        try {
          await onParentSave();
        } catch (error) {
          console.error('Failed to auto-save parent meter:', error);
        }
      }
    },
    [state.availableMeters, state.selectedMeters, isParentSaved, saveMeterSelection, onParentSave]
  );

  /**
   * Handle search query change
   */
  const handleSearchChange = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    if (state.error) {
      loadMeters();
    }
  }, [state.error, loadMeters]);

  /**
   * Render disabled state message
   */
  if (!isParentSaved) {
    return (
      <div className="combined-meters-tab combined-meters-tab--disabled">
        <div className="combined-meters-tab__disabled-message">
          <p>Save the meter first to configure combined meters</p>
          <p className="combined-meters-tab__disabled-hint">
            Once you save the meter, you'll be able to select which physical meters to combine.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Render loading state
   */
  if (state.isLoading) {
    return (
      <div className="combined-meters-tab combined-meters-tab--loading">
        <div className="combined-meters-tab__loading-spinner">
          <div className="spinner"></div>
          <p>Loading available meters...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (state.error) {
    return (
      <div className="combined-meters-tab combined-meters-tab--error">
        <div className="combined-meters-tab__error-message">
          <p className="combined-meters-tab__error-text">{state.error}</p>
          <button
            className="combined-meters-tab__retry-button"
            onClick={handleRetry}
            disabled={state.isLoading}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render main component
   */
  return (
    <div className="combined-meters-tab">
      <div className="combined-meters-tab__header">
        <h3 className="combined-meters-tab__title">Select Meters to Combine</h3>
        <p className="combined-meters-tab__description">
          Choose which physical meters should be combined into this virtual meter.
          Use search, double-click, or drag-and-drop to manage your selection.
        </p>
      </div>

      <div className="combined-meters-tab__search">
        <input
          type="text"
          className="combined-meters-tab__search-input"
          placeholder="Search meters by name or identifier..."
          value={state.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={state.isSaving}
        />
      </div>

      <div className="combined-meters-tab__selector">
        {state.isSaving && (
          <div className="combined-meters-tab__saving-overlay">
            <div className="spinner"></div>
            <p>Saving...</p>
          </div>
        )}
        <DualListSelector
          availableItems={state.availableMeters}
          selectedItems={state.selectedMeters}
          onItemMove={handleItemMove}
          searchQuery={state.searchQuery}
          emptyStateMessage="No meters available"
          getItemId={(meter) => String(meter.id)}
          getItemLabel={(meter) => `${meter.name} (${meter.identifier})`}
          renderItem={(meter) => (
            <div className="combined-meters-tab__meter-item">
              <span className="combined-meters-tab__meter-name">{meter.name}</span>
              <span className="combined-meters-tab__meter-identifier">{meter.identifier}</span>
            </div>
          )}
        />
      </div>

      <div className="combined-meters-tab__footer">
        <p className="combined-meters-tab__footer-text">
          {state.selectedMeters.length === 0
            ? 'No meters selected. Double-click or drag meters from the left to add them.'
            : `${state.selectedMeters.length} meter${state.selectedMeters.length !== 1 ? 's' : ''} selected`}
        </p>
      </div>
    </div>
  );
};

export default CombinedMetersTab;
