import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { SidebarMetersProps, Meter, Favorite, SelectedItem, FavoriteDisplay, MeterElement } from './types';
import { MetersList } from './MetersList';
import { FavoritesSection } from './FavoritesSection';
import { favoritesService } from '../../services/favoritesService';
import { validateTenantId, validateUserId, handleApiError } from './errorHandling';
import './SidebarMetersSection.css';

/**
 * SidebarMetersSection Component
 * Main container component that manages the sidebar section
 * Handles data loading, state management, and user interactions
 */
export const SidebarMetersSection: React.FC<SidebarMetersProps> = ({
  tenantId,
  userId,
  onMeterSelect,
  onMeterElementSelect,
}) => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [meterElements, setMeterElements] = useState<{ [meterId: string]: MeterElement[] }>({});
  const [expandedMeters, setExpandedMeters] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load meters and favorites from API
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      validateTenantId(tenantId);
      validateUserId(userId);

      // Load meters with elements and favorite status in one call
      const metersData = await favoritesService.getMetersWithElements(parseInt(tenantId), parseInt(userId));
      
      // Extract meters and elements from the response
      const meters = metersData.map(m => ({
        id: m.id,
        name: m.name,
        tenantId,
        createdDate: new Date(),
        updatedDate: new Date()
      }));

      // Flatten elements for easier access
      const allElements: { [meterId: string]: any[] } = {};
      const allFavorites: any[] = [];
      
      metersData.forEach((meter: any) => {
        allElements[meter.id] = meter.elements || [];
        meter.elements?.forEach((el: any) => {
          if (el.is_favorited && el.favorite_id) {
            allFavorites.push({
              favorite_id: el.favorite_id,
              tenant_id: parseInt(tenantId),
              users_id: parseInt(userId),
              table_name: 'meter',
              id1: meter.id,
              id2: el.meter_element_id,
              favorite_name: el.favorite_name || `${meter.name} - Unknown Element`
            });
          }
        });
      });

      setMeters(meters);
      setFavorites(allFavorites);
      setMeterElements(allElements);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      console.error('Error loading meters:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId]);

  /**
   * Load meters and favorites on component mount
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Handle meter expansion/collapse
   */
  const handleMeterExpand = useCallback((meterId: string) => {
    setExpandedMeters((prev) => {
      const next = new Set(prev);
      if (next.has(meterId)) {
        next.delete(meterId);
      } else {
        next.add(meterId);
      }
      // Save to session storage
      sessionStorage.setItem(`expanded-meters-${tenantId}`, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [tenantId]);

  /**
   * Handle meter selection
   */
  const handleMeterSelect = useCallback(
    (meterId: string) => {
      setSelectedItem({ type: 'meter', meterId });
      onMeterSelect(meterId);
    },
    [onMeterSelect]
  );

  /**
   * Handle meter element selection
   */
  const handleMeterElementSelect = useCallback(
    (meterId: string, elementId: string) => {
      setSelectedItem({ type: 'element', meterId, elementId });
      onMeterElementSelect(meterId, elementId);
    },
    [onMeterElementSelect]
  );

  /**
   * Handle favorite toggle - toggles favorite status for a meter element
   * Requirements: 2.1, 2.3, 2.5
   * 
   * If element is not favorited: call add_favorite() and update state to filled
   * If element is favorited: call remove_favorite() and update state to outlined
   * Set is_loading to true during operation (handled by caller)
   * Set is_loading to false after operation completes (handled by caller)
   */
  const handleFavoriteToggle = useCallback(
    async (meterId: string, elementId?: string) => {
      try {
        const meterIdNum = parseInt(meterId);
        const elementIdNum = elementId ? parseInt(elementId) : undefined;
        console.log('[SidebarMetersSection.handleFavoriteToggle] Called with meterId:', meterId, 'elementId:', elementId, 'parsed:', meterIdNum, elementIdNum);
        const isFavorite = favoritesService.isFavorite(favorites, meterIdNum, elementIdNum);

        if (isFavorite) {
          // Remove favorite
          await favoritesService.removeFavorite(
            parseInt(tenantId),
            parseInt(userId),
            'meter',
            meterIdNum,
            elementIdNum
          );
        } else {
          // Add favorite
          console.log('[SidebarMetersSection.handleFavoriteToggle] Adding favorite with elementIdNum:', elementIdNum, 'elementId:', elementId);
          await favoritesService.addFavorite(
            parseInt(tenantId),
            parseInt(userId),
            'meter',
            meterIdNum,
            elementIdNum
          );
        }

        // Reload favorites
        const updatedFavorites = await favoritesService.getFavorites(
          parseInt(tenantId),
          parseInt(userId)
        );
        setFavorites(updatedFavorites);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update favorite';
        setError(message);
        console.error('Error updating favorite:', err);
        // Show error toast (could be implemented with a toast library)
      }
    },
    [tenantId, userId, favorites]
  );

  /**
   * Create FavoriteDisplay objects from favorites
   * Requirements: 4.2, 5.1, 5.2
   */
  const favoriteDisplays = useMemo<FavoriteDisplay[]>(() => {
    return favorites.map((fav) => {
      return {
        favorite_id: fav.favorite_id,
        id1: fav.id1,
        id2: fav.id2,
        favorite_name: fav.favorite_name || '',
      };
    });
  }, [favorites]);

  /**
   * Handle favorite item click from FavoritesSection
   * Requirements: 5.3
   */
  const handleFavoritesItemClick = useCallback(
    (meterId: string, elementId: string, gridType?: 'simple' | 'baselist') => {
      console.log('[SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====');
      console.log('[SidebarMetersSection] meterId:', meterId, 'type:', typeof meterId);
      console.log('[SidebarMetersSection] elementId:', elementId, 'type:', typeof elementId);
      console.log('[SidebarMetersSection] gridType:', gridType);
      console.log('[SidebarMetersSection] Setting selected item and calling onMeterElementSelect');
      setSelectedItem({ type: 'element', meterId, elementId });
      onMeterElementSelect(meterId, elementId, gridType);
      console.log('[SidebarMetersSection] ===== FAVORITE ITEM CLICK COMPLETE =====');
    },
    [onMeterElementSelect]
  );

  /**
   * Handle star click from FavoritesSection
   * Requirements: 5.4, 6.2
   * 
   * When clicking a star in the FavoritesSection, it's always a removal
   * since only favorited items are shown there
   */
  const handleFavoritesStarClick = useCallback(
    async (favoriteId: number, meterId: string, elementId: string) => {
      const meterIdNum = parseInt(meterId);
      const elementIdNum = parseInt(elementId);

      try {
        // Remove favorite from database using favorite_id
        await favoritesService.removeFavoriteById(
          favoriteId,
          parseInt(tenantId)
        );
      } catch (err) {
        console.error('Error removing favorite:', err);
        // Re-throw so FavoritesSection can handle the error
        throw err;
      }

      // Update favorites list by removing the item
      setFavorites((prev) =>
        prev.filter(
          (fav) => !(fav.id1 === meterIdNum && fav.id2 === elementIdNum)
        )
      );

      // Update meterElements to reflect unfavorited status
      setMeterElements((prev) => {
        const updated = { ...prev };
        if (updated[meterIdNum]) {
          updated[meterIdNum] = updated[meterIdNum].map((el) =>
            el.meter_element_id === elementIdNum
              ? { ...el, is_favorited: false }
              : el
          );
        }
        return updated;
      });
    },
    [tenantId]
  );

  /**
   * Restore expanded meters from session storage on mount
   */
  useEffect(() => {
    const savedExpanded = sessionStorage.getItem(`expanded-meters-${tenantId}`);
    if (savedExpanded) {
      try {
        const expandedArray = JSON.parse(savedExpanded);
        setExpandedMeters(new Set(expandedArray));
      } catch (err) {
        console.error('Error restoring expanded meters:', err);
      }
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="sidebar-meters-section">
        <div className="loading-state">Loading meters...</div>
      </div>
    );
  }

  return (
    <div className="sidebar-meters-section">
      {error && (
        <div className="error-state">
          <div className="error-message">{error}</div>
          <button className="retry-button" onClick={loadData} type="button">
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* FavoritesSection - only display if there are favorites */}
          {favoriteDisplays.length > 0 && (
            <FavoritesSection
              favorites={favoriteDisplays}
              meters={meters}
              meterElements={meterElements}
              onItemClick={handleFavoritesItemClick}
              onStarClick={handleFavoritesStarClick}
            />
          )}

          {/* MetersList - displays all meters and their elements */}
          <MetersList
            meters={meters}
            favorites={favorites}
            meterElements={meterElements}
            expandedMeters={expandedMeters}
            selectedItem={selectedItem}
            onMeterExpand={handleMeterExpand}
            onMeterSelect={handleMeterSelect}
            onMeterElementSelect={handleMeterElementSelect}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </>
      )}
    </div>
  );
};
