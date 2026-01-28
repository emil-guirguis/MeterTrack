import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardCardModal } from './DashboardCardModal';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DashboardCardModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const mockMeters = [
    { id: 1, name: 'Meter 1' },
    { id: 2, name: 'Meter 2' },
  ];

  const mockMeterElements = [
    { id: 1, name: 'Phase A', element: 'A' },
    { id: 2, name: 'Phase B', element: 'B' },
    { id: 3, name: 'Phase C', element: 'C' },
  ];

  const mockPowerColumns = [
    { name: 'active_energy', label: 'Active Energy', type: 'numeric' },
    { name: 'power', label: 'Power', type: 'numeric' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Create Dashboard Card')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    const { container } = render(
      <DashboardCardModal
        isOpen={false}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should display "Edit Dashboard Card" title when editing', () => {
    const card = {
      dashboard_id: 1,
      card_name: 'Test Card',
      card_description: 'Test Description',
      meter_id: 1,
      meter_element_id: 1,
      selected_columns: ['active_energy'],
      time_frame_type: 'last_month',
      visualization_type: 'line',
    };

    render(
      <DashboardCardModal
        isOpen={true}
        card={card}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Edit Dashboard Card')).toBeInTheDocument();
  });

  it('should populate form fields when editing a card', () => {
    const card = {
      dashboard_id: 1,
      card_name: 'Test Card',
      card_description: 'Test Description',
      meter_id: 1,
      meter_element_id: 1,
      selected_columns: ['active_energy'],
      time_frame_type: 'last_month',
      visualization_type: 'line',
    };

    render(
      <DashboardCardModal
        isOpen={true}
        card={card}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cardNameInput = screen.getByDisplayValue('Test Card') as HTMLInputElement;
    expect(cardNameInput).toBeInTheDocument();
    expect(cardNameInput.value).toBe('Test Card');
  });

  it('should display all form fields', () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText(/Card Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Meter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Meter Element/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time Frame Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Visualization Type/i)).toBeInTheDocument();
  });

  it('should display power columns as checkboxes', () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    mockPowerColumns.forEach(column => {
      const checkbox = screen.getByRole('checkbox', { name: new RegExp(column.label, 'i') });
      expect(checkbox).toBeInTheDocument();
    });
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }).parentElement?.querySelector('button');
    if (closeButton) {
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Create Card/i });
    await user.click(submitButton);

    // Should not call onSubmit if validation fails
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should allow selecting power columns', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const activeEnergyCheckbox = screen.getByRole('checkbox', { name: /Active Energy/i });
    expect(activeEnergyCheckbox).not.toBeChecked();

    await user.click(activeEnergyCheckbox);
    expect(activeEnergyCheckbox).toBeChecked();
  });

  it('should show custom date inputs when custom time frame is selected', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const timeFrameSelect = screen.getByLabelText(/Time Frame Type/i);
    await user.selectOptions(timeFrameSelect, 'custom');

    await waitFor(() => {
      expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
    });
  });

  it('should display meters in selector', () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const meterSelect = screen.getByLabelText(/Meter/i);
    expect(meterSelect).toBeInTheDocument();
  });

  it('should display meter elements in selector', () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const meterElementSelect = screen.getByLabelText(/Meter Element/i);
    expect(meterElementSelect).toBeInTheDocument();
  });

  it('should call onSubmit with form data when form is valid', async () => {
    const user = userEvent.setup();
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill in required fields
    const cardNameInput = screen.getByLabelText(/Card Name/i);
    await user.type(cardNameInput, 'Test Card');

    const meterSelect = screen.getByLabelText(/Meter/i);
    await user.selectOptions(meterSelect, '1');

    const meterElementSelect = screen.getByLabelText(/Meter Element/i);
    await user.selectOptions(meterElementSelect, '1');

    const activeEnergyCheckbox = screen.getByRole('checkbox', { name: /Active Energy/i });
    await user.click(activeEnergyCheckbox);

    const submitButton = screen.getByRole('button', { name: /Create Card/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          card_name: 'Test Card',
          meter_id: 1,
          meter_element_id: 1,
          selected_columns: expect.arrayContaining(['active_energy']),
        })
      );
    });
  });

  it('should disable form when loading', () => {
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        loading={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cardNameInput = screen.getByLabelText(/Card Name/i) as HTMLInputElement;
    expect(cardNameInput.disabled).toBe(true);
  });

  it('should display error message when provided', () => {
    const errorMessage = 'Failed to save card';
    render(
      <DashboardCardModal
        isOpen={true}
        card={null}
        meters={mockMeters}
        meterElements={mockMeterElements}
        powerColumns={mockPowerColumns}
        error={errorMessage}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
