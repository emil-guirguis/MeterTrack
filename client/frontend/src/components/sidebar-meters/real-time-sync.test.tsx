// import { describe, it, expect, vi, beforeEach } from 'vitest';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { SidebarMetersSection } from './SidebarMetersSection';
// import { metersService } from '../../services/metersService';
// import { favoritesService } from '../../services/favoritesService';
// import type { Meter, MeterElement, Favorite } from './types';

// // Mock the services
// vi.mock('../../services/metersService');
// vi.mock('../../services/favoritesService');

// /**
//  * Real-Time Synchronization Tests for Task 9.1
//  * 
//  * Validates that the Favorites section updates immediately when:
//  * 1. A favorite is added from meter elements
//  * 2. A favorite is removed from meter elements
//  * 3. A favorite is added from Favorites section
//  * 4. A favorite is removed from Favorites section
//  * 
//  * Requirements: 6.1, 6.2, 6.3, 6.4
//  */
// describe('Task 9.1: Real-Time Favorites Section Updates', () => {
//   const mockTenantId = '1';
//   const mockUserId = '100';

//   const mockMeters: Meter[] = [
//     {
//       id: '1',
//       tenantId: mockTenantId,
//       name: 'Power Meter',
//       description: 'Main power meter',
//       createdDate: new Date('2024-01-01'),
//       updatedDate: new Date('2024-01-01'),
//     },
//     {
//       id: '2',
//       tenantId: mockTenantId,
//       name: 'Energy Meter',
//       description: 'Energy consumption meter',
//       createdDate: new Date('2024-01-02'),
//       updatedDate: new Date('2024-01-02'),
//     },
//   ];

//   const mockElements: { [meterId: string]: MeterElement[] } = {
//     '1': [
//       {
//         id: '101',
//         meterId: '1',
//         name: 'power',
//         description: 'Power reading',
//         createdDate: new Date('2024-01-01'),
//         updatedDate: new Date('2024-01-01'),
//       },
//       {
//         id: '102',
//         meterId: '1',
//         name: 'voltage',
//         description: 'Voltage reading',
//         createdDate: new Date('2024-01-01'),
//         updatedDate: new Date('2024-01-01'),
//       },
//     ],
//     '2': [
//       {
//         id: '201',
//         meterId: '2',
//         name: 'energy',
//         description: 'Energy reading',
//         createdDate: new Date('2024-01-02'),
//         updatedDate: new Date('2024-01-02'),
//       },
//     ],
//   };

//   beforeEach(() => {
//     vi.clearAllMocks();

//     // Setup default mock implementations
//     vi.mocked(metersService.getMetersForTenant).mockResolvedValue(mockMeters);
//     vi.mocked(metersService.getMeterElements).mockImplementation((meterId) =>
//       Promise.resolve(mockElements[meterId] || [])
//     );

//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);
//     vi.mocked(favoritesService.addFavorite).mockResolvedValue({
//       favorite_id: 1,
//       id1: parseInt(mockTenantId),
//       id2: parseInt(mockUserId),
//       id3: 1,
//       id4: 101,
//     });
//     vi.mocked(favoritesService.removeFavorite).mockResolvedValue(undefined);
//     vi.mocked(favoritesService.isFavorite).mockImplementation((favorites, entityId, subEntityId) =>
//       favorites.some(
//         (fav) =>
//           fav.id3 === entityId &&
//           (subEntityId === undefined ? fav.id4 === 0 : fav.id4 === subEntityId)
//       )
//     );

//     sessionStorage.clear();
//   });

//   /**
//    * Requirement 6.1: When a favorite is added from meter elements,
//    * the Favorites section SHALL update immediately without requiring a page refresh
//    */
//   it('should update Favorites section immediately when favorite is added from meter elements', async () => {
//     // Start with no favorites
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//     const { rerender } = render(
//       <SidebarMetersSection
//         tenantId={mockTenantId}
//         userId={mockUserId}
//         onMeterSelect={vi.fn()}
//         onMeterElementSelect={vi.fn()}
//       />
//     );

//     // Wait for initial load
//     await waitFor(() => {
//       expect(screen.getByText('Power Meter')).toBeInTheDocument();
//     });

//     // Verify Favorites section shows empty state
//     expect(screen.getByText('No favorites yet. Click the star icon to add favorites.')).toBeInTheDocument();

//     // Expand meter to show elements
//     const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//     fireEvent.click(expandButtons[0]);

//     await waitFor(() => {
//       expect(screen.getByText('element-power')).toBeInTheDocument();
//     });

//     // Mock getFavorites to return the new favorite after add
//     const newFavorite: Favorite = {
//       favorite_id: 1,
//       id1: parseInt(mockTenantId),
//       id2: parseInt(mockUserId),
//       id3: 1,
//       id4: 101,
//     };
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([newFavorite]);

//     // Click star icon to add favorite
//     const starButtons = screen.getAllByRole('button', { name: /add to favorites/i });
//     const powerStarButton = starButtons.find((btn) => {
//       return btn.closest('.meter-element-item') !== null;
//     });
//     fireEvent.click(powerStarButton!);

//     // Verify addFavorite was called
//     await waitFor(() => {
//       expect(favoritesService.addFavorite).toHaveBeenCalled();
//     });

//     // Verify Favorites section updates immediately with the new favorite
//     await waitFor(() => {
//       expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
//     });

//     // Verify empty state is gone
//     expect(screen.queryByText('No favorites yet. Click the star icon to add favorites.')).not.toBeInTheDocument();
//   });

//   /**
//    * Requirement 6.2: When a favorite is removed from meter elements,
//    * the Favorites section SHALL update immediately without requiring a page refresh
//    */
//   it('should update Favorites section immediately when favorite is removed from meter elements', async () => {
//     // Start with one favorite
//     const initialFavorite: Favorite = {
//       favorite_id: 1,
//       id1: parseInt(mockTenantId),
//       id2: parseInt(mockUserId),
//       id3: 1,
//       id4: 101,
//     };
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([initialFavorite]);

//     render(
//       <SidebarMetersSection
//         tenantId={mockTenantId}
//         userId={mockUserId}
//         onMeterSelect={vi.fn()}
//         onMeterElementSelect={vi.fn()}
//       />
//     );

//     // Wait for initial load
//     await waitFor(() => {
//       expect(screen.getByText('Power Meter')).toBeInTheDocument();
//     });

//     // Verify Favorites section shows the favorite
//     await waitFor(() => {
//       expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
//     });

//     // Expand meter to show elements
//     const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//     fireEvent.click(expandButtons[0]);

//     await waitFor(() => {
//       expect(screen.getByText('element-power')).toBeInTheDocument();
//     });

//     // Mock getFavorites to return empty list after removal
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//     // Click star icon to remove favorite
//     const starButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
//     const powerStarButton = starButtons.find((btn) => {
//       return btn.closest('.meter-element-item') !== null;
//     });
//     fireEvent.click(powerStarButton!);

//     // Verify removeFavorite was called
//     await waitFor(() => {
//       expect(favoritesService.removeFavorite).toHaveBeenCalled();
//     });

//     // Verify Favorites section updates immediately - favorite is removed
//     await waitFor(() => {
//       expect(screen.queryByText(/Power Meter - element-power/)).not.toBeInTheDocument();
//     });

//     // Verify empty state is shown
//     expect(screen.getByText('No favorites yet. Click the star icon to add favorites.')).toBeInTheDocument();
//   });

//   /**
//    * Requirement 6.3: When a favorite is added from Favorites section,
//    * the corresponding star icon in the meter elements section SHALL update immediately
//    */
//   it('should update star icon in meter elements when favorite is added from Favorites section', async () => {
//     // Start with no favorites
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//     render(
//       <SidebarMetersSection
//         tenantId={mockTenantId}
//         userId={mockUserId}
//         onMeterSelect={vi.fn()}
//         onMeterElementSelect={vi.fn()}
//       />
//     );

//     // Wait for initial load
//     await waitFor(() => {
//       expect(screen.getByText('Power Meter')).toBeInTheDocument();
//     });

//     // Expand meter to show elements
//     const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//     fireEvent.click(expandButtons[0]);

//     await waitFor(() => {
//       expect(screen.getByText('element-power')).toBeInTheDocument();
//     });

//     // Verify star icon is outlined (not favorited)
//     const outlinedStars = screen.getAllByTestId(/star-icon-outlined/);
//     expect(outlinedStars.length).toBeGreaterThan(0);

//     // Mock getFavorites to return the new favorite
//     const newFavorite: Favorite = {
//       favorite_id: 1,
//       id1: parseInt(mockTenantId),
//       id2: parseInt(mockUserId),
//       id3: 1,
//       id4: 101,
//     };
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([newFavorite]);

//     // Click star icon to add favorite
//     const starButtons = screen.getAllByRole('button', { name: /add to favorites/i });
//     const powerStarButton = starButtons.find((btn) => {
//       return btn.closest('.meter-element-item') !== null;
//     });
//     fireEvent.click(powerStarButton!);

//     // Verify addFavorite was called
//     await waitFor(() => {
//       expect(favoritesService.addFavorite).toHaveBeenCalled();
//     });

//     // Verify star icon updates to filled immediately
//     await waitFor(() => {
//       const filledStars = screen.getAllByTestId('star-icon-filled-1-101');
//       // Should have at least one filled star (in meter element)
//       expect(filledStars.length).toBeGreaterThan(0);
//     });
//   });

//   /**
//    * Requirement 6.4: When a favorite is removed from Favorites section,
//    * the corresponding star icon in the meter elements section SHALL update immediately
//    */
//   it('should update star icon in meter elements when favorite is removed from Favorites section', async () => {
//     // Start with one favorite
//     const initialFavorite: Favorite = {
//       favorite_id: 1,
//       id1: parseInt(mockTenantId),
//       id2: parseInt(mockUserId),
//       id3: 1,
//       id4: 101,
//     };
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([initialFavorite]);

//     render(
//       <SidebarMetersSection
//         tenantId={mockTenantId}
//         userId={mockUserId}
//         onMeterSelect={vi.fn()}
//         onMeterElementSelect={vi.fn()}
//       />
//     );

//     // Wait for initial load
//     await waitFor(() => {
//       expect(screen.getByText('Power Meter')).toBeInTheDocument();
//     });

//     // Verify Favorites section shows the favorite
//     await waitFor(() => {
//       expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
//     });

//     // Expand meter to show elements
//     const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//     fireEvent.click(expandButtons[0]);

//     await waitFor(() => {
//       expect(screen.getByText('element-power')).toBeInTheDocument();
//     });

//     // Verify star icon is filled (favorited)
//     const filledStars = screen.getAllByTestId('star-icon-filled-1-101');
//     expect(filledStars.length).toBeGreaterThan(0);

//     // Mock getFavorites to return empty list after removal
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//     // Click star icon in Favorites section to remove favorite
//     const favoriteStarButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
//     const favoriteSectionStarButton = favoriteStarButtons.find((btn) => {
//       return btn.closest('.favorite-item') !== null;
//     });
//     fireEvent.click(favoriteSectionStarButton!);

//     // Verify removeFavorite was called
//     await waitFor(() => {
//       expect(favoritesService.removeFavorite).toHaveBeenCalled();
//     });

//     // Verify star icon in meter elements updates to outlined immediately
//     await waitFor(() => {
//       const outlinedStars = screen.getAllByTestId('star-icon-outlined-1-101');
//       expect(outlinedStars.length).toBeGreaterThan(0);
//     });

//     // Verify filled star is gone from meter element (but may still be in Favorites section during transition)
//     // Just verify that the meter element star is outlined
//     const meterElementStars = screen.getAllByTestId('star-icon-outlined-1-101');
//     expect(meterElementStars.length).toBeGreaterThan(0);
//   });

//   /**
//    * Integration test: Complete round-trip synchronization
//    * Add favorite from meter -> verify in Favorites section
//    * Remove favorite from Favorites section -> verify in meter
//    */
//   it('should maintain real-time sync through complete add/remove cycle', async () => {
//     // Start with no favorites
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//     render(
//       <SidebarMetersSection
//         tenantId={mockTenantId}
//         userId={mockUserId}
//         onMeterSelect={vi.fn()}
//         onMeterElementSelect={vi.fn()}
//       />
//     );

//     // Wait for initial load
//     await waitFor(() => {
//       expect(screen.getByText('Power Meter')).toBeInTheDocument();
//     });

//     // Step 1: Expand meter
//     const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//     fireEvent.click(expandButtons[0]);

//     await waitFor(() => {
//       expect(screen.getByText('element-power')).toBeInTheDocument();
//     });

//     // Step 2: Add favorite from meter element
//     const newFavorite: Favorite = {
//       favorite_id: 1,
//       id1: parseInt(mockTenantId),
//       id2: parseInt(mockUserId),
//       id3: 1,
//       id4: 101,
//     };
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([newFavorite]);

//     const starButtons = screen.getAllByRole('button', { name: /add to favorites/i });
//     const powerStarButton = starButtons.find((btn) => {
//       return btn.closest('.meter-element-item') !== null;
//     });
//     fireEvent.click(powerStarButton!);

//     // Step 3: Verify favorite appears in Favorites section
//     await waitFor(() => {
//       expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
//     });

//     // Step 4: Remove favorite from Favorites section
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//     const favoriteStarButtons = screen.getAllByRole('button', { name: /remove from favorites/i });
//     const favoriteSectionStarButton = favoriteStarButtons.find((btn) => {
//       return btn.closest('.favorite-item') !== null;
//     });
//     fireEvent.click(favoriteSectionStarButton!);

//     // Step 5: Verify favorite is removed from both sections
//     await waitFor(() => {
//       expect(screen.queryByText(/Power Meter - element-power/)).not.toBeInTheDocument();
//     });

//     // Verify star icon is outlined again
//     const outlinedStars = screen.getAllByTestId('star-icon-outlined-1-101');
//     expect(outlinedStars.length).toBeGreaterThan(0);
//   });

//   /**
//    * Test multiple favorites sync simultaneously
//    */
//   it('should sync multiple favorites simultaneously', async () => {
//     // Start with no favorites
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue([]);

//     render(
//       <SidebarMetersSection
//         tenantId={mockTenantId}
//         userId={mockUserId}
//         onMeterSelect={vi.fn()}
//         onMeterElementSelect={vi.fn()}
//       />
//     );

//     // Wait for initial load
//     await waitFor(() => {
//       expect(screen.getByText('Power Meter')).toBeInTheDocument();
//     });

//     // Expand both meters
//     const expandButtons = screen.getAllByRole('button', { name: /expand meter/i });
//     fireEvent.click(expandButtons[0]);
//     fireEvent.click(expandButtons[1]);

//     await waitFor(() => {
//       expect(screen.getByText('element-power')).toBeInTheDocument();
//       expect(screen.getByText('element-energy')).toBeInTheDocument();
//     });

//     // Add two favorites
//     const multipleFavorites: Favorite[] = [
//       {
//         favorite_id: 1,
//         id1: parseInt(mockTenantId),
//         id2: parseInt(mockUserId),
//         id3: 1,
//         id4: 101,
//       },
//       {
//         favorite_id: 2,
//         id1: parseInt(mockTenantId),
//         id2: parseInt(mockUserId),
//         id3: 2,
//         id4: 201,
//       },
//     ];
//     vi.mocked(favoritesService.getFavorites).mockResolvedValue(multipleFavorites);

//     // Click star icons to add favorites
//     const starButtons = screen.getAllByRole('button', { name: /add to favorites/i });
//     fireEvent.click(starButtons[0]);

//     await waitFor(() => {
//       expect(favoritesService.addFavorite).toHaveBeenCalled();
//     });

//     // Reset and add second favorite
//     vi.mocked(favoritesService.addFavorite).mockClear();
//     fireEvent.click(starButtons[1]);

//     await waitFor(() => {
//       expect(favoritesService.addFavorite).toHaveBeenCalled();
//     });

//     // Verify both favorites appear in Favorites section
//     await waitFor(() => {
//       expect(screen.getByText(/Power Meter - element-power/)).toBeInTheDocument();
//       expect(screen.getByText(/Energy Meter - element-energy/)).toBeInTheDocument();
//     });
//   });
// });
