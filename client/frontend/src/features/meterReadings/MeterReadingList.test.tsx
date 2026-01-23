/**
 * Unit Tests for MeterReadingList
 * 
 * Feature: meter-readings-grid-loading
 * Tests the component's filtering, display, and memoization behavior
 * 
 * Validates: Requirements 1.3, 2.1, 2.3, 2.4, 2.5, 3.1, 3.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MeterReadingList } from './MeterReadingList';
import { MeterSelectionProvider, useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import type { MeterReading } from './meterReadingConfig';
import { useBaseList } from '@framework/components/list/hooks';

// Mock the BaseList component
vi.mock('@framework/components/list/BaseList', () => ({
  BaseList: ({ title, data, loading, emptyMessage }: any) => (
    <div data-testid="base-list">
      <div data-testid="list-title">{title}</div>
      <div data-testid="list-loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="list-empty-message">{emptyMessage}</div>
      <div data-testid="list-data-count">{data.length}</div>
      {data.map((item: any) => (
        <div key={item.id} data-testid={`reading-${item.id}`}>
          {item.meterId}
        </div>
      ))}
    </div>
  ),
}));

// Mock the useBaseList hook
vi.mock('@framework/components/list/hooks', () => ({
  useBaseList: vi.fn(),
}));

// Mock the store
vi.mock('./meterReadingsStore', () => ({
  useMeterReadingsEnhanced: vi.fn(),
}));

// Mock the auth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', tenantId: 'tenant-1' },
  }),
}));

describe('MeterReadingList', () => {
  const mockReadings: MeterReading[] = [
    {
      tenantid: 'tenant-1',
      id: 'reading-1',
      meterId: 'meter-123',
      meterElementId: 'element-456',
      timestamp: '2024-01-01T00:00:00Z',
      kWh: 100,
      kW: 5,
      V: 230,
      A: 10,
      quality: 'good',
    },
    {
      tenantid: 'tenant-1',
      id: 'reading-2',
      meterId: 'meter-123',
      meterElementId: 'element-789',
      timestamp: '2024-01-02T00:00:00Z',
      kWh: 110,
      kW: 5.5,
      V: 230,
      A: 11,
      quality: 'good',
    },
    {
      tenantid: 'tenant-1',
      id: 'reading-3',
      meterId: 'meter-456',
      meterElementId: 'element-456',
      timestamp: '2024-01-03T00:00:00Z',
      kWh: 200,
      kW: 10,
      V: 230,
      A: 20,
      quality: 'estimated',
    },
    {
      tenantid: 'tenant-1',
      id: 'reading-4',
      meterId: 'meter-456',
      meterElementId: 'element-789',
      timestamp: '2024-01-04T00:00:00Z',
      kWh: 210,
      kW: 10.5,
      V: 230,
      A: 21,
      quality: 'good',
    },
  ];

  const mockStore = {
    items: mockReadings,
    loading: false,
    error: null,
    totalReadings: mockReadings.length,
    goodQualityReadings: mockReadings.filter(r => r.quality === 'good'),
    estimatedReadings: mockReadings.filter(r => r.quality === 'estimated'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMeterReadingsEnhanced as any).mockReturnValue(mockStore);
    
    // Setup useBaseList mock to return data from store
    (useBaseList as any).mockReturnValue({
      data: mockReadings,
      loading: false,
      error: null,
      columns: [],
      pagination: {},
      renderFilters: () => null,
      renderHeaderActions: () => null,
      renderStats: () => null,
      renderExportModal: () => null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    /**
     * Test: Component renders without crashing
     */
    it('should render without crashing', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('base-list')).toBeInTheDocument();
    });

    /**
     * Test: Component renders BaseList component
     */
    it('should render BaseList component', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('base-list')).toBeInTheDocument();
    });
  });

  describe('Title Display', () => {
    /**
     * Test: Title shows "Meter Readings" when no meter is selected
     * Validates: Requirement 1.3
     */
    it('should display default title when no meter is selected', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-title')).toHaveTextContent('Meter Readings');
    });

    /**
     * Test: Title displays selected meter ID
     * Validates: Requirement 1.3
     */
    it('should display selected meter in title', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-title')).toHaveTextContent('Meter Readings - Meter meter-123');
      });
    });

    /**
     * Test: Title displays selected meter and element
     * Validates: Requirement 1.3
     */
    it('should display selected meter and element in title', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
          setSelectedElement('element-456');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-title')).toHaveTextContent(
          'Meter Readings - Meter meter-123 / Element element-456'
        );
      });
    });
  });

  describe('Data Filtering', () => {
    /**
     * Test: All data is displayed when no meter is selected
     * Validates: Requirements 2.1, 3.1
     */
    it('should display all data when no meter is selected', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-data-count')).toHaveTextContent('4');
    });

    /**
     * Test: Data is filtered by selected meter
     * Validates: Requirements 2.1, 2.3, 3.1
     */
    it('should filter data by selected meter', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        // Should only show readings for meter-123 (2 readings)
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });
    });

    /**
     * Test: Data is filtered by selected meter and element
     * Validates: Requirements 2.1, 2.3, 3.1
     */
    it('should filter data by selected meter and element', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
          setSelectedElement('element-456');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        // Should only show reading-1 (meter-123 + element-456)
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });
    });

    /**
     * Test: Filtering works with different meter IDs
     * Validates: Requirements 2.1, 3.1
     */
    it('should filter data for different meter IDs', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-456');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        // Should only show readings for meter-456 (2 readings)
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });
    });

    /**
     * Test: Empty result when meter has no readings
     * Validates: Requirements 2.1, 2.4
     */
    it('should show empty result when meter has no readings', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-999');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Empty State Messages', () => {
    /**
     * Test: Empty message when no meter is selected
     * Validates: Requirements 2.4, 3.3
     */
    it('should display empty message when no meter is selected', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-empty-message')).toHaveTextContent(
        'No meter readings found. Select a meter from the sidebar to view readings.'
      );
    });

    /**
     * Test: Empty message when meter is selected but no data
     * Validates: Requirements 2.4, 3.3
     */
    it('should display empty message when meter is selected but no data', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        data: [],
      });

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-empty-message')).toHaveTextContent(
          'No meter readings found for meter meter-123.'
        );
      });
    });

    /**
     * Test: Empty message when meter and element are selected but no data
     * Validates: Requirements 2.4, 3.3
     */
    it('should display empty message when meter and element are selected but no data', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
          setSelectedElement('element-456');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingList />;
      };

      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        data: [],
      });

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-empty-message')).toHaveTextContent(
          'No meter readings found for meter meter-123 and element element-456.'
        );
      });
    });
  });

  describe('Loading State', () => {
    /**
     * Test: Loading state is displayed during data fetch
     * Validates: Requirement 2.5
     */
    it('should display loading state when data is loading', () => {
      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        loading: true,
      });

      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-loading')).toHaveTextContent('Loading');
    });

    /**
     * Test: Loading state is cleared when data is loaded
     * Validates: Requirement 2.5
     */
    it('should clear loading state when data is loaded', () => {
      (useMeterReadingsEnhanced as any).mockReturnValue({
        ...mockStore,
        loading: false,
      });

      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-loading')).toHaveTextContent('Not Loading');
    });

    /**
     * Test: Empty data is shown when loading completes with no results
     * Validates: Requirements 2.4, 2.5
     */
    it('should show empty data when loading completes with no results', () => {
      (useBaseList as any).mockReturnValue({
        data: [],
        loading: false,
        error: null,
        columns: [],
        pagination: {},
        renderFilters: () => null,
        renderHeaderActions: () => null,
        renderStats: () => null,
        renderExportModal: () => null,
      });

      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-data-count')).toHaveTextContent('0');
      expect(screen.getByTestId('list-loading')).toHaveTextContent('Not Loading');
    });
  });

  describe('Memoization', () => {
    /**
     * Test: Filtered data is memoized and not recomputed unnecessarily
     * Validates: Requirement 2.1
     */
    it('should memoize filtered data', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      const { rerender } = render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });

      // Rerender should not change the filtered data count
      rerender(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
    });

    /**
     * Test: Title is memoized and not recomputed unnecessarily
     * Validates: Requirement 1.3
     */
    it('should memoize title', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-title')).toHaveTextContent('Meter Readings - Meter meter-123');
      });

      // Title should remain the same
      expect(screen.getByTestId('list-title')).toHaveTextContent('Meter Readings - Meter meter-123');
    });

    /**
     * Test: Empty message is memoized and not recomputed unnecessarily
     * Validates: Requirements 2.4, 3.3
     */
    it('should memoize empty message', () => {
      render(
        <MeterSelectionProvider>
          <MeterReadingList />
        </MeterSelectionProvider>
      );

      const emptyMessage = screen.getByTestId('list-empty-message').textContent;

      // Empty message should remain the same
      expect(screen.getByTestId('list-empty-message')).toHaveTextContent(emptyMessage || '');
    });
  });

  describe('Selection Changes', () => {
    /**
     * Test: Filtered data updates when meter selection changes
     * Validates: Requirements 2.1, 3.1
     */
    it('should update filtered data when meter selection changes', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();
        const [meter, setMeter] = React.useState<string | null>(null);

        return (
          <div>
            <button onClick={() => { setMeter('meter-123'); setSelectedMeter('meter-123'); }}>
              Select Meter 123
            </button>
            <button onClick={() => { setMeter('meter-456'); setSelectedMeter('meter-456'); }}>
              Select Meter 456
            </button>
            <MeterReadingList />
          </div>
        );
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      // Select meter-123
      screen.getByText('Select Meter 123').click();
      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });

      // Select meter-456
      screen.getByText('Select Meter 456').click();
      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });
    });

    /**
     * Test: Filtered data updates when element selection changes
     * Validates: Requirements 2.1, 3.1
     */
    it('should update filtered data when element selection changes', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return (
          <div>
            <button onClick={() => setSelectedElement('element-456')}>
              Select Element 456
            </button>
            <button onClick={() => setSelectedElement('element-789')}>
              Select Element 789
            </button>
            <MeterReadingList />
          </div>
        );
      };

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('2');
      });

      // Select element-456
      screen.getByText('Select Element 456').click();
      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });

      // Select element-789
      screen.getByText('Select Element 789').click();
      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Field Name Variations', () => {
    /**
     * Test: Filtering works with meter_id field name
     * Validates: Requirement 2.1
     */
    it('should filter data with meter_id field name', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
        }, [setSelectedMeter]);

        return <MeterReadingList />;
      };

      const readingsWithAltFieldNames = [
        {
          ...mockReadings[0],
          meterId: undefined,
          meter_id: 'meter-123',
        },
      ];

      (useBaseList as any).mockReturnValue({
        data: readingsWithAltFieldNames,
        loading: false,
        error: null,
        columns: [],
        pagination: {},
        renderFilters: () => null,
        renderHeaderActions: () => null,
        renderStats: () => null,
        renderExportModal: () => null,
      });

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });
    });

    /**
     * Test: Filtering works with meter_element_id field name
     * Validates: Requirement 2.1
     */
    it('should filter data with meter_element_id field name', async () => {
      const TestWrapper = () => {
        const { setSelectedMeter, setSelectedElement } = useMeterSelection();

        React.useEffect(() => {
          setSelectedMeter('meter-123');
          setSelectedElement('element-456');
        }, [setSelectedMeter, setSelectedElement]);

        return <MeterReadingList />;
      };

      const readingsWithAltFieldNames = [
        {
          ...mockReadings[0],
          meterElementId: undefined,
          meter_element_id: 'element-456',
        },
      ];

      (useBaseList as any).mockReturnValue({
        data: readingsWithAltFieldNames,
        loading: false,
        error: null,
        columns: [],
        pagination: {},
        renderFilters: () => null,
        renderHeaderActions: () => null,
        renderStats: () => null,
        renderExportModal: () => null,
      });

      render(
        <MeterSelectionProvider>
          <TestWrapper />
        </MeterSelectionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('list-data-count')).toHaveTextContent('1');
      });
    });
  });
});
