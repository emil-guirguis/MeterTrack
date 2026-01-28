import React, { useState } from 'react';
import { Alert, Button, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { FavoritesSectionProps } from './types';
import { StarIcon } from './StarIcon';
import './FavoritesSection.css';

/**
 * FavoritesSection Component
 * Displays a dedicated section for favorited meter elements
 * 
 * Requirements: 4.1, 4.3, 5.1, 5.2
 * 
 * Responsibilities:
 * - Display "Favorites" header that is visually distinct
 * - Render list of favorited meter elements
 * - Display empty state message when no favorites exist
 * - Format each favorite as "meter_name - element-element_name"
 * - Handle star icon clicks to remove favorites
 * - Handle item clicks to display meter readings grid
 */
export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favorites,
  onItemClick,
  onStarClick,
}) => {
  const [loadingStars, setLoadingStars] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * Create a click handler for star icon that removes the favorite
   * Requirements: 5.4
   */
  const createStarClickHandler = (favoriteId: number, meterId: number, elementId: number) => {
    return async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      
      console.log(`[FavoritesSection] Removing favorite - favoriteId: ${favoriteId}, meterId: ${meterId}, elementId: ${elementId}`);
      
      const key = `${meterId}:${elementId}`;
      setLoadingStars((prev) => new Set(prev).add(key));
      setErrors((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });

      try {
        await onStarClick(favoriteId, String(meterId), String(elementId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove from favorites';
        console.error(`[FavoritesSection] Error removing favorite ${key}:`, err);
        setErrors((prev) => {
          const next = new Map(prev);
          next.set(key, errorMessage);
          return next;
        });
      } finally {
        setLoadingStars((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    };
  };

  /**
   * Handle retry for a failed star click
   */
  const handleRetry = async (favoriteId: number, meterId: number, elementId: number) => {
    const key = `${meterId}:${elementId}`;
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    
    const handler = createStarClickHandler(favoriteId, meterId, elementId);
    await handler({ stopPropagation: () => {} } as React.MouseEvent<HTMLButtonElement>);
  };

  /**
   * Handle favorite item click - displays simple grid
   * Requirements: 5.3
   */
  const handleFavoriteItemClick = (meterId: number, elementId: number) => {
    console.log('[FavoritesSection] ===== FAVORITE CLICKED (SINGLE) =====');
    console.log('[FavoritesSection] meterId:', meterId, 'type:', typeof meterId);
    console.log('[FavoritesSection] elementId:', elementId, 'type:', typeof elementId);
    console.log('[FavoritesSection] Calling onItemClick with gridType: simple');
    onItemClick(String(meterId), String(elementId), 'simple');
    console.log('[FavoritesSection] ===== FAVORITE CLICK COMPLETE =====');
  };

  /**
   * Handle favorite item double-click - displays old grid
   * Requirements: 5.3
   */
  const handleFavoriteItemDoubleClick = (meterId: number, elementId: number) => {
    console.log('[FavoritesSection] ===== FAVORITE CLICKED (DOUBLE) =====');
    console.log('[FavoritesSection] meterId:', meterId, 'type:', typeof meterId);
    console.log('[FavoritesSection] elementId:', elementId, 'type:', typeof elementId);
    console.log('[FavoritesSection] Calling onItemClick with gridType: baselist');
    onItemClick(String(meterId), String(elementId), 'baselist');
    console.log('[FavoritesSection] ===== FAVORITE DOUBLE-CLICK COMPLETE =====');
  };

  
  // Don't render anything if there are no favorites
  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="favorites-section">
      {/* Favorites Header - visually distinct */}
      <div className="favorites-header">
        <h3 className="favorites-title">Favorites</h3>
        <IconButton
          size="small"
          onClick={() => setIsCollapsed(!isCollapsed)}
          sx={{ ml: 'auto' }}
        >
          {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </div>

      {/* Favorites List */}
      {!isCollapsed && (
        <div className="favorites-list">
        {favorites.map((favorite) => {
          const key = `${favorite.id1}:${favorite.id2}`;
          const isLoading = loadingStars.has(key);
          const error = errors.get(key);

          return (
            <div key={key} className="favorite-item">
              {/* Error Alert with Retry Option */}
              {error && (
                <Alert
                  severity="error"
                  onClose={() => {
                    setErrors((prev) => {
                      const next = new Map(prev);
                      next.delete(key);
                      return next;
                    });
                  }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => handleRetry(favorite.favorite_id, favorite.id1, favorite.id2)}
                      disabled={isLoading}
                    >
                      Retry
                    </Button>
                  }
                  sx={{ mb: 1 }}
                >
                  {error}
                </Alert>
              )}

              <div
                className="favorite-item-content"
                onClick={() => handleFavoriteItemClick(favorite.id1, favorite.id2)}
                onDoubleClick={() => handleFavoriteItemDoubleClick(favorite.id1, favorite.id2)}
              >
                {/* Favorite display text: "meter_name - element-element_name" */}
                {/* Provide fallback if favorite_name is undefined or empty */}
                <span className="favorite-item-text">
                  {favorite.favorite_name || `Meter ${favorite.id1} - Element ${favorite.id2}`}
                </span>
              </div>

              {/* Star Icon for removing favorite */}
              <StarIcon
                id1={String(favorite.id1)}
                id2={String(favorite.id2)}
                is_favorited={true}
                is_loading={isLoading}
                on_click={createStarClickHandler(favorite.favorite_id, favorite.id1, favorite.id2)}
              />
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
