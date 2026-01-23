import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavoritesSection } from './FavoritesSection';
import type { FavoriteDisplay, Meter, MeterElement } from './types';

/**
 * Unit Tests for FavoritesSection Component
 * 
 * Requirements: 4.1, 4.3, 5.1, 5.2
 * 
 * Tests:
 * - Test Favorites section displays with correct header
 * - Test empty state message displays when no favorites
 * - Test favorited items display with correct format
 */

describe('FavoritesSection', () => {
  const mockMeters: Meter[] = [
    {
      id: 'meter-1',
      tenantId: 'tenant-1',
      name: 'Power Meter',
      description: 'Main power meter',
      createdDate: new Date(),
      updatedDate: new Date(),
    },
    {
      id: 'meter-2',
      tenantId: 'tenant-1',
      name: 'Energy Meter',
      description: 'Energy consumption meter',
      createdDate: new Date(),
      updatedDate: new Date(),
    },
  ];

  const mockMeterElements: { [meterId: string]: MeterElement[] } = {
    'meter-1': [
      {
        id: 'element-1',
        meterId: 'meter-1',
        name: 'power',
        description: 'Power reading',
        createdDate: new Date(),
        updatedDate: new Date(),
      },
      {
        id: 'element-2',
        meterId: 'meter-1',
        name: 'voltage',
        description: 'Voltage reading',
        createdDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    'meter-2': [
      {
        id: 'element-3',
        meterId: 'meter-2',
        name: 'energy',
        description: 'Energy reading',
        createdDate: new Date(),
        updatedDate: new Date(),
      },
    ],
  };

  const mockFavorites: FavoriteDisplay[] = [
    {
      id1: 'meter-1',
      id2: 'element-1',
      meter_name: 'Power Meter',
      element_name: 'power',
    },
    {
      id1: 'meter-2',
      id2: 'element-3',
      meter_name: 'Energy Meter',
      element_name: 'energy',
    },
  ];

  const mockOnItemClick = vi.fn();
  const mockOnStarClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: Favorites section displays with correct header
   * Requirements: 4.1
   */
  it('should display Favorites section with correct header', () => {
    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const header = screen.getByText('Favorites');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('favorites-title');
  });

  /**
   * Test 2: Empty state message displays when no favorites
   * Requirements: 4.3
   */
  it('should display empty state message when no favorites exist', () => {
    render(
      <FavoritesSection
        favorites={[]}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const emptyState = screen.getByText('No favorites yet. Click the star icon to add favorites.');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveClass('favorites-empty-state');
  });

  /**
   * Test 3: Favorited items display with correct format
   * Requirements: 5.1, 5.2
   */
  it('should display favorited items with correct format "meter_name - element-element_name"', () => {
    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // Check first favorite: "Power Meter - element-power"
    expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();

    // Check second favorite: "Energy Meter - element-energy"
    expect(screen.getByText(/Energy Meter - element-energy/)).toBeInTheDocument();
  });

  /**
   * Test 4: Clicking on favorite item calls onItemClick callback
   * Requirements: 5.3
   */
  it('should call onItemClick when favorite item is clicked', () => {
    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const firstFavoriteItem = screen.getByText(/Power Meter - element-power/).closest('.favorite-item-content');
    fireEvent.click(firstFavoriteItem!);

    expect(mockOnItemClick).toHaveBeenCalledWith('meter-1', 'element-1');
  });

  /**
   * Test 5: Star icon click calls onStarClick callback
   * Requirements: 5.4
   */
  it('should call onStarClick when star icon is clicked', async () => {
    mockOnStarClick.mockResolvedValue(undefined);

    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // Find the star icon button for the first favorite
    const starButtons = screen.getAllByRole('button');
    // The first button should be the star icon for the first favorite
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(mockOnStarClick).toHaveBeenCalled();
    });
  });

  /**
   * Test 6: Error message displays when star click fails
   * Requirements: 3.1, 3.2
   */
  it('should display error message when star click fails', async () => {
    const errorMessage = 'Failed to remove from favorites';
    mockOnStarClick.mockRejectedValue(new Error(errorMessage));

    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const starButtons = screen.getAllByRole('button');
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  /**
   * Test 7: Retry button is available on error
   * Requirements: 3.3
   */
  it('should display retry button when error occurs', async () => {
    mockOnStarClick.mockRejectedValueOnce(new Error('Failed to remove from favorites'));
    mockOnStarClick.mockResolvedValueOnce(undefined);

    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const starButtons = screen.getAllByRole('button');
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to remove from favorites')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  /**
   * Test 8: Multiple favorites display correctly
   * Requirements: 4.2, 5.1, 5.2
   */
  it('should display multiple favorites correctly', () => {
    render(
      <FavoritesSection
        favorites={mockFavorites}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    const favoriteItems = screen.getAllByRole('button').filter((btn) => {
      // Filter for star icon buttons (they have specific aria-label or class)
      return btn.className.includes('star-icon') || btn.getAttribute('aria-label')?.includes('favorite');
    });

    // Should have at least 2 favorites displayed
    expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
    expect(screen.getByText(/Energy Meter - element-energy/)).toBeInTheDocument();
  });

  /**
   * Test 9: Favorite item with missing meter name falls back gracefully
   * Requirements: 5.1
   */
  it('should handle missing meter name gracefully', () => {
    const favoritesWithMissingMeter: FavoriteDisplay[] = [
      {
        id1: 'meter-unknown',
        id2: 'element-1',
        meter_name: 'Unknown Meter',
        element_name: 'power',
      },
    ];

    render(
      <FavoritesSection
        favorites={favoritesWithMissingMeter}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // Should display with fallback meter name
    expect(screen.getByText(/Meter meter-unknown - element-Element element-1/)).toBeInTheDocument();
  });

  /**
   * Test 10: Favorite item with missing element name falls back gracefully
   * Requirements: 5.2
   */
  it('should handle missing element name gracefully', () => {
    const favoritesWithMissingElement: FavoriteDisplay[] = [
      {
        id1: 'meter-1',
        id2: 'element-unknown',
        meter_name: 'power',
        element_name: 'power',
      },
    ];

    render(
      <FavoritesSection
        favorites={favoritesWithMissingElement}
        meters={mockMeters}
        meterElements={mockMeterElements}
        onItemClick={mockOnItemClick}
        onStarClick={mockOnStarClick}
      />
    );

    // Should display with fallback element name
    expect(screen.getByText(/Power Meter - element-Element element-unknown/)).toBeInTheDocument();
  });
});
