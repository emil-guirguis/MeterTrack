import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardCardModal } from './DashboardCardModal';
import * as dashboardService from '../../services/dashboardService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the Modal component to avoid hook issues
vi.mock('@framework/components/modal', () => ({
  Modal: ({ isOpen, title, onClose, children }: any) => 
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock the dashboard service
vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getPowerColumns: vi.fn(),
    getMetersByTenant: vi.fn(),
    getMeterElementsByMeter: vi.fn(),
    createDashboardCard: vi.fn(),
    updateDashboardCard: vi.fn(),
  },
}));

describe('DashboardCardModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockPowerColumns = [
    { name: 'active_energy', type: 'numeric', label: 'Active Energy' },
    { name: 'power', type: 'numeric', label: 'Power' },
  ];

  const mockMeters = [
    { id: 1, name: 'Meter 1' },
    { id: 2, name: 'Meter 2' },
  ];

  const mockMeterElements = [
    { id: 1, element: 'A', name: 'Phase A', meter_id: 1 },
    { id: 2, element: 'B', name: 'Phase B', meter_id: 1 },
    { id: 3, element: 'C', name: 'Phase C', meter_id: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (dashboardService.dashboardService.getPowerColumns as any).mockResolvedValue(mockPowerColumns);
    (dashboardService.dashboardService.getMetersByTenant as any).mockResolvedValue(mockMeters);
    (dashboardService.dashboardService.getMeterElementsByMeter as any).mockResolvedValue(mockMeterElements);
  });

  it('should render modal when isOpen is true', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Wait for the modal to render
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  it('should load power columns on mount', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(dashboardService.dashboardService.getPowerColumns).toHaveBeenCalled();
    });
  });

  it('should display card name input field', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      const cardNameInput = document.querySelector('input[name="card_name"]');
      expect(cardNameInput).toBeInTheDocument();
    });
  });

  it('should display description textarea field', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      const descriptionInput = document.querySelector('textarea[name="card_description"]');
      expect(descriptionInput).toBeInTheDocument();
    });
  });

  it('should display meter element selector', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      const meterElementSelect = document.querySelector('select[name="meter_element_id"]');
      expect(meterElementSelect).toBeInTheDocument();
    });
  });

  it('should display power columns checkboxes', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      mockPowerColumns.forEach(column => {
        const checkbox = document.querySelector(`input[value="${column.name}"]`);
        expect(checkbox).toBeInTheDocument();
      });
    });
  });

  it('should display time frame type selector', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      const timeFrameSelect = document.querySelector('select[name="time_frame_type"]');
      expect(timeFrameSelect).toBeInTheDocument();
    });
  });

  it('should display visualization type selector', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      const vizTypeSelect = document.querySelector('select[name="visualization_type"]');
      expect(vizTypeSelect).toBeInTheDocument();
    });
  });

  it('should display cancel and submit buttons', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Card/i })).toBeInTheDocument();
    });
  });

  it('should allow selecting power columns', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(dashboardService.dashboardService.getPowerColumns).toHaveBeenCalled();
    });

    const activeEnergyCheckbox = document.querySelector('input[value="active_energy"]') as HTMLInputElement;
    expect(activeEnergyCheckbox.checked).toBe(false);

    await user.click(activeEnergyCheckbox);
    expect(activeEnergyCheckbox.checked).toBe(true);
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(dashboardService.dashboardService.getPowerColumns).toHaveBeenCalled();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show custom date inputs when custom time frame is selected', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(dashboardService.dashboardService.getPowerColumns).toHaveBeenCalled();
    });

    const timeFrameSelect = document.querySelector('select[name="time_frame_type"]') as HTMLSelectElement;
    await user.selectOptions(timeFrameSelect, 'custom');

    await waitFor(() => {
      const startDateInput = document.querySelector('input[name="custom_start_date"]');
      const endDateInput = document.querySelector('input[name="custom_end_date"]');
      expect(startDateInput).toBeInTheDocument();
      expect(endDateInput).toBeInTheDocument();
    });
  });

  it('should load meters on form open', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(dashboardService.dashboardService.getMetersByTenant).toHaveBeenCalled();
    });
  });

  it('should display meter selector', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      const meterSelect = document.querySelector('select[name="meter_id"]');
      expect(meterSelect).toBeInTheDocument();
    });
  });

  it('should display available meters in selector', async () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      mockMeters.forEach(meter => {
        const option = document.querySelector(`select[name="meter_id"] option[value="${meter.id}"]`);
        expect(option).toBeInTheDocument();
        expect(option?.textContent).toBe(meter.name);
      });
    });
  });

  it('should load meter elements when meter is selected', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(dashboardService.dashboardService.getMetersByTenant).toHaveBeenCalled();
    });

    const meterSelect = document.querySelector('select[name="meter_id"]') as HTMLSelectElement;
    await user.selectOptions(meterSelect, '1');

    await waitFor(() => {
      expect(dashboardService.dashboardService.getMeterElementsByMeter).toHaveBeenCalledWith(1);
    });
  });

  it('should clear meter element selection when meter changes', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(dashboardService.dashboardService.getMetersByTenant).toHaveBeenCalled();
    });

    const meterSelect = document.querySelector('select[name="meter_id"]') as HTMLSelectElement;
    await user.selectOptions(meterSelect, '1');

    await waitFor(() => {
      const meterElementSelect = document.querySelector('select[name="meter_element_id"]') as HTMLSelectElement;
      expect(meterElementSelect.value).toBe('');
    });
  });

  it('should display meter element options after meter selection', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(dashboardService.dashboardService.getMetersByTenant).toHaveBeenCalled();
    });

    const meterSelect = document.querySelector('select[name="meter_id"]') as HTMLSelectElement;
    await user.selectOptions(meterSelect, '1');

    await waitFor(() => {
      mockMeterElements.forEach(element => {
        const option = document.querySelector(`select[name="meter_element_id"] option[value="${element.id}"]`);
        expect(option).toBeInTheDocument();
      });
    });
  });
});
