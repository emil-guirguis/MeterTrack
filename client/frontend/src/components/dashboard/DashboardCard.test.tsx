import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardCard } from './DashboardCard';
import * as dashboardServiceModule from '../../services/dashboardService';

// Mock the dashboard service
vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getCardData: vi.fn(),
  }
}));

describe('DashboardCard', () => {
  const mockCard = {
    dashboard_id: 1,
    tenant_id: 1,
    created_by_users_id: 1,
    meter_id: 1,
    meter_element_id: 1,
    card_name: 'Test Card',
    card_description: 'Test Description',
    selected_columns: ['active_energy', 'power'],
    time_frame_type: 'last_month' as const,
    visualization_type: 'line' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockAggregatedData = {
    card_id: 1,
    time_frame: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    },
    aggregated_values: {
      active_energy: 1250.50,
      power: 45.25
    },
    meter_element: {
      id: 1,
      name: 'Main Panel'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card with correct data', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);

    render(<DashboardCard card={mockCard} />);

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('1,250.50')).toBeInTheDocument();
      expect(screen.getByText('45.25')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DashboardCard card={mockCard} />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('displays error state when fetch fails', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockRejectedValue(
      new Error('Failed to fetch data')
    );

    render(<DashboardCard card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch data/)).toBeInTheDocument();
    });
  });

  it('displays retry button on error', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockRejectedValue(
      new Error('Failed to fetch data')
    );

    render(<DashboardCard card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('calls refresh callback when refresh button is clicked', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);
    const onRefresh = vi.fn();

    const user = userEvent.setup();
    render(<DashboardCard card={mockCard} onRefresh={onRefresh} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledWith(1);
    });
  });

  it('calls edit callback when edit button is clicked', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);
    const onEdit = vi.fn();

    const user = userEvent.setup();
    render(<DashboardCard card={mockCard} onEdit={onEdit} />);

    const editButton = screen.getByLabelText('Edit');
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockCard);
  });

  it('calls delete callback when delete button is clicked and confirmed', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);
    const onDelete = vi.fn();

    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DashboardCard card={mockCard} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText('Delete');
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('does not call delete callback when delete is cancelled', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);
    const onDelete = vi.fn();

    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<DashboardCard card={mockCard} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText('Delete');
    await user.click(deleteButton);

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls drill-down callback when drill-down link is clicked', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);
    const onDrillDown = vi.fn();

    const user = userEvent.setup();
    render(<DashboardCard card={mockCard} onDrillDown={onDrillDown} />);

    await waitFor(() => {
      expect(screen.getByText('View Detailed Readings →')).toBeInTheDocument();
    });

    const drillDownLink = screen.getByText('View Detailed Readings →');
    await user.click(drillDownLink);

    expect(onDrillDown).toHaveBeenCalledWith(1);
  });

  it('displays all selected columns', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);

    render(<DashboardCard card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText('active_energy')).toBeInTheDocument();
      expect(screen.getByText('power')).toBeInTheDocument();
    });
  });

  it('renders metadata with time frame and visualization type', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);

    const { container } = render(<DashboardCard card={mockCard} />);

    await waitFor(() => {
      const metadata = container.querySelector('.dashboard-card__metadata');
      expect(metadata).toBeInTheDocument();
      expect(metadata?.textContent).toContain('Last Month');
      expect(metadata?.textContent).toContain('line');
    });
  });

  it('formats numbers with commas', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    const largeNumberData = {
      ...mockAggregatedData,
      aggregated_values: {
        active_energy: 1250500.50,
        power: 45.25
      }
    };
    mockDashboardService.getCardData.mockResolvedValue(largeNumberData);

    render(<DashboardCard card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByText('1,250,500.50')).toBeInTheDocument();
    });
  });

  it('handles missing description gracefully', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);

    const cardWithoutDescription = {
      ...mockCard,
      card_description: undefined
    };

    render(<DashboardCard card={cardWithoutDescription} />);

    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('disables refresh button while loading', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DashboardCard card={mockCard} />);

    const refreshButton = screen.getByLabelText('Refresh');
    expect(refreshButton).toBeDisabled();
  });

  it('refetches data when card ID changes', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);

    const { rerender } = render(<DashboardCard card={mockCard} />);

    await waitFor(() => {
      expect(mockDashboardService.getCardData).toHaveBeenCalledWith(1);
    });

    const newCard = {
      ...mockCard,
      dashboard_id: 2
    };

    rerender(<DashboardCard card={newCard} />);

    await waitFor(() => {
      expect(mockDashboardService.getCardData).toHaveBeenCalledWith(2);
    });
  });

  it('displays last refreshed timestamp after data is loaded', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);

    const { container } = render(<DashboardCard card={mockCard} />);

    await waitFor(() => {
      const lastRefreshedElement = container.querySelector('.dashboard-card__last-refreshed');
      expect(lastRefreshedElement).toBeInTheDocument();
      expect(lastRefreshedElement?.textContent).toContain('Just now');
    });
  });

  it('updates last refreshed timestamp when refresh button is clicked', async () => {
    const mockDashboardService = dashboardServiceModule.dashboardService as any;
    mockDashboardService.getCardData.mockResolvedValue(mockAggregatedData);

    const user = userEvent.setup();
    const { container } = render(<DashboardCard card={mockCard} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh');
    await user.click(refreshButton);

    await waitFor(() => {
      const lastRefreshedElement = container.querySelector('.dashboard-card__last-refreshed');
      expect(lastRefreshedElement?.textContent).toContain('Just now');
    });
  });
});
