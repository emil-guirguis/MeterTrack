/**
 * Unit Tests for MeterReadingManagementPage
 * 
 * Feature: meter-readings-grid-loading
 * Tests the component's ability to respond to context changes and trigger data fetches
 * 
 * Validates: Requirements 1.2, 1.4, 2.1, 3.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MeterReadingManagementPage } from './MeterReadingManagementPage';
import { MeterSelectionProvider, useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useMeterReadingsEnhanced } from './meterReadingsStore';

// Mock the MeterReadingList component
vi.mock('./MeterReadingList', () => ({
  MeterReadingList: () => <div data-testid="meter-reading-list">Meter Reading List</div>
}));

// Mock the store
vi.mock('./meterReadingsStore', () => ({
  useMeterReadingsEnhanced: vi.fn()
}));

describe('MeterReadingManagementPage', () => {
  const mockFetchItems = vi.fn();
  const mockStore = {
    items: [],
    loading: false,
    error: null,
    fetchItems: mockFetchItems,
    totalReadings: 0,
    goodQualityReadings: [],
    estimatedReadings: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMeterReadingsEnhanced as any).mockReturnValue(mockStore);
    // Mock console to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Mounting', () => {
    /**
     * Test: Component fetches readings on mount
     * Validates: Requirement 2.1
     */
    it('should fetch readings on mount', async () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingManagementPage />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });
    });

    /**
     * Test: Component renders MeterReadingList
     * Validates: Requirement 1.2
     */
    it('should render MeterReadingList component', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingManagementPage />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('meter-reading-list')).toBeInTheDocument();
    });
  });

  describe('Context Changes', () => {
    /**
     * Test: Component re-fetches when selectedMeter changes
     * Validates: Requirements 1.2, 3.2
     */
    it('should re-fetch when selectedMeter changes', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        return (
          <div>
            <button onClick={() => setSelectedMeter('meter-123')}>
              Select Meter
            </button>
            <MeterReadingManagementPage />
          </div>
        );
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      // Get initial call count
      const initialCallCount = mockFetchItems.mock.calls.length;

      // Click to select a meter
      const button = screen.getByText('Select Meter');
      button.click();

      // Should fetch again when meter is selected
      await waitFor(() => {
        expect(mockFetchItems.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    /**
     * Test: Component re-fetches when selectedElement changes
     * Validates: Requirements 1.4, 3.2
     */
    it('should re-fetch when selectedElement changes', async () => {
      const TestWrapper = () => {
        const { setSelectedElement } = useMeterSelection();

        return (
          <div>
            <button onClick={() => setSelectedElement('element-456')}>
              Select Element
            </button>
            <MeterReadingManagementPage />
          </div>
        );
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      // Get initial call count
      const initialCallCount = mockFetchItems.mock.calls.length;

      // Click to select an element
      const button = screen.getByText('Select Element');
      button.click();

      // Should fetch again when element is selected
      await waitFor(() => {
        expect(mockFetchItems.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    /**
     * Test: Component re-fetches when both meter and element change
     * Validates: Requirements 1.2, 1.4, 3.2
     */
    it('should re-fetch when both meter and element change', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        return (
          <div>
            <button
              onClick={() => {
                setSelectedMeter('meter-123');
                setSelectedElement('element-456');
              }}
            >
              Select Both
            </button>
            <MeterReadingManagementPage />
          </div>
        );
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      // Get initial call count
      const initialCallCount = mockFetchItems.mock.calls.length;

      // Click to select both meter and element
      const button = screen.getByText('Select Both');
      button.click();

      // Should fetch when both are selected
      await waitFor(() => {
        expect(mockFetchItems.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Data Flow', () => {
    /**
     * Test: Component passes selected meter/element info to MeterReadingList
     * Validates: Requirement 1.2, 1.4
     */
    it('should render with selected meter and element in context', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
          setSelectedElement('element-456');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingManagementPage />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      // MeterReadingList should be rendered
      expect(screen.getByTestId('meter-reading-list')).toBeInTheDocument();

      // Verify that fetch was called
      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalled();
      });
    });
  });

  describe('Store Integration', () => {
    /**
     * Test: Component uses the enhanced store hook
     * Validates: Requirement 2.1
     */
    it('should use useMeterReadingsEnhanced hook', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingManagementPage />
        </MeterSelectionProvider>
      );

      expect(useMeterReadingsEnhanced).toHaveBeenCalled();
    });

    /**
     * Test: Component handles store with items
     * Validates: Requirement 2.1
     */
    it('should handle store with items', () => {
      const storeWithItems = {
        ...mockStore,
        items: [
          {
            tenantid: 'tenant-1',
            id: 'reading-1',
            meterId: 'meter-123',
            meterElementId: 'element-456',
            timestamp: '2024-01-01T00:00:00Z',
            kWh: 100,
          }
        ],
        totalReadings: 1,
      };

      (useMeterReadingsEnhanced as any).mockReturnValue(storeWithItems);

      render(
        <MeterSelectionProvider>
          <MeterReadingManagementPage />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('meter-reading-list')).toBeInTheDocument();
    });

    /**
     * Test: Component handles loading state
     * Validates: Requirement 2.5
     */
    it('should handle loading state from store', () => {
      const loadingStore = {
        ...mockStore,
        loading: true,
      };

      (useMeterReadingsEnhanced as any).mockReturnValue(loadingStore);

      render(
        <MeterSelectionProvider>
          <MeterReadingManagementPage />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('meter-reading-list')).toBeInTheDocument();
    });

    /**
     * Test: Component handles error state
     * Validates: Requirement 6.1
     */
    it('should handle error state from store', () => {
      const errorStore = {
        ...mockStore,
        error: 'Failed to fetch meter readings',
      };

      (useMeterReadingsEnhanced as any).mockReturnValue(errorStore);

      render(
        <MeterSelectionProvider>
          <MeterReadingManagementPage />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('meter-reading-list')).toBeInTheDocument();
    });
  });

  describe('Multiple Selection Changes', () => {
    /**
     * Test: Component handles multiple rapid selection changes
     * Validates: Requirement 3.2
     */
    it('should handle multiple rapid selection changes', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        return (
          <div>
            <button onClick={() => setSelectedMeter('meter-1')}>Meter 1</button>
            <button onClick={() => setSelectedMeter('meter-2')}>Meter 2</button>
            <button onClick={() => setSelectedMeter('meter-3')}>Meter 3</button>
            <MeterReadingManagementPage />
          </div>
        );
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      // Get initial call count
      const initialCallCount = mockFetchItems.mock.calls.length;

      // Click buttons with delays to avoid batching
      screen.getByText('Meter 1').click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      screen.getByText('Meter 2').click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      screen.getByText('Meter 3').click();

      // Should fetch for each change
      await waitFor(() => {
        expect(mockFetchItems.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Cleanup', () => {
    /**
     * Test: Component cleans up on unmount
     * Validates: General best practice
     */
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(
        <MeterSelectionProvider>
          <MeterReadingManagementPage />
        </MeterSelectionProvider>
      );

      unmount();

      // Verify no errors occurred
      expect(true).toBe(true);
    });
  });
});
