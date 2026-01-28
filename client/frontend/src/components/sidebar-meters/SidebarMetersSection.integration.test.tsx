// import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import { SidebarMetersSection } from './SidebarMetersSection';
// import { metersService } from '../../services/metersService';
// import { favoritesService } from '../../services/favoritesService';
// import type { Meter, MeterElement, Favorite, MeterReading } from './types';

// // Mock the services
// vi.mock('../../services/metersService');
// vi.mock('../../services/favoritesService');

// describe('SidebarMetersSection Integration Tests', () => {
//   const mockTenantId = '1';
//   const mockUserId = '100';

//   const mockMeters: Meter[] = [
//     {
//       id: '1',
//       tenantId: mockTenantId,
//       name: 'Water Meter',
//       description: 'Main water meter',
//       createdDate: new Date('2024-01-01'),
//       updatedDate: new Date('2024-01-01'),
//     },
//     {
//       id: '2',
//       tenantId: mockTenantId,
//       name: 'Electric Meter',
//       description: 'Main electric meter',
//       createdDate: new Date('2024-01-02'),
//       updatedDate: new Date('2024-01-02'),
//     },
//   ];

//   const mockElements: { [meterId: string]: MeterElement[] } = {
//     '1': [
//       {
//         id: '101',
//         meterId: '1',
//         name: 'Flow Rate',
//         description: 'Water flow rate',
//         createdDate: new Date('2024-01-01'),
//         updatedDate: new Date('2024-01-01'),
//       },
//       {
//         id: '102',
//         meterId: '1',
//         name: 'Pressure',
//         description: 'Water pressure',
//         createdDate: new Date('2024-01-01'),
//         updatedDate: new Date('2024-01-01'),
//       },
//     ],
//     '2': [
//       {
//         id: '201',
//         meterId: '2',
//         name: 'Voltage',
//         description: 'Voltage reading',
//         createdDate: new Date('2024-01-02'),
//         updatedDate: new Date('2024-01-02'),
//       },
//     ],
//   };

//   const mockReadings: MeterReading[] = [
//     {
//       id: '1001',
//       meterId: '1',
//       meterElementId: '101',
//       value: 100.5,
//       unit: 'L/min',
//       createdDate: new Date('2024-01-15T10:00:00'),
//     },
//     {
//       id: '1002',
//       meterId: '1',
//       meterElementId: '101',
//       value: 99.2,
//       unit: 'L/min',
//       createdDate: new Date('2024-01-15T09:00:00'),
//     },
//   ];

//   const mockFavorites: Favorite[] = [
//     {
//       favorite_id: 1,
//       id1: parseInt(mockTenantId),
//       id2: parseInt(mockUserId),
//       id3: 1, // meter 1
//       id4: 0, // no sub-entity
//     },
//   ];

//   beforeEach(() => {
//     // Clear all mocks before each test
//     vi.clearAllMocks();

//     // Setup default mock implementations
//     vi.mocked(metersService.getMetersForTenant).mockResolvedValue(mockMeters);
//     vi.mocked(metersService.getMeterElements).mockImplementation((meterId) =>
//       Promise.resolve(mockElements[meterId] || [])
//     );
//     vi.mocked(metersService.getMeterElementReadings).mockResolvedValue(mockReadings);

//     vi.mocked(favoritesService.getFavorites).mockResolvedValue(mockFavorites);
//     vi.mocked(favoritesService.addFavorite).mockResolvedValue({
//       favorite_id: 2,
//       id1: parseInt(mockTenantId),
//       id2: parseInt(mockUserId),
//       id3: 2,
//       id4: 0,
//     });
//     vi.mocked(favoritesService.removeFavorite).mockResolvedValue(undefined);
//     vi.mocked(favoritesService.isFavorite).mockImplementation((favorites, entityId, subEntityId) =>
//       favorites.some(
//         (fav) =>
//           fav.id3 === entityId &&
//           (subEntityId === undefined ? fav.id4 === 0 : fav.id4 === subEntityId)
//       )
//     );

//     // Clear session storage
//     sessionStorage.clear();
//   });

//   afterEach(() => {
//     vi.clearAllMocks();
//   });

//   describe('Component Initialization', () => {
//     it('should load meters and favorites on mount', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       // Wait for loading to complete
//       await waitFor(() => {
//         expect(screen.queryByText('Loading meters...')).not.toBeInTheDocument();
//       });

//       // Verify services were called
//       expect(metersService.getMetersForTenant).toHaveBeenCalledWith(mockTenantId);
//       expect(favoritesService.getFavorites).toHaveBeenCalledWith(
//         parseInt(mockTenantId),
//         parseInt(mockUserId)
//       );
//     });

//     it('should display all meters after loading', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//         expect(screen.getByText('Electric Meter')).toBeInTheDocument();
//       });
//     });

//     it('should display loading indicator while fetching data', () => {
//       vi.mocked(metersService.getMetersForTenant).mockImplementation(
//         () => new Promise(() => {}) // Never resolves
//       );

//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       expect(screen.getByText('Loading meters...')).toBeInTheDocument();
//     });

//     it('should handle loading errors gracefully', async () => {
//       const errorMessage = 'Failed to load meters';
//       vi.mocked(metersService.getMetersForTenant).mockRejectedValue(new Error(errorMessage));

//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText(errorMessage)).toBeInTheDocument();
//       });
//     });

//     it('should provide retry button on error', async () => {
//       vi.mocked(metersService.getMetersForTenant).mockRejectedValueOnce(
//         new Error('Network error')
//       );

//       const { rerender } = render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText(/Network error/)).toBeInTheDocument();
//       });

//       // Reset mock to succeed on retry
//       vi.mocked(metersService.getMetersForTenant).mockResolvedValue(mockMeters);

//       const retryButton = screen.getByRole('button', { name: /retry/i });
//       fireEvent.click(retryButton);

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });
//     });
//   });

//   describe('Meter Expansion and Element Display', () => {
//     it('should expand meter and display elements when meter is clicked', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Click expand button for Water Meter
//       const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//       fireEvent.click(expandButtons[0]);

//       // Wait for elements to load and display
//       await waitFor(() => {
//         expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//         expect(screen.getByText('element-Pressure')).toBeInTheDocument();
//       });

//       // Verify getMeterElements was called
//       expect(metersService.getMeterElements).toHaveBeenCalledWith('1');
//     });

//     it('should collapse meter and hide elements when expanded meter is clicked again', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Expand meter
//       const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//       fireEvent.click(expandButtons[0]);

//       await waitFor(() => {
//         expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//       });

//       // Collapse meter
//       const collapsedButton = screen.getByRole('button', { name: /collapse meter/i });
//       fireEvent.click(collapsedButton);

//       // Elements should be hidden
//       await waitFor(() => {
//         expect(screen.queryByText('element-Flow Rate')).not.toBeInTheDocument();
//       });
//     });

//     it('should persist expanded state to session storage', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Expand meter
//       const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//       fireEvent.click(expandButtons[0]);

//       await waitFor(() => {
//         expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//       });

//       // Check session storage
//       const savedExpanded = sessionStorage.getItem(`expanded-meters-${mockTenantId}`);
//       expect(savedExpanded).toBeTruthy();
//       const expandedArray = JSON.parse(savedExpanded!);
//       expect(expandedArray).toContain('1');
//     });
  
//   });

//   describe('Element Selection and Readings Grid', () => {
//     it('should call onMeterElementSelect when element is clicked', async () => {
//       const onMeterElementSelect = vi.fn();

//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={onMeterElementSelect}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Expand meter
//       const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//       fireEvent.click(expandButtons[0]);

//       await waitFor(() => {
//         expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//       });

//       // Click element
//       const flowRateElement = screen.getByText('element-Flow Rate');
//       fireEvent.click(flowRateElement);

//       expect(onMeterElementSelect).toHaveBeenCalledWith('1', '101');
//     });

//     it('should highlight selected element', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Expand meter
//       const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//       fireEvent.click(expandButtons[0]);

//       await waitFor(() => {
//         expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//       });

//       // Click element
//       const flowRateElement = screen.getByText('element-Flow Rate').closest('.meter-element-content');
//       fireEvent.click(flowRateElement!);

//       // Check if selected class is applied
//       const elementItem = screen.getByText('element-Flow Rate').closest('.meter-element-item');
//       await waitFor(() => {
//         expect(elementItem).toHaveClass('selected');
//       });
//     });
//   });

//   describe('Favorites Management', () => {
//     it('should display favorite indicator for favorited items', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Water Meter (id: 1) is in mockFavorites, so it should show filled star
//       const favoriteIndicators = screen.getAllByText('★');
//       expect(favoriteIndicators.length).toBeGreaterThan(0);
//     });

//     it('should toggle favorite when star button is clicked', async () => {
//       vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Hover over meter to show favorite button
//       const meterItem = screen.getByText('Water Meter').closest('.meter-item');
//       fireEvent.mouseEnter(meterItem!);

//       // Click favorite button
//       const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
//       fireEvent.click(favoriteButton);

//       // Verify addFavorite was called
//       await waitFor(() => {
//         expect(favoritesService.addFavorite).toHaveBeenCalledWith(
//           parseInt(mockTenantId),
//           parseInt(mockUserId),
//           1,
//           undefined
//         );
//       });
//     });

//     it('should remove favorite when filled star is clicked', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Hover over meter to show favorite button
//       const meterItem = screen.getByText('Water Meter').closest('.meter-item');
//       fireEvent.mouseEnter(meterItem!);

//       // Click favorite button (should be filled since it's in mockFavorites)
//       // Use getAllByRole to get all buttons and find the one in the meter-item
//       const favoriteButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
//       const meterFavoriteButton = favoriteButtons.find((btn) => {
//         return btn.closest('.meter-item') === meterItem;
//       });
//       fireEvent.click(meterFavoriteButton!);

//       // Verify removeFavorite was called
//       await waitFor(() => {
//         expect(favoritesService.removeFavorite).toHaveBeenCalledWith(
//           parseInt(mockTenantId),
//           parseInt(mockUserId),
//           1,
//           undefined
//         );
//       });
//     });

//     it('should update favorites list after toggle', async () => {
//       const { rerender } = render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Initially Water Meter should be favorited
//       let favoriteIndicators = screen.getAllByText('★');
//       expect(favoriteIndicators.length).toBeGreaterThan(0);

//       // Mock getFavorites to return empty list after removal
//       vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//       // Hover and click favorite button
//       const meterItem = screen.getByText('Water Meter').closest('.meter-item');
//       fireEvent.mouseEnter(meterItem!);

//       // Use getAllByRole to get all buttons and find the one in the meter-item
//       const favoriteButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
//       const meterFavoriteButton = favoriteButtons.find((btn) => {
//         return btn.closest('.meter-item') === meterItem;
//       });
//       fireEvent.click(meterFavoriteButton!);

//       // Wait for favorites to be reloaded
//       await waitFor(() => {
//         expect(favoritesService.getFavorites).toHaveBeenCalledTimes(2); // Initial load + after toggle
//       });
//     });

//     it('should handle favorite toggle errors gracefully', async () => {
//       vi.mocked(favoritesService.removeFavorite).mockRejectedValue(
//         new Error('Failed to remove favorite')
//       );

//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Hover and click favorite button
//       const meterItem = screen.getByText('Water Meter').closest('.meter-item');
//       fireEvent.mouseEnter(meterItem!);

//       // Use getAllByRole to get all buttons and find the one in the meter-item
//       const favoriteButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
//       const meterFavoriteButton = favoriteButtons.find((btn) => {
//         return btn.closest('.meter-item') === meterItem;
//       });
//       fireEvent.click(meterFavoriteButton!);

//       // Error should be displayed
//       await waitFor(() => {
//         expect(screen.getByText(/Failed to remove favorite/)).toBeInTheDocument();
//       });
//     });
//   });

//   describe('Complete User Workflows', () => {
//     it('should complete full workflow: expand meter -> click element -> view readings', async () => {
//       const onMeterElementSelect = vi.fn();

//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={onMeterElementSelect}
//         />
//       );

//       // Wait for meters to load
//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Step 1: Expand meter
//       const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//       fireEvent.click(expandButtons[0]);

//       // Step 2: Wait for elements to appear
//       await waitFor(() => {
//         expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//       });

//       // Step 3: Click element
//       const flowRateElement = screen.getByText('element-Flow Rate');
//       fireEvent.click(flowRateElement);

//       // Step 4: Verify callback was called
//       expect(onMeterElementSelect).toHaveBeenCalledWith('1', '101');
//     });

//     it('should complete favorite workflow: mark favorite -> verify display -> remove favorite', async () => {
//       vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//       const { rerender } = render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Step 1: Mark as favorite
//       const meterItem = screen.getByText('Water Meter').closest('.meter-item');
//       fireEvent.mouseEnter(meterItem!);

//       const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
//       fireEvent.click(favoriteButton);

//       // Step 2: Verify addFavorite was called
//       await waitFor(() => {
//         expect(favoritesService.addFavorite).toHaveBeenCalled();
//       });

//       // Step 3: Mock getFavorites to return the new favorite
//       vi.mocked(favoritesService.getFavorites).mockResolvedValue([
//         {
//           favorite_id: 2,
//           id1: parseInt(mockTenantId),
//           id2: parseInt(mockUserId),
//           id3: 1,
//           id4: 0,
//         },
//       ]);

//       // Wait for favorites to be reloaded
//       await waitFor(() => {
//         expect(favoritesService.getFavorites).toHaveBeenCalledTimes(2);
//       });
//     });

//     it('should maintain state across multiple meter expansions', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//         expect(screen.getByText('Electric Meter')).toBeInTheDocument();
//       });

//       // Expand first meter
//       const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//       fireEvent.click(expandButtons[0]);

//       await waitFor(() => {
//         expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//       });

//       // Expand second meter
//       fireEvent.click(expandButtons[1]);

//       await waitFor(() => {
//         expect(screen.getByText('element-Voltage')).toBeInTheDocument();
//       });

//       // Both should remain expanded
//       expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//       expect(screen.getByText('element-Voltage')).toBeInTheDocument();

//       // Verify session storage has both
//       const savedExpanded = sessionStorage.getItem(`expanded-meters-${mockTenantId}`);
//       const expandedArray = JSON.parse(savedExpanded!);
//       expect(expandedArray).toContain('1');
//       expect(expandedArray).toContain('2');
//     });
//   });

//   describe('Data Flow Verification', () => {
//     it('should pass correct data to child components', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Verify meter data is displayed correctly
//       expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       expect(screen.getByText('Electric Meter')).toBeInTheDocument();

//       // Expand and verify element data
//       const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//       fireEvent.click(expandButtons[0]);

//       await waitFor(() => {
//         expect(screen.getByText('element-Flow Rate')).toBeInTheDocument();
//         expect(screen.getByText('element-Pressure')).toBeInTheDocument();
//       });
//     });

//     it('should correctly identify favorites and non-favorites', async () => {
//       render(
//         <SidebarMetersSection
//           tenantId={mockTenantId}
//           userId={mockUserId}
//           onMeterSelect={vi.fn()}
//           onMeterElementSelect={vi.fn()}
//         />
//       );

//       await waitFor(() => {
//         expect(screen.getByText('Water Meter')).toBeInTheDocument();
//       });

//       // Water Meter (id: 1) is favorited in mockFavorites
//       const waterMeterItem = screen.getByText('Water Meter').closest('.meter-item');
//       const favoriteIndicator = waterMeterItem?.querySelector('.favorite-indicator');
//       expect(favoriteIndicator).toBeInTheDocument();

//       // Electric Meter (id: 2) is not favorited
//       const electricMeterItem = screen.getByText('Electric Meter').closest('.meter-item');
//       const noFavoriteIndicator = electricMeterItem?.querySelector('.favorite-indicator');
//       expect(noFavoriteIndicator).not.toBeInTheDocument();
//     });
//   });
// });
